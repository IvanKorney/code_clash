import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import axios from "axios";
import { problems } from "../src/db/schema";
import type { TestCase } from "../src/types/problem";
import type { Difficulty } from "../src/lib/consts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const API_BASE = "https://alfa-leetcode-api.onrender.com";
const LIMIT_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 120,
  medium: 120,
  hard: 120,
};

const HTML_TAG_REGEX = /<[^>]+>/g;
const OUTPUT_REGEX = /Output:\s*([\s\S]+?)(?=Explanation:|$)/;
const PRE_BLOCK_REGEX = /<pre>([\s\S]*?)<\/pre>/gi;
const CONSTRAINTS_REGEX = /Constraints:<\/strong>([\s\S]*?)<\/ul>/;
const WHITESPACE_REGEX = /\s+/g;

interface ProblemListItem {
  acRate: number;
  isPaidOnly: boolean;
  titleSlug: string;
}

interface ProblemListResponse {
  problemsetQuestionList?: ProblemListItem[];
}

interface TopicTag {
  name: string;
  slug: string;
}

interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

interface MetaData {
  name: string;
  params: { name: string; type: string }[];
  return: { type: string };
  manual?: boolean;
}

interface RawQuestion {
  title?: string;
  titleSlug: string;
  content?: string;
  topicTags?: TopicTag[];
  hints?: string[];
  codeSnippets?: CodeSnippet[];
  metaData?: string;
  exampleTestcases?: string;
}

interface RawDetailResponse {
  question: RawQuestion;
}

// Parse expected outputs from HTML <pre> blocks
const parseExpectedOutputs = (html: string): string[] => {
  const outputs: string[] = [];
  const preBlocks = html.match(PRE_BLOCK_REGEX) ?? [];
  for (const block of preBlocks) {
    const text = block.replace(HTML_TAG_REGEX, "");
    const match = text.match(OUTPUT_REGEX);
    if (match) outputs.push(match[1].trim());
  }
  return outputs;
};

// Split detail exampleTestcases string into per-test-case inputs using param count
const splitInputs = (detail: string, paramCount: number): string[] => {
  if (!detail || paramCount === 0) return [];
  const lines = detail.split("\n");
  const cases: string[] = [];
  for (let i = 0; i + paramCount <= lines.length; i += paramCount) {
    cases.push(lines.slice(i, i + paramCount).join("\n"));
  }
  return cases;
};

const parseConstraints = (html: string): string | null => {
  const match = html.match(CONSTRAINTS_REGEX);
  if (!match) return null;
  return match[1]
    .replace(HTML_TAG_REGEX, " ")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
};

const seed = async () => {
  const client = postgres(process.env.DATABASE_URL!, { ssl: "require" });
  const db = drizzle(client);

  const difficulty = "hard";

  console.log(`\nFetching ${difficulty} problems...`);

  const listData = (
    await axios.get<ProblemListResponse>(`${API_BASE}/problems`, {
      params: {
        limit: LIMIT_BY_DIFFICULTY[difficulty],
        difficulty: difficulty.toUpperCase(),
      },
    })
  ).data;
  const problemList = (listData.problemsetQuestionList ?? []).filter(
    (p) => !p.isPaidOnly,
  );
  console.log(`Found ${problemList.length} free problems`);

  for (const p of problemList) {
    const detail = (
      await axios.get<RawDetailResponse>(`${API_BASE}/select/raw`, {
        params: { titleSlug: p.titleSlug },
      })
    ).data.question;

    const title = detail.title;
    const description = detail.content;

    if (!title || !description) {
      console.log(` ⚠ Skipping ${p.titleSlug} (missing data)`);
      continue;
    }

    const metaData: MetaData | null = (() => {
      try {
        return detail.metaData
          ? (JSON.parse(detail.metaData) as MetaData)
          : null;
      } catch {
        return null;
      }
    })();

    if (!metaData || metaData.manual || !Array.isArray(metaData.params)) {
      console.log(` ⚠ Skipping ${p.titleSlug} (no metaData or manual)`);
      continue;
    }

    const inputs = splitInputs(
      detail.exampleTestcases ?? "",
      metaData.params.length,
    );
    const expectedOutputs = parseExpectedOutputs(description);

    const testCases: TestCase[] = inputs
      .map((input, i) =>
        expectedOutputs[i] != null
          ? { input, expected_output: expectedOutputs[i] }
          : null,
      )
      .filter((tc): tc is TestCase => tc !== null);

    if (testCases.length === 0) {
      console.log(` ⚠ Skipping ${p.titleSlug} (no parseable test cases)`);
      continue;
    }

    await db
      .insert(problems)
      .values({
        id: crypto.randomUUID(),
        title,
        slug: detail.titleSlug,
        difficulty,
        acceptanceRate: p.acRate,
        description,
        examples: testCases.slice(0, 2),
        constraints: parseConstraints(description),
        tags: detail.topicTags?.map((t) => t.slug) ?? [],
        topicTags:
          detail.topicTags?.map((t) => ({ name: t.name, slug: t.slug })) ?? [],
        hints: detail.hints ?? [],
        testCases,
        codeSnippets: (detail.codeSnippets ?? []).map(({ langSlug, code }) => ({
          langSlug,
          code,
        })),
        metaData,
        isActive: true,
      })
      .onConflictDoNothing();

    console.log(`  ✓ ${title} (${testCases.length} test cases)`);
    await sleep(300);
  }

  await client.end();
  console.log("\nSeeding complete!");
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
