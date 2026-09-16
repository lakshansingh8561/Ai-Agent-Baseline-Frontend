import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage,
} from "../api/chat.api.ts";
import { tokenKeys } from "../../token/index.ts";

import type {
  SafeConversation,
  SafeMessage,
  CreateConversationInput,
  SendMessageInput,
} from "../types/chat.types.ts";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  messages: (conversationId?: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};

export const useConversations = () => {
  return useQuery<SafeConversation[], Error>({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMessages = (conversationId?: string) => {
  return useQuery<SafeMessage[], Error>({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => {
      if (!conversationId) {
        throw new Error("conversationId is required");
      }
      return fetchMessages(conversationId);
    },
    enabled: Boolean(conversationId),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<SafeConversation, Error, CreateConversationInput | undefined>({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      // Invalidate conversation list so new thread appears at the top
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      navigate(`/app/${newConversation.id}`);
    },
  });
};

export const useSendMessage = (conversationId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    { userMessage: SafeMessage; assistantMessage: SafeMessage },
    Error,
    SendMessageInput & { targetConversationId?: string }
  >({
    mutationFn: (input) => {
      const activeId = input.targetConversationId || conversationId;
      if (!activeId) {
        throw new Error("No conversation selected");
      }
      return sendMessage(activeId, { content: input.content });
    },
    onSuccess: (result, variables) => {
      const activeId = variables.targetConversationId || conversationId;
      if (!activeId) return;

      // Update message history cache with authoritative records returned by backend
      queryClient.setQueryData<SafeMessage[]>(
        chatKeys.messages(activeId),
        (oldMessages = []) => {
          // Avoid duplicate keys if already added
          const hasUser = oldMessages.some((m) => m.id === result.userMessage.id);
          const hasAssistant = oldMessages.some(
            (m) => m.id === result.assistantMessage.id
          );

          const updated = [...oldMessages];
          if (!hasUser) updated.push(result.userMessage);
          if (!hasAssistant) updated.push(result.assistantMessage);

          return updated;
        }
      );

      // Invalidate conversations list so updatedAt timestamp updates ordering
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

      // Invalidate token balance so latest wallet state from server is reflected
      queryClient.invalidateQueries({ queryKey: tokenKeys.balance() });
    },
  });
};
