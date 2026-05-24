import { db } from "@/db/db";
import { problems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { buildDriverCode, type ProblemMeta } from "@/lib/driver";
import { PISTON_LANG } from "@/lib/consts";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import axios from "axios";

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await rateLimit(`execute:${session.user.id}`, 5, 15_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { code, language, stdin, problemSlug } = await request.json();

  const lang = PISTON_LANG[language as string];
  if (!lang)
    return NextResponse.json(
      { error: "Unsupported language" },
      { status: 400 },
    );

  const problem = await db.query.problems.findFirst({
    where: eq(problems.slug, problemSlug as string),
    columns: { metaData: true },
  });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const wrappedCode = buildDriverCode(code, language, problem.metaData as ProblemMeta);

  try {
    const { data } = await axios.post(
      process.env.PISTON_URL ?? "http://localhost:2000/api/v2/execute",
      {
        language: lang.language,
        version: lang.version,
        files: [{ content: wrappedCode }],
        stdin: stdin ?? "",
      },
    );

    return NextResponse.json({
      stdout: data.run?.stdout ?? "",
      stderr: data.compile?.stderr?.trim() || data.run?.stderr || "",
      exitCode: data.run?.code ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Execution failed" }, { status: 502 });
  }
};
