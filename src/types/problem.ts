export interface TestCase {
  input: string;
  expected_output: string;
}

export type Language = "javascript" | "typescript" | "python" | "java" | "cpp";

export type RunOutput = {
  type: "run";
  input: string;
  expected: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

export type SubmitOutput = {
  type: "submit";
  passed: number;
  total: number;
  allPassed: boolean;
  cases: {
    index: number;
    input: string;
    expected: string;
    actual: string;
    stderr: string;
    passed: boolean;
  }[];
};

export type PanelOutput = RunOutput | SubmitOutput;
