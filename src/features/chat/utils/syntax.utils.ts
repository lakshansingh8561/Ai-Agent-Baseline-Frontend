import Prism from "prismjs";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-yaml.js";

export const highlightCode = (code: string, language: string): string => {
  const normalizedLang = language.toLowerCase().trim();
  const grammar =
    Prism.languages[normalizedLang] ||
    (normalizedLang === "js" ? Prism.languages.javascript : undefined) ||
    (normalizedLang === "ts" ? Prism.languages.typescript : undefined) ||
    (normalizedLang === "py" ? Prism.languages.python : undefined) ||
    (normalizedLang === "sh" || normalizedLang === "shell" ? Prism.languages.bash : undefined) ||
    Prism.languages.plain ||
    Prism.languages.text;

  if (!grammar) {
    // Escape HTML safe fallback
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  try {
    return Prism.highlight(code, grammar, normalizedLang);
  } catch {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
};
