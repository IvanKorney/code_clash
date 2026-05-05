import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import axios from "axios";
import { problems } from "../src/db/schema";
import { DIFFICULTIES } from "../src/lib/consts";
import type { Difficulty, TestCase } from "../src/types/problem";

const API_BASE = "https://alfa-leetcode-api.onrender.com";
const LIMIT_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 120,
  MEDIUM: 120,
  HARD: 120,
};

const PRE_BLOCK_REGEX = /<pre>([\s\S]*?)<\/pre>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;
const INPUT_REGEX = /Input:\s*([\s\S]+?)(?=Output:)/;
const OUTPUT_REGEX = /Output:\s*([\s\S]+?)(?=Explanation:|$)/;
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

interface ProblemDetailResponse {
  questionTitle?: string;
  title?: string;
  titleSlug: string;
  question: string;
  topicTags?: TopicTag[];
  hints?: string[];
}

const parseTestCases = (html: string): TestCase[] => {
  const cases: TestCase[] = [];
  const preBlocks = html.match(PRE_BLOCK_REGEX) ?? [];

  for (const block of preBlocks) {
    const text = block.replace(HTML_TAG_REGEX, "");
    const inputMatch = text.match(INPUT_REGEX);
    const outputMatch = text.match(OUTPUT_REGEX);

    if (inputMatch && outputMatch) {
      cases.push({
        input: inputMatch[1].trim(),
        expected_output: outputMatch[1].trim(),
      });
    }
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
  const client = postgres(process.env.DATABASE_URL!, {
    ssl: "require",
  });
  const db = drizzle(client);

  for (const difficultyLabel of DIFFICULTIES) {
    const difficulty = difficultyLabel as Difficulty;
    const dbDifficulty = difficulty.toLowerCase() as Lowercase<Difficulty>;
    console.log(`\nFetching ${difficulty} problems...`);

    const listData = (
      await axios.get<ProblemListResponse>(`${API_BASE}/problems`, {
        params: {
          limit: LIMIT_BY_DIFFICULTY[difficulty],
          difficulty: difficultyLabel,
        },
      })
    ).data;
    const problemList = (listData.problemsetQuestionList ?? []).filter(
      (p) => !p.isPaidOnly,
    );

    console.log(`Found ${problemList.length} free problems`);

    for (const p of problemList) {
      const detail = (
        await axios.get<ProblemDetailResponse>(`${API_BASE}/select`, {
          params: { titleSlug: p.titleSlug },
        })
      ).data;

      const title = detail.questionTitle;
      const description = detail.question;

      if (!title || !description) {
        console.log(` ⚠ Skipping ${p.titleSlug}`);
        continue;
      }

      const testCases = parseTestCases(description);
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
          difficulty: dbDifficulty,
          acceptanceRate: p.acRate,
          description: description,
          examples: testCases.slice(0, 2),
          constraints: parseConstraints(description),
          tags: detail.topicTags?.map((t) => t.slug) ?? [],
          topicTags:
            detail.topicTags?.map((t) => ({ name: t.name, slug: t.slug })) ??
            [],
          hints: detail.hints ?? [],
          testCases,
          isActive: true,
        })
        .onConflictDoNothing();

      console.log(`  ✓ ${title} (${testCases.length} test cases)`);
    }
  }

  await client.end();
  console.log("\nSeeding complete!");
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
