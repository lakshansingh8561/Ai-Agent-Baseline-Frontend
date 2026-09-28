export interface SafeConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  type: "image";
  url: string;
  publicId?: string;
  mimeType: string;
  name: string;
  size: number;
}

export type MessageStatus = "pending" | "generating" | "completed" | "failed";

export interface SafeMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  status?: MessageStatus;
  errorMessage?: string;
  attachment?: MessageAttachment;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: SafeConversation[];
  };
}

export interface CreateConversationResponse {
  success: boolean;
  message: string;
  data: {
    conversation: SafeConversation;
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: SafeMessage[];
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    userMessage: SafeMessage;
    assistantMessage: SafeMessage;
  };
}

export interface CreateConversationInput {
  title?: string;
}

export interface SendMessageInput {
  content: string;
  file?: File | null;
}
