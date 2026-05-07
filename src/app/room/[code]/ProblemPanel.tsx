import { Badge } from "@/components/ui/badge";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import type { Difficulty } from "@/lib/consts";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "text-green-400 border-green-400/30 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  hard: "text-red-400 border-red-400/30 bg-red-400/10",
};

interface ProblemPanelProps {
  title: string;
  difficulty: Difficulty;
  description: string;
}

const sanitize = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

export const ProblemPanel = ({ title, difficulty, description }: ProblemPanelProps) => (
  <Column className="h-full overflow-hidden border-r border-border">
    <Row className="items-center gap-2 px-4 py-3 border-b border-border shrink-0">
      <h2 className="font-semibold text-base">{title}</h2>
      <Badge variant="outline" className={DIFFICULTY_STYLES[difficulty]}>
        {difficulty}
      </Badge>
    </Row>
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div
        className="text-sm leading-relaxed
          [&_p]:mb-3 [&_p:empty]:hidden
          [&_strong]:font-semibold
          [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:text-xs [&_pre]:font-mono [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_li]:mb-1
          [&_sup]:text-xs
          [&_img]:max-w-full [&_img]:rounded"
        dangerouslySetInnerHTML={{ __html: sanitize(description) }}
      />
    </div>
  </Column>
);
