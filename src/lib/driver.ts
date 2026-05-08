import type { Language } from "@/types/problem";

export interface ProblemMeta {
  name: string;
  params: { name: string; type: string }[];
  return: { type: string };
  manual?: boolean;
}

// ─── Uncomment "Definition for..." blocks from LeetCode snippets ──────────────

const uncommentDefinitions = (code: string, language: Language): string => {
  if (language === "python") return code;
  // JS/TS/Java/C++: uncomment JSDoc blocks that contain "Definition for"
  return code.replace(/\/\*\*[\s\S]*?\*\//g, (block) => {
    if (!block.includes("Definition for")) return block;
    const result = block
      .split("\n")
      .slice(1, -1)
      .map((l) => l.replace(/^\s*\*\s?/, ""))
      .filter((l) => l.trim() && !/^Definition for/i.test(l.trim()))
      .join("\n");
    // Java: strip 'public' so multiple top-level classes compile in one file
    return language === "java"
      ? result.replace(/\bpublic (class|interface)\b/g, "$1")
      : result;
  });
};

// ─── Utility functions (build/serialize — class defs come from the snippet) ───

const JS_UTILS = `\
function _buildList(a) { if (!a?.length) return null; let h = new ListNode(a[0]), c = h; for (let i = 1; i < a.length; i++) { c.next = new ListNode(a[i]); c = c.next; } return h; }
function _listToArr(n) { const r = []; while (n) { r.push(n.val); n = n.next; } return r; }
function _buildTree(a) { if (!a?.length || a[0] == null) return null; const r = new TreeNode(a[0]), q = [r]; let i = 1; while (q.length && i < a.length) { const n = q.shift(); if (a[i] != null) { n.left = new TreeNode(a[i]); q.push(n.left); } i++; if (i < a.length && a[i] != null) { n.right = new TreeNode(a[i]); q.push(n.right); } i++; } return r; }
function _treeToArr(r) { if (!r) return []; const res = [], q = [r]; while (q.length) { const n = q.shift(); res.push(n ? n.val : null); if (n) { q.push(n.left); q.push(n.right); } } while (res.length && res[res.length-1] == null) res.pop(); return res; }`;

const TS_UTILS = `\
function _buildList(a: (number|null)[]): any { if (!a?.length || a[0]==null) return null; let h: any = new (ListNode as any)(a[0]), c: any = h; for (let i=1;i<a.length;i++){c.next=new (ListNode as any)(a[i]);c=c.next;} return h; }
function _listToArr(n: any): number[] { const r: number[]=[]; while(n){r.push(n.val);n=n.next;} return r; }
function _buildTree(a: (number|null)[]): any { if(!a?.length||a[0]==null) return null; const r: any=new (TreeNode as any)(a[0]),q: any[]=[r];let i=1; while(q.length&&i<a.length){const n=q.shift();if(a[i]!=null){n.left=new (TreeNode as any)(a[i]);q.push(n.left);}i++;if(i<a.length&&a[i]!=null){n.right=new (TreeNode as any)(a[i]);q.push(n.right);}i++;} return r; }
function _treeToArr(r: any): (number|null)[] { if(!r) return []; const res:(number|null)[]=[], q: any[]=[r]; while(q.length){const n=q.shift();res.push(n?n.val:null);if(n){q.push(n.left);q.push(n.right);}} while(res.length&&res[res.length-1]==null) res.pop(); return res; }`;

const PY_HELPERS = `\
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`;

const PY_UTILS = `\
def _build_list(arr):
    if not arr: return None
    h = ListNode(arr[0]); c = h
    for v in arr[1:]: c.next = ListNode(v); c = c.next
    return h
def _list_to_arr(node):
    r = []
    while node: r.append(node.val); node = node.next
    return r
def _build_tree(arr):
    if not arr or arr[0] is None: return None
    from collections import deque
    r = TreeNode(arr[0]); q = deque([r]); i = 1
    while q and i < len(arr):
        n = q.popleft()
        if i < len(arr) and arr[i] is not None: n.left = TreeNode(arr[i]); q.append(n.left)
        i += 1
        if i < len(arr) and arr[i] is not None: n.right = TreeNode(arr[i]); q.append(n.right)
        i += 1
    return r
def _tree_to_arr(root):
    if not root: return []
    from collections import deque
    res, q = [], deque([root])
    while q:
        n = q.popleft()
        res.append(n.val if n else None)
        if n: q.append(n.left); q.append(n.right)
    while res and res[-1] is None: res.pop()
    return res`;

