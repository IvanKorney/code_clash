"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
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
import type { Language } from "@/types/problem";
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
  javascript: "/**\n * @return {*}\n */\nconst solve = function() {\n    \n};",
  typescript: "function solve(): void {\n    \n}",
  python: "class Solution:\n    def solve(self):\n        pass",
  java: "class Solution {\n    public void solve() {\n        \n    }\n}",
  cpp: "class Solution {\npublic:\n    void solve() {\n        \n    }\n};",
};

interface EditorPanelProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onRun: (code: string, language: Language) => void;
  onSubmit: (code: string, language: Language) => void;
}

export const EditorPanel = ({
  language,
  onLanguageChange,
  onRun,
  onSubmit,
}: EditorPanelProps) => {
  const { theme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [codeByLang, setCodeByLang] = useState<Record<Language, string>>({
    ...STARTER_CODE,
  });

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string | undefined) => {
    setCodeByLang((prev) => ({ ...prev, [language]: value ?? "" }));
  };

  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
  };

  const getCode = () => editorRef.current?.getValue() ?? codeByLang[language];

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoId ?? "javascript";

  return (
    <Column className="h-full">
      <Row className="items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <Select
          value={language}
          onValueChange={(v) => handleLanguageChange(v as Language)}
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
        <Row className="gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRun(getCode(), language)}
          >
            Run
          </Button>
          <Button size="sm" onClick={() => onSubmit(getCode(), language)}>
            Submit
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
          }}
        />
      </div>
    </Column>
  );
};
