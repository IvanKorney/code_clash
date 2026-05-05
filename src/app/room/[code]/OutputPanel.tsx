import { Column } from "@/components/layout/Column";

interface OutputPanelProps {
  output: string | null;
}

export const OutputPanel = ({ output }: OutputPanelProps) => (
  <Column className="h-full overflow-hidden border-t border-border">
    <div className="px-3 py-2 border-b border-border shrink-0">
      <span className="text-xs font-medium text-muted-foreground">Output</span>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {output ? (
        <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{output}</pre>
      ) : (
        <p className="text-xs text-muted-foreground">Run your code to see output here.</p>
      )}
    </div>
  </Column>
);
