import { trpc } from "@/trpc";
import type { Fragment, Message } from "@/types";
import { useEffect, useRef } from "react";
import MessageCard from "./MessageCard";
import { MessageLoading } from "./MessageLoading";
import { MessageForm } from "./MessageForm";

interface props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: props) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastAssistanceMessageIdRef = useRef<string | null>(null);
  let lastMessage;
  let isLastMessageUser;

  const { data: messages } = trpc.getMessages.useQuery(
    {
      projectId,
    },
    {
      refetchInterval: 2000,
    }
  );

  useEffect(() => {
    const allMessages: Message[] = messages || [];
    const lastAssistantMessage = allMessages.findLast(
      (message) => message.role === "ASSISTANCE"
    );

    if (
      lastAssistantMessage?.fragment &&
      lastAssistanceMessageIdRef.current !== lastAssistantMessage.id
    ) {
      setActiveFragment(lastAssistantMessage.fragment);
      lastAssistanceMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    buttonRef.current?.scrollIntoView();
  }, [messages?.length]);

  if (messages) {
    lastMessage = messages[messages.length - 1];

    isLastMessageUser = lastMessage?.role === "USER";
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages &&
            messages.map((message) => (
              <MessageCard
                key={message.id}
                content={message.content}
                role={message.role}
                fragment={message.fragment}
                createdAt={message.createdAt}
                isActiveFragment={activeFragment?.id === message.fragment?.id}
                onFragmentClick={() => setActiveFragment(message.fragment)}
                type={message.type}
              />
            ))}
          {isLastMessageUser && <MessageLoading />}
          <div ref={buttonRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export default MessagesContainer;
