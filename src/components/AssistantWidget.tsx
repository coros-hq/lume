import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import Bubble from "./Bubble";
import ChatPanel from "./ChatPanel";
import { AssistantConfig, AssistantHandle } from "../types";

type Props = AssistantConfig;

export const AssistantWidget = forwardRef<AssistantHandle, Props>(
  function AssistantWidget(
    {
      model = "gemma3",
      systemPrompt = "You are a helpful assistant.",
      context,
      accentColor = "#6366f1",
      position = "bottom-right",
      title = "Assistant",
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const chatRef = useRef<{
      pushContext: (n: string) => void;
      clearHistory: () => void;
    }>(null);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((o) => !o),
      pushContext: (note) => chatRef.current?.pushContext(note),
      clearHistory: () => chatRef.current?.clearHistory(),
    }));

    return (
      <>
        <ChatPanel
          ref={chatRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          model={model}
          systemPrompt={systemPrompt}
          context={context}
          accentColor={accentColor}
          position={position}
          title={title}
        />
        <Bubble
          isOpen={isOpen}
          onClick={() => setIsOpen((o) => !o)}
          accentColor={accentColor}
          position={position}
        />
      </>
    );
  }
);

export default AssistantWidget;