const JAVA_UTILS = `\
    static int[] _parseIntArr(String s) {
        s = s.trim(); if (s.equals("[]")) return new int[0];
        String[] p = s.substring(1, s.length()-1).split(",");
        int[] r = new int[p.length]; for (int i=0;i<p.length;i++) r[i]=Integer.parseInt(p[i].trim()); return r;
    }
    static List<Integer> _parseIntList(String s) {
        int[] a = _parseIntArr(s); List<Integer> r = new ArrayList<>(); for (int v:a) r.add(v); return r;
    }
    static String[] _parseStrArr(String s) {
        s = s.trim(); if (s.equals("[]")) return new String[0];
        return s.substring(1,s.length()-1).replaceAll("\"","").split(",");
    }
    static String _fmt(int[] a) { StringBuilder sb=new StringBuilder("["); for(int i=0;i<a.length;i++){if(i>0)sb.append(",");sb.append(a[i]);} return sb.append("]").toString(); }
    static String _fmt(List<?> l) { StringBuilder sb=new StringBuilder("["); for(int i=0;i<l.size();i++){if(i>0)sb.append(",");sb.append(l.get(i));} return sb.append("]").toString(); }
    static String _fmt(boolean b) { return b?"true":"false"; }`;

const CPP_UTILS = `\
vector<int> _parseIntVec(const string& s) {
    vector<int> v; string t=s.substr(1,s.size()-2); if(t.empty()) return v;
    stringstream ss(t); string tok; while(getline(ss,tok,',')) v.push_back(stoi(tok)); return v;
}
vector<vector<int>> _parseInt2D(const string& s) {
    vector<vector<int>> v;
    size_t i=0;
    while(i<s.size()){
        size_t a=s.find('[',i+1), b=s.find(']',a);
        if(a==string::npos) break;
        v.push_back(_parseIntVec(s.substr(a,b-a+1))); i=b+1;
    }
    return v;
}
template<typename T> string _fmtVec(const vector<T>& v) {
    string r="["; for(size_t i=0;i<v.size();i++){if(i)r+=",";r+=to_string(v[i]);} return r+"]";
}
string _fmtStrVec(const vector<string>& v) {
    string r="["; for(size_t i=0;i<v.size();i++){if(i)r+=",";r+="\""+v[i]+"\"";} return r+"]";
}`;

// ─── Type parsers ─────────────────────────────────────────────────────────────

const jsParseExpr = (type: string): string => {
  const t = type.toLowerCase();
  if (/^(integer|long|int)$/.test(t)) return `parseInt(_next(), 10)`;
  if (/^(double|float)$/.test(t)) return `parseFloat(_next())`;
  if (t === "boolean") return `_next() === "true"`;
  if (t === "listnode") return `_buildList(JSON.parse(_next()))`;
  if (t === "treenode") return `_buildTree(JSON.parse(_next()))`;
  return `JSON.parse(_next())`;
};

const jsOutputLine = (type: string, callExpr: string): string => {
  const t = type.toLowerCase();
  if (t === "void") return `${callExpr};`;
  if (t === "boolean") return `console.log(${callExpr} ? "true" : "false");`;
  if (t === "listnode")
    return `console.log(JSON.stringify(_listToArr(${callExpr})));`;
  if (t === "treenode")
    return `console.log(JSON.stringify(_treeToArr(${callExpr})));`;
  return `console.log(JSON.stringify(${callExpr}));`;
};

const pyParseExpr = (type: string): string => {
  const t = type.toLowerCase();
  if (/^(integer|int|long)$/.test(t)) return `int(_next())`;
  if (/^(double|float)$/.test(t)) return `float(_next())`;
  if (t === "boolean") return `_next() == "true"`;
  if (t === "listnode") return `_build_list(json.loads(_next()))`;
  if (t === "treenode") return `_build_tree(json.loads(_next()))`;
  return `json.loads(_next())`;
};

