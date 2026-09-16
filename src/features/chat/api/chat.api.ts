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
  const response = await api.post<SendMessageResponse>(
    `/api/chat/conversations/${conversationId}/messages`,
    input
  );
  return response.data.data;
};
