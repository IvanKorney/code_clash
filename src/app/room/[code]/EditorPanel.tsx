"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnMount } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import type { Language } from "@/types/problem";
import { useLocalCode } from "@/hooks/useLocalCode";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const LANGUAGES: { value: Language; label: string; monacoId: string }[] = [
  { value: "javascript", label: "JavaScript", monacoId: "javascript" },
  { value: "typescript", label: "TypeScript", monacoId: "typescript" },
  { value: "python", label: "Python", monacoId: "python" },
  { value: "java", label: "Java", monacoId: "java" },
  { value: "cpp", label: "C++", monacoId: "cpp" },
];

const STARTER_CODE: Record<Language, string> = {
  javascript: `var solution = function() {\n    \n};`,
  typescript: `function solution(): void {\n    \n}`,
  python: `class Solution:\n    def solution(self):\n        `,
  java: `class Solution {\n    public void solution() {\n        \n    }\n}`,
  cpp: `class Solution {\npublic:\n    void solution() {\n        \n    }\n};`,
};

interface EditorPanelProps {
  roomId: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onRun: (code: string, language: Language) => void;
  onSubmit: (code: string, language: Language) => void;
  isRunning: boolean;
  isSubmitting: boolean;
  codeSnippets: Partial<Record<Language, string>>;
}

export const EditorPanel = ({
  roomId,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  codeSnippets,
}: EditorPanelProps) => {
  const { theme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const { codeByLang, updateCode } = useLocalCode(roomId, { ...STARTER_CODE, ...codeSnippets });
  const hasLeftPage = useRef(false);
  const [pasteBlocked, setPasteBlocked] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) hasLeftPage.current = true;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleMount: OnMount = (editor, monaco: Monaco) => {
    editorRef.current = editor;

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC,
      () => {
        hasLeftPage.current = false;
        editor.trigger("keyboard", "editor.action.clipboardCopyAction", null);
      },
    );

    editor.onDidPaste(() => {
      if (hasLeftPage.current) {
        editor.trigger("", "undo", null);
        setPasteBlocked(true);
        setTimeout(() => setPasteBlocked(false), 3000);
      }
    });
  };

  const handleChange = (value: string | undefined) => {
    updateCode(language, value ?? "");
  };

  const getCode = () => editorRef.current?.getValue() ?? codeByLang[language];

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoId ?? "javascript";

  const busy = isRunning || isSubmitting;

  return (
    <Column className="h-full">
      <Row className="items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <Select
          value={language}
          onValueChange={(v) => onLanguageChange(v as Language)}
        >
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value} className="text-xs">
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pasteBlocked && (
          <span className="text-destructive text-xs">External paste blocked</span>
        )}
        <Row className="gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRun(getCode(), language)}
            disabled={busy}
          >
            {isRunning ? "Running…" : "Run"}
          </Button>
          <Button
            size="sm"
            onClick={() => onSubmit(getCode(), language)}
            disabled={busy}
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </Button>
        </Row>
      </Row>
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={monacoLang}
          value={codeByLang[language]}
          onChange={handleChange}
          onMount={handleMount}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            tabSize: 2,
            contextmenu: false,
          }}
        />
      </div>
    </Column>
  );
};
