// components/ConversationList.tsx
"use client";

// import { ConversationDTO } from "@/lib/types/chat";
import { Button } from "@/components/ui/button";
import { ConversationDTO } from "@/lib/types";
import { Plus } from "lucide-react";

interface ConversationListProps {
  conversations: ConversationDTO[];
  isLoading: boolean;
  selectedConversation: ConversationDTO | null;
  onSelectConversation: (conversation: ConversationDTO) => void;
  onCreateClick: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  selectedConversation,
  onSelectConversation,
  onCreateClick,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 text-sm">Chargement des conversations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-4">Aucune conversation</p>
          <Button onClick={onCreateClick} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Créer une conversation
          </Button>
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItemButton
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversation?.id === conversation.id}
            onClick={() => onSelectConversation(conversation)}
          />
        ))
      )}
    </div>
  );
}

interface ConversationItemButtonProps {
  conversation: ConversationDTO;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItemButton({
  conversation,
  isSelected,
  onClick,
}: ConversationItemButtonProps) {
  const title = conversation.title || "Chat";
  const lastMessagePreview =
    conversation.lastMessage?.content || "Aucun message";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
        isSelected
          ? "bg-blue-100 text-blue-900"
          : "hover:bg-gray-100 text-gray-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{title}</p>
          <p className="text-xs text-gray-600 truncate">
            {lastMessagePreview.substring(0, 40)}...
          </p>
        </div>
        {conversation.unreadCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
