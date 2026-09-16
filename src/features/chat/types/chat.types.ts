export interface SafeConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafeMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
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
}
