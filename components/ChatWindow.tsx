"use client";

// import { MessageDTO, ConversationDTO } from "@/lib/types/chat";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
// import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useMessages";
import toast, { useToaster } from "react-hot-toast";
import { ConversationDTO } from "@/lib/types";
import { getSession } from "@/lib/auth";

interface ChatWindowProps {
  conversation: ConversationDTO;
}

export async function ChatWindow({ conversation }: ChatWindowProps) {
  const session = await getSession();
  const [messageInput, setMessageInput] = useState("");

  const { messages, isLoading, sendMessage, isSending, sendError, markAsRead } =
    useMessages(conversation.id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadMessagesRef = useRef<string[]>([]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marquer comme lu après 2 secondes de visibilité
  useEffect(() => {
    const newUnread = messages
      .filter((msg) => !msg.isRead && msg.senderId !== session?.userId)
      .map((msg) => msg.id);

    if (newUnread.length > 0) {
      const timer = setTimeout(() => {
        markAsRead(newUnread);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [messages, session?.userId, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    sendMessage(
      {
        conversationId: conversation.id,
        content: messageInput.trim(),
        type: "TEXT",
      },
      {
        onSuccess: () => {
          setMessageInput("");
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to send message");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === session?.userId
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.senderId === session?.userId
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {message.senderId !== session?.userId && (
                <p className="text-sm font-semibold">{message.senderName}</p>
              )}
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(message.createdAt), "HH:mm")}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            maxLength={5000}
          />
          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
        {sendError && (
          <p className="text-red-500 text-sm mt-2">
            Error: {sendError.message}
          </p>
        )}
      </form>
    </div>
  );
}
