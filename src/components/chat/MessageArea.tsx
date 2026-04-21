import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../types";


export function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: 13,
        }}
      >
        Ask me anything
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {messages.filter(m => m.role !== 'system').map((msg, i) => (

        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}
        >
         <div style={{
  maxWidth: '80%',
  padding: '8px 12px',
  borderRadius: msg.role === 'user'
    ? '14px 14px 3px 14px'
    : '14px 14px 14px 3px',
  background: msg.role === 'user'
    ? 'rgba(99,102,241,0.25)'
    : 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.88)',
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: "left"
}}>
            {msg.role === "assistant" ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
