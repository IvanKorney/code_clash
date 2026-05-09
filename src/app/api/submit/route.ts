import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/db/db";
import { roomPlayers, problems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { buildDriverCode, type ProblemMeta } from "@/lib/driver";
import { PISTON_LANG } from "@/lib/consts";
import { resolveMatch } from "@/lib/resolve";
import axios from "axios";
import type { Language, TestCase } from "@/types/problem";

const decodeHtml = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const runCase = async (
  wrappedCode: string,
  lang: { language: string; version: string },
  stdin: string,
): Promise<{ stdout: string; stderr: string }> => {
  try {
    const { data } = await axios.post(
      process.env.PISTON_URL ?? "http://localhost:2000/api/v2/execute",
      {
        language: lang.language,
        version: lang.version,
        files: [{ content: wrappedCode }],
        stdin,
      },
    );
    return {
      stdout: data.run?.stdout?.trim() ?? "",
      stderr: data.compile?.stderr?.trim() ?? data.run?.stderr?.trim() ?? "",
    };
  } catch {
    return { stdout: "", stderr: "" };
  }
};

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`submit:${session.user.id}`, 5, 15_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { code, language, roomId, problemSlug } = await request.json();

  const lang = PISTON_LANG[language];

  const problem = await db.query.problems.findFirst({
    where: eq(problems.slug, problemSlug),
    columns: { testCases: true, metaData: true },
  });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const testCases = problem.testCases as TestCase[];
  const metaData = problem.metaData as ProblemMeta;
  const wrappedCode = buildDriverCode(
    code as string,
    language as Language,
    metaData,
  );

  const results = await Promise.all(
    testCases.map(async (tc, i) => {
      const input = decodeHtml(tc.input);
      const { stdout, stderr } = await runCase(wrappedCode, lang, input);
      const expected = decodeHtml(tc.expected_output.trim());
      const passed = stdout === expected;
      return {
        index: i,
        input,
        expected,
        actual: stdout,
        stderr,
        passed,
      };
    }),
  );

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === testCases.length;

  await db
    .update(roomPlayers)
    .set({
      testCasesPassed: passed,
      totalTestCases: testCases.length,
      language: language,
      ...(allPassed
        ? { hasPassed: true, finishedAt: new Date(), solution: code }
        : {}),
    })
    .where(
      and(
        eq(roomPlayers.roomId, roomId),
        eq(roomPlayers.userId, session.user.id),
      ),
    );

  if (allPassed) {
    resolveMatch(roomId, "completed").catch(console.error);
  }

  return NextResponse.json({
    passed,
    total: testCases.length,
    allPassed,
    cases: results,
  });
};
