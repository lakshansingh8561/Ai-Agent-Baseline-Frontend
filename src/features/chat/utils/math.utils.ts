/**
 * Preprocesses markdown text containing LaTeX mathematical expressions from LLMs
 * before feeding into remark-math and rehype-katex.
 * 
 * Solves:
 * - \[ ... \] display math not parsed by remark-math
 * - \( ... \) inline math not parsed by remark-math
 * - \begin{align} / \begin{align*} unsupported by KaTeX (converts to \begin{aligned})
 * - Unbalanced \begin{aligned} / \end{aligned}
 * - & and \\ alignment tokens inside $$ without \begin{aligned}
 * - Unclosed $$ blocks spilling into markdown headings
 * - Spacing issues with inline $ math $
 */
export function formatMathMarkdown(content: string): string {
  if (!content) return "";

  let processed = content;

  // 1. Convert display math delimiters: \[ ... \] -> \n\n$$\n...\n$$\n\n
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => {
    return `\n\n$$\n${math.trim()}\n$$\n\n`;
  });

  // 2. Convert inline math delimiters: \( ... \) -> $...$
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => {
    return `$${math.trim()}$`;
  });

  // 3. Normalize align/align* to aligned (KaTeX does not support align environment directly)
  processed = processed.replace(/\\begin\{align\*?\}/g, "\\begin{aligned}");
  processed = processed.replace(/\\end\{align\*?\}/g, "\\end{aligned}");

  // 4. Fix $$ blocks that have \end{aligned} without \begin{aligned}
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    let math = inner.trim();

    // If \end{aligned} is present without \begin{aligned}, prepend it
    if (math.includes("\\end{aligned}") && !math.includes("\\begin{aligned}")) {
      math = "\\begin{aligned}\n" + math;
    }

    // If & and \\ are used for alignment without any enclosing aligned/matrix/cases environment,
    // wrap the content in \begin{aligned} ... \end{aligned} so KaTeX does not error on &
    const hasAlignment = math.includes("&") && math.includes("\\\\");
    const hasEnvironment =
      /\\begin\{(aligned|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|array)\}/.test(
        math
      );

    if (hasAlignment && !hasEnvironment) {
      math = `\\begin{aligned}\n${math}\n\\end{aligned}`;
    }

    return `\n\n$$\n${math}\n$$\n\n`;
  });

  // 5. Detect and fix unclosed $$ blocks before markdown section breaks/headings
  // (e.g. when an opening $$ is followed by ### or --- without a closing $$)
  const lines = processed.split("\n");
  let inDisplayMath = false;
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Toggle $$ block state
    if (trimmed === "$$" || trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 2) {
      if (trimmed === "$$") {
        inDisplayMath = !inDisplayMath;
      }
    } else if (trimmed.startsWith("$$")) {
      inDisplayMath = true;
    } else if (trimmed.endsWith("$$")) {
      inDisplayMath = false;
    }

    // If we're inside an unclosed $$ block, but hit a clear markdown boundary (headings, dividers),
    // close the $$ block immediately before the header so it doesn't swallow markdown into KaTeX error
    if (inDisplayMath && (trimmed.startsWith("#") || trimmed.startsWith("---") || trimmed.startsWith("==="))) {
      resultLines.push("$$");
      inDisplayMath = false;
    }

    resultLines.push(line);
  }

  // If the document ends with an open $$, close it
  if (inDisplayMath) {
    resultLines.push("$$");
  }

  return resultLines.join("\n");
}
