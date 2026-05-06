import { Column } from "@/components/layout/Column";
import { cn } from "@/lib/utils";
import type { PanelOutput } from "@/types/problem";

interface OutputPanelProps {
  output: PanelOutput | null;
}

export const OutputPanel = ({ output }: OutputPanelProps) => (
  <Column className="h-full overflow-hidden border-t border-border">
    <div className="px-3 py-2 border-b border-border shrink-0">
      <span className="text-xs font-medium text-muted-foreground">Output</span>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3 text-xs font-mono">
      {!output ? (
        <p className="text-muted-foreground font-sans">Run your code to see output here.</p>
      ) : null}

      {output?.type === "run" ? (
        <div className="space-y-3">
          {output.stderr ? (
            <>
              <p className="text-muted-foreground font-sans">Error</p>
              <pre className="whitespace-pre-wrap text-destructive">{output.stderr}</pre>
            </>
          ) : null}
          {output.input ? (
            <>
              <p className="text-muted-foreground font-sans">Input</p>
              <pre className="whitespace-pre-wrap text-foreground">{output.input}</pre>
            </>
          ) : null}
          {output.expected ? (
            <>
              <p className="text-muted-foreground font-sans">Expected</p>
              <pre className="whitespace-pre-wrap text-foreground">{output.expected}</pre>
            </>
          ) : null}
          <p className="text-muted-foreground font-sans">Output</p>
          {output.stdout ? (
            <pre className="whitespace-pre-wrap text-foreground">{output.stdout}</pre>
          ) : (
            <p className="text-muted-foreground font-sans">No output.</p>
          )}
        </div>
      ) : null}

      {output?.type === "submit" ? (
        <div className="space-y-3">
          <p className={cn("font-sans font-semibold", output.allPassed ? "text-green-400" : "text-destructive")}>
            {output.passed}/{output.total} test cases passed
          </p>
          {output.cases.map((tc) => (
            <div
              key={tc.index}
              className={cn(
                "rounded-md border p-3 space-y-1",
                tc.passed ? "border-green-400/30 bg-green-400/5" : "border-destructive/30 bg-destructive/5",
              )}
            >
              <p className={cn("font-sans font-medium text-xs", tc.passed ? "text-green-400" : "text-destructive")}>
                Case {tc.index + 1}: {tc.passed ? "Passed" : "Failed"}
              </p>
              <p className="text-muted-foreground font-sans">Input</p>
              <pre className="whitespace-pre-wrap text-foreground">{tc.input}</pre>
              {!tc.passed ? (
                <>
                  <p className="text-muted-foreground font-sans">Expected</p>
                  <pre className="whitespace-pre-wrap text-foreground">{tc.expected}</pre>
                  <p className="text-muted-foreground font-sans">Got</p>
                  <pre className="whitespace-pre-wrap text-foreground">{tc.actual || "(empty)"}</pre>
                  {tc.stderr ? (
                    <>
                      <p className="text-muted-foreground font-sans">Error</p>
                      <pre className="whitespace-pre-wrap text-destructive">{tc.stderr}</pre>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  </Column>
);
