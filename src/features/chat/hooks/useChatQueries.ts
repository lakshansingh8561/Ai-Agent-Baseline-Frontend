import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage,
  deleteConversation,
} from "../api/chat.api.ts";
import { tokenKeys } from "../../token/index.ts";

import type {
  SafeConversation,
  SafeMessage,
  CreateConversationInput,
  SendMessageInput,
} from "../types/chat.types.ts";

export const chatKeys = {
  all: ["conversations"] as const,
  conversations: () => ["conversations"] as const,
  messages: (conversationId?: string) =>
    ["conversations", conversationId, "messages"] as const,
};

export const useConversations = () => {
  return useQuery<SafeConversation[], Error>({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  return useQuery<SafeMessage[], Error>({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("conversationId is required");
      }
      const serverMessages = await fetchMessages(conversationId);
      // Preserve any pending optimistic messages that haven't been finalized yet
      const existing =
        queryClient.getQueryData<SafeMessage[]>(
          chatKeys.messages(conversationId)
        ) || [];
      const pendingOptimistic = existing.filter(
        (m) =>
          m.id.startsWith("temp_") &&
          !serverMessages.some((sm) => sm.content === m.content)
      );
      return [...serverMessages, ...pendingOptimistic];
    },
    enabled: Boolean(conversationId),
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: (query) => {
      const messages = query.state.data;
      if (!messages || messages.length === 0) return false;
      const hasGenerating = messages.some(
        (m) =>
          m.role === "assistant" &&
          (m.status === "generating" || m.status === "pending")
      );
      return hasGenerating ? 1500 : false;
    },
    refetchIntervalInBackground: true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnMount: true,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation<SafeConversation, Error, CreateConversationInput | undefined>({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      // Pre-seed the messages cache for the newly created conversation only if not already populated
      queryClient.setQueryData<SafeMessage[]>(
        chatKeys.messages(newConversation.id),
        (old) => (old && old.length > 0 ? old : [])
      );

      // Pre-populate or update the conversations list cache so new thread appears immediately
      queryClient.setQueryData<SafeConversation[]>(
        chatKeys.conversations(),
        (old = []) => [
          newConversation,
          ...old.filter((c) => c.id !== newConversation.id),
        ]
      );

      // Invalidate conversation list so ordering and server state stay synchronized
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations(), exact: true });
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
      return sendMessage(activeId, { content: input.content, file: input.file });
    },
    onSuccess: (result, variables) => {
      const activeId = variables.targetConversationId || conversationId;
      if (!activeId) return;

      // Update message history cache with authoritative records returned by backend
      queryClient.setQueryData<SafeMessage[]>(
        chatKeys.messages(activeId),
        (oldMessages = []) => {
          // Remove temporary optimistic messages matching content
          const nonTemp = oldMessages.filter(
            (m) => !m.id.startsWith("temp_") || m.content !== result.userMessage.content
          );

          // Avoid duplicate keys if already added
          const hasUser = nonTemp.some((m) => m.id === result.userMessage.id);
          const hasAssistant = nonTemp.some(
            (m) => m.id === result.assistantMessage.id
          );

          const updated = [...nonTemp];
          if (!hasUser) updated.push(result.userMessage);
          if (!hasAssistant) updated.push(result.assistantMessage);

          return updated;
        }
      );

      // Invalidate conversations list so updatedAt timestamp updates ordering
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations(), exact: true });

      // Invalidate token balance so latest wallet state from server is reflected
      queryClient.invalidateQueries({ queryKey: tokenKeys.balance() });
    },
    onError: () => {
      // Invalidate token balance on error (e.g. 402 InsufficientTokensError)
      queryClient.invalidateQueries({ queryKey: tokenKeys.balance() });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      // Optimistically remove deleted conversation from conversation list
      queryClient.setQueryData<SafeConversation[]>(
        chatKeys.conversations(),
        (old = []) => old.filter((conv) => conv.id !== conversationId)
      );

      // Remove messages query cache for this conversation
      queryClient.removeQueries({ queryKey: chatKeys.messages(conversationId), exact: true });

      // Invalidate conversation list to synchronize
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations(), exact: true });
    },
  });
};

