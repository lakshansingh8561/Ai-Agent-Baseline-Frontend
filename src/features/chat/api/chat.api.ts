import { api } from "../../../lib/api.ts";
import type {
  ConversationsResponse,
  CreateConversationResponse,
  MessagesResponse,
  SendMessageResponse,
  CreateConversationInput,
  SendMessageInput,
  SafeConversation,
  SafeMessage,
} from "../types/chat.types.ts";

export const fetchConversations = async (): Promise<SafeConversation[]> => {
  const response = await api.get<ConversationsResponse>("/api/chat/conversations");
  return response.data.data.conversations;
};

export const createConversation = async (
  input?: CreateConversationInput
): Promise<SafeConversation> => {
  const response = await api.post<CreateConversationResponse>(
    "/api/chat/conversations",
    input || {}
  );
  return response.data.data.conversation;
};

export const fetchMessages = async (
  conversationId: string
): Promise<SafeMessage[]> => {
  const response = await api.get<MessagesResponse>(
    `/api/chat/conversations/${conversationId}/messages`
  );
  return response.data.data.messages;
};

export const sendMessage = async (
  conversationId: string,
  input: SendMessageInput
): Promise<{ userMessage: SafeMessage; assistantMessage: SafeMessage }> => {
  if (input.file) {
    const formData = new FormData();
    formData.append("content", input.content || "");
    formData.append("image", input.file);

    const response = await api.post<SendMessageResponse>(
      `/api/chat/conversations/${conversationId}/messages`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  }

  const response = await api.post<SendMessageResponse>(
    `/api/chat/conversations/${conversationId}/messages`,
    { content: input.content }
  );
  return response.data.data;
};

export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  await api.delete(`/api/chat/conversations/${conversationId}`);
};

export interface ParsedSSEEvent {
  event: string;
  data: string;
}

export const parseSSEChunk = (
  chunk: string,
  buffer: { current: string }
): ParsedSSEEvent[] => {
  buffer.current += chunk;
  const events: ParsedSSEEvent[] = [];

  const regex = /(?:\r?\n){2}/;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(buffer.current)) !== null) {
    const rawFrame = buffer.current.slice(0, match.index);
    buffer.current = buffer.current.slice(match.index + match[0].length);

    if (!rawFrame.trim()) continue;

    let eventName = "message";
    const dataLines: string[] = [];

    const lines = rawFrame.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      events.push({
        event: eventName,
        data: dataLines.join("\n"),
      });
    }
  }

  return events;
};

export const sendMessageStream = async (
  conversationId: string,
  input: SendMessageInput,
  callbacks?: import("../types/chat.types.ts").SendMessageStreamCallbacks,
  signal?: AbortSignal
): Promise<void> => {
  const { getStoredToken } = await import("../../../lib/token.ts");
  const { API_BASE_URL } = await import("../../../lib/api.ts");

  const token = getStoredToken();
  const url = `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`;

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: any;
  if (input.file) {
    const formData = new FormData();
    formData.append("content", input.content || "");
    formData.append("image", input.file);
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ content: input.content });
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal,
  });

  if (!response.ok) {
    let errorPayload: any;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = { message: `Request failed with status ${response.status}` };
    }
    const err = new Error(errorPayload?.message || `HTTP ${response.status}`);
    (err as any).statusCode = response.status;
    callbacks?.onError?.(err);
    throw err;
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/event-stream")) {
    const data = await response.json();
    if (data?.data) {
      callbacks?.onDone?.({
        conversationId,
        userMessage: data.data.userMessage,
        assistantMessage: data.data.assistantMessage,
        status: "completed",
        isReplay: true,
      });
    }
    return;
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported by browser or response body missing");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const buffer = { current: "" };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const events = parseSSEChunk(chunk, buffer);

      for (const ev of events) {
        try {
          const parsedData = JSON.parse(ev.data);
          if (ev.event === "metadata") {
            callbacks?.onMetadata?.(parsedData);
          } else if (ev.event === "delta") {
            callbacks?.onDelta?.(parsedData);
          } else if (ev.event === "done") {
            callbacks?.onDone?.(parsedData);
          } else if (ev.event === "error") {
            callbacks?.onError?.(parsedData);
          }
        } catch (jsonErr) {
          console.warn("Failed to parse SSE JSON payload:", ev.data, jsonErr);
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted || err.name === "AbortError") {
      return;
    }
    callbacks?.onError?.(err);
    throw err;
  } finally {
    reader.releaseLock();
  }
};

