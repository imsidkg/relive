import { trpc } from "@/trpc";
import type { Fragment, Message } from "@/types";
import { useEffect, useRef } from "react";

interface props {
  projectId: string;
  activeFragment: Fragment;
  setActiveFragment: (fragment: Fragment | null) => null;
}

const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: props) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastAssistanceMessageIdRef = useRef<string | null>(null);
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

  return <div>MEssage container</div>;
};

export default MessagesContainer;
