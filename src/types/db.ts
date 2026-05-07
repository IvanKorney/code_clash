export interface DbUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string | null;
  username: string | null;
  elo: number;
  bio: string | null;
  preferred_language: string | null;
  country: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  is_banned: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRoom {
  id: string;
  code: string;
  status: "waiting" | "in_progress" | "finished" | "abandoned";
  problem_slug: string | null;
  host_id: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_minutes: number;
  match_started_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface DbRoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  finished_at: string | null;
  has_passed: boolean;
  solution: string | null;
  language: string;
  test_cases_passed: number;
  total_test_cases: number;
}

export interface DbProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  acceptance_rate: number | null;
  description: string;
  examples: unknown;
  constraints: string | null;
  tags: string[] | null;
  topic_tags: unknown;
  hints: string[] | null;
  test_cases: unknown;
  code_snippets: unknown;
  meta_data: unknown;
  is_active: boolean;
  created_at: string;
}

export interface DbMatch {
  id: string;
  room_id: string;
  winner_id: string | null;
  loser_id: string | null;
  problem_slug: string;
  duration_seconds: number;
  result_type: "completed" | "forfeit" | "timeout";
  winner_elo_before: number | null;
  loser_elo_before: number | null;
  winner_elo_after: number | null;
  loser_elo_after: number | null;
  created_at: string;
}

export interface DbEloHistory {
  id: string;
  user_id: string;
  match_id: string;
  elo_before: number;
  elo_after: number;
  delta: number;
  created_at: string;
}
