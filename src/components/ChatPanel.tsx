import {
  useState,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Header } from "./chat/Header";
import { MessageList } from "./chat/MessageArea";
import { InputBar } from "./chat/InputBar";
import { useAssistant } from "../hooks/useAssistant";
import { ErrorStrip } from "./ErrorStrip";
import { ConfirmationCard } from "./ConfirmationCard";
import { KnowledgeChunk } from "../core/ragScorer";
import { Action, ActionCall, ComponentDefinition } from "../types";
import { useOllamaStatus } from "../hooks/useOllamaStatus";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  model: string;
  systemPrompt: string;
  accentColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  title: string;
  context?: Record<string, string | number | boolean | null | undefined>;
  knowledgeBase?: KnowledgeChunk[];
  actions?: Action[];
  components?: ComponentDefinition[]; // ← added
  debug?: boolean;
}

interface ChatPanelHandle {
  pushContext: (note: string) => void;
  clearHistory: () => void;
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  function ChatPanel(
    {
      isOpen,
      onClose,
      model,
      systemPrompt,
      context,
      accentColor,
      position,
      title,
      knowledgeBase,
      actions,
      components, // ← added
      debug = false
    },
    ref
  ) {
    const [input, setInput] = useState("");
    const {
      messages,
      isStreaming,
      error,
      confirmation,
      send,
      clearHistory,
      pushContext,
      confirmAction,
      cancelAction,
    } = useAssistant({
      model,
      systemPrompt,
      context,
      knowledgeBase,
      actions,
      components,
    });

    const ollamaStatus = useOllamaStatus()

    useImperativeHandle(ref, () => ({
      pushContext,
      clearHistory,
    }));

    const panelPositionStyle = getPanelPositionStyle(position);

    const handleSend = () => {
      if (!input.trim() || isStreaming) return;
      send(input);
      setInput("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div
        style={{
          position: "fixed",
          ...panelPositionStyle,
          zIndex: 9998,
          width: 360,
          height: 520,
          background: "rgba(14, 14, 18, 0.97)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          transformOrigin: "bottom right",
          transform: isOpen
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(12px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:
            "transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
        }}
      >
        <Header
          title={title}
          accentColor={accentColor}
          onClose={onClose}
          onClear={clearHistory}
          hasMessages={messages.filter((m) => m.role !== "system").length > 0}
          status={ollamaStatus}
        />

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          components={components ?? []}
          debug={debug}
        />


{(confirmation.status === 'pending' || confirmation.status === 'executing') && confirmation.action && (
  <div style={{ padding: '0 12px 10px' }}>
    <ConfirmationCard
      call={confirmation.call as ActionCall}
      action={confirmation.action}
      onConfirm={confirmAction}
      onCancel={cancelAction}
      isExecuting={confirmation.status === 'executing'}
    />
  </div>
)}

        {error && <ErrorStrip message={error} />}
        <InputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          isStreaming={isStreaming}
          accentColor={accentColor}
        />
      </div>
    );
  }
);

export default ChatPanel;

function getPanelPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case "bottom-left":
      return { bottom: 88, left: 24 };
    case "top-right":
      return { top: 88, right: 24 };
    case "top-left":
      return { top: 88, left: 24 };
    default:
      return { bottom: 88, right: 24 };
  }
}
