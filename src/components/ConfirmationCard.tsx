import { Action, ActionCall } from "../types";

interface ConfirmationCardProps {
  call: ActionCall;
  action: Action;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

export function ConfirmationCard({
  call,
  action,
  onConfirm,
  onCancel,
  isExecuting,
}: ConfirmationCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(99,102,241,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ⚡
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.3,
            }}
          >
            {action.description}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
            Requires your confirmation
          </div>
        </div>
      </div>

      {/* Parameters */}
      {Object.entries(call.parameters).length > 0 && (
        <div style={{ padding: "10px 14px" }}>
          {Object.entries(call.parameters).map(([key, value], i, arr) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom:
                  i < arr.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "capitalize",
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.8)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onCancel}
          disabled={isExecuting}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            cursor: isExecuting ? "default" : "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            if (!isExecuting) {
              (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"
              ;(e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"
            }
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"
            ;(e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            border: "none",
            background: isExecuting ? "rgba(99,102,241,0.5)" : "#6366f1",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            cursor: isExecuting ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => {
            if (!isExecuting)
              (e.target as HTMLButtonElement).style.background = "#4f46e5"
          }}
          onMouseLeave={e => {
            if (!isExecuting)
              (e.target as HTMLButtonElement).style.background = "#6366f1"
          }}
        >
          {isExecuting ? (
            <>
              <span
                style={{
                  width: 10,
                  height: 10,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Running…
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}