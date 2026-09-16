/**
 * Deterministic helper to derive a concise, meaningful conversation title from the first prompt.
 *
 * Rules:
 * - trim whitespace
 * - collapse repeated whitespace
 * - maximum 60 characters
 * - if truncated, append "..."
 * - never produce an empty title
 * - does not modify the original message content
 */
export const deriveConversationTitle = (content: string): string => {
  if (!content) return "New Chat";

  // Take the first meaningful (non-empty) line of the prompt
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstMeaningful = lines.length > 0 ? lines[0] : content;

  // Collapse all repeated whitespace to single spaces
  const sanitized = firstMeaningful.replace(/\s+/g, " ").trim();
  if (!sanitized) return "New Chat";

  const MAX_LENGTH = 60;
  if (sanitized.length <= MAX_LENGTH) {
    return sanitized;
  }

  // Truncate to fit within MAX_LENGTH including the "..." suffix
  const cutoff = MAX_LENGTH - 3;
  const truncated = sanitized.slice(0, cutoff).trim();

  return `${truncated}...`;
};

const TITLE_STORAGE_KEY_PREFIX = "nexadev_title_";

export const getStoredDerivedTitle = (conversationId: string): string | null => {
  try {
    return localStorage.getItem(`${TITLE_STORAGE_KEY_PREFIX}${conversationId}`);
  } catch {
    return null;
  }
};

export const setStoredDerivedTitle = (conversationId: string, title: string): void => {
  try {
    if (title && title !== "New Chat" && title !== "Untitled") {
      localStorage.setItem(`${TITLE_STORAGE_KEY_PREFIX}${conversationId}`, title);
    }
  } catch {
    // Ignore localStorage errors
  }
};

export const isLegacyTitle = (title?: string | null): boolean => {
  return title === "New Chat" || title === "Untitled";
};

export const resolveConversationTitle = (
  conversationId: string,
  serverTitle?: string,
  firstMessageContent?: string
): string => {
  // 1. If server already has a meaningful custom title (not 'New Chat' or 'Untitled'), do NOT change it
  if (serverTitle && !isLegacyTitle(serverTitle)) {
    return serverTitle;
  }

  // 2. Check local UI storage cache for previously derived title
  const stored = getStoredDerivedTitle(conversationId);
  if (stored) {
    return stored;
  }

  // 3. If first message content is provided, derive and save it
  if (firstMessageContent) {
    const derived = deriveConversationTitle(firstMessageContent);
    setStoredDerivedTitle(conversationId, derived);
    return derived;
  }

  // 4. Fallback to server title or "New Chat" (e.g. empty conversation with no messages)
  return serverTitle || "New Chat";
};