const pyOutputLine = (type: string, callExpr: string): string => {
  const t = type.toLowerCase();
  if (t === "void") return `${callExpr}`;
  if (/^(integer|int|long)$/.test(t)) return `print(${callExpr})`;
  if (/^(double|float)$/.test(t)) return `print(${callExpr})`;
  if (t === "boolean") return `print("true" if ${callExpr} else "false")`;
  if (t === "listnode")
    return `print(json.dumps(_list_to_arr(${callExpr}), separators=(',', ':')))`;
  if (t === "treenode")
    return `print(json.dumps(_tree_to_arr(${callExpr}), separators=(',', ':')))`;
  return `print(json.dumps(${callExpr}, separators=(',', ':')))`;
};

const javaParseLines = (type: string, idx: number): string => {
  const t = type.toLowerCase();
  const line = `_br.readLine().trim()`;
  if (/^(integer|int)$/.test(t))
    return `int _p${idx} = Integer.parseInt(${line});`;
  if (/^long$/.test(t)) return `long _p${idx} = Long.parseLong(${line});`;
  if (/^(double|float)$/.test(t))
    return `double _p${idx} = Double.parseDouble(${line});`;
  if (/^boolean$/.test(t))
    return `boolean _p${idx} = Boolean.parseBoolean(${line});`;
  if (/^string$/.test(t)) return `String _p${idx} = ${line};`;
  if (/^(integer\[\]|int\[\])$/.test(t))
    return `int[] _p${idx} = _parseIntArr(${line});`;
  if (/^list<integer>$/.test(t))
    return `List<Integer> _p${idx} = _parseIntList(${line});`;
  if (/^string\[\]$/.test(t))
    return `String[] _p${idx} = _parseStrArr(${line});`;
  return `String _p${idx} = ${line}; // unsupported: ${type}`;
};

const javaOutputLine = (type: string, callExpr: string): string => {
  const t = type.toLowerCase();
  if (t === "void") return `${callExpr};`;
  if (/^boolean$/.test(t)) return `System.out.println(_fmt(${callExpr}));`;
  if (/^(integer\[\]|int\[\])$/.test(t))
    return `System.out.println(_fmt(${callExpr}));`;
  if (/^list<integer>$/.test(t))
    return `System.out.println(_fmt(${callExpr}));`;
  return `System.out.println(${callExpr});`;
};

const cppReadLines = (type: string, idx: number): string => {
  const t = type.toLowerCase();
  const readLine = `string _l${idx}; getline(cin, _l${idx});`;
  if (/^(integer|int)$/.test(t))
    return `${readLine}\n    int _p${idx} = stoi(_l${idx});`;
  if (/^long$/.test(t))
    return `${readLine}\n    long long _p${idx} = stoll(_l${idx});`;
  if (/^(double|float)$/.test(t))
    return `${readLine}\n    double _p${idx} = stod(_l${idx});`;
  if (/^boolean$/.test(t))
    return `${readLine}\n    bool _p${idx} = (_l${idx} == "true");`;
  if (/^string$/.test(t)) return `${readLine}\n    string _p${idx} = _l${idx};`;
  if (/^(integer\[\]|int\[\]|vector<int>)$/.test(t))
    return `${readLine}\n    vector<int> _p${idx} = _parseIntVec(_l${idx});`;
  if (/^(integer\[\]\[\]|int\[\]\[\]|vector<vector<int>>)$/.test(t))
    return `${readLine}\n    vector<vector<int>> _p${idx} = _parseInt2D(_l${idx});`;
  return `${readLine}\n    // unsupported: ${type}`;
};

