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