const cppOutputLine = (type: string, callExpr: string): string => {
  const t = type.toLowerCase();
  if (t === "void") return `${callExpr};`;
  if (/^boolean$/.test(t))
    return `cout << (${callExpr} ? "true" : "false") << endl;`;
  if (/^string$/.test(t)) return `cout << ${callExpr} << endl;`;
  if (/^(integer\[\]|int\[\]|vector<int>)$/.test(t))
    return `cout << _fmtVec(${callExpr}) << endl;`;
  if (/^(integer\[\]\[\]|vector<vector<int>>)$/.test(t))
    return `{ auto _r=${callExpr}; string _s="["; for(size_t _i=0;_i<_r.size();_i++){if(_i)_s+=",";_s+=_fmtVec(_r[_i]);} cout<<_s+"]"<<endl; }`;
  return `cout << ${callExpr} << endl;`;
};

// ─── Builders ─────────────────────────────────────────────────────────────────

const buildJS = (
  userCode: string,
  meta: ProblemMeta,
  isTS: boolean,
): string => {
  const code = uncommentDefinitions(
    userCode,
    isTS ? "typescript" : "javascript",
  );
  const utils = isTS ? TS_UTILS : JS_UTILS;
  const paramLines = meta.params
    .map((p, i) => `const _p${i} = ${jsParseExpr(p.type)};`)
    .join("\n");
  const args = meta.params.map((_, i) => `_p${i}`).join(", ");
  const header = isTS ? "// @ts-nocheck\n" : "";
  return `${header}${code}

${utils}

const _L = require("fs").readFileSync(0, "utf8").trim().split("\\n");
let _li = 0;
const _next = () => _L[_li++];
${paramLines}
${jsOutputLine(meta.return.type, `${meta.name}(${args})`)}`;
};

const buildPython = (userCode: string, meta: ProblemMeta): string => {
  const code = uncommentDefinitions(userCode, "python");
  const paramLines = meta.params
    .map((p, i) => `_p${i} = ${pyParseExpr(p.type)}`)
    .join("\n");
  const args = meta.params.map((_, i) => `_p${i}`).join(", ");
  return `import sys, json
from typing import Optional, List, Dict, Set, Tuple, Any, Union
from collections import deque, defaultdict

${PY_HELPERS}

${code}

${PY_UTILS}

_L = sys.stdin.read().strip().split("\\n")
_li = [0]
def _next(): v = _L[_li[0]]; _li[0] += 1; return v
${paramLines}
${pyOutputLine(meta.return.type, `Solution().${meta.name}(${args})`)}`;
};

const buildJava = (userCode: string, meta: ProblemMeta): string => {
  const code = uncommentDefinitions(userCode, "java");
  const paramLines = meta.params
    .map((p, i) => `        ${javaParseLines(p.type, i)}`)
    .join("\n");
  const args = meta.params.map((_, i) => `_p${i}`).join(", ");
  return `import java.util.*;
import java.io.*;

${code}

class Main {
${JAVA_UTILS}
    public static void main(String[] args) throws Exception {
        BufferedReader _br = new BufferedReader(new InputStreamReader(System.in));
        Solution _sol = new Solution();
${paramLines}
        ${javaOutputLine(meta.return.type, `_sol.${meta.name}(${args})`)}
    }
}`;
};

const buildCpp = (userCode: string, meta: ProblemMeta): string => {
  const code = uncommentDefinitions(userCode, "cpp");
  const paramLines = meta.params
    .map((p, i) => `    ${cppReadLines(p.type, i)}`)
    .join("\n");
  const args = meta.params.map((_, i) => `_p${i}`).join(", ");
  return `#include <bits/stdc++.h>
using namespace std;

${CPP_UTILS}

${code}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    Solution sol;
${paramLines}
    ${cppOutputLine(meta.return.type, `sol.${meta.name}(${args})`)}
    return 0;
}`;
};

// ─── Public export ────────────────────────────────────────────────────────────

export const buildDriverCode = (
  userCode: string,
  language: Language,
  meta: ProblemMeta,
): string => {
  switch (language) {
    case "javascript":
      return buildJS(userCode, meta, false);
    case "typescript":
      return buildJS(userCode, meta, true);
    case "python":
      return buildPython(userCode, meta);
    case "java":
      return buildJava(userCode, meta);
    case "cpp":
      return buildCpp(userCode, meta);
  }
};
