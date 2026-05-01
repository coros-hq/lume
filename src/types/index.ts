import { ComponentCall } from "../core/componentParser";
import { KnowledgeChunk } from "../core/ragScorer";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  componentCall?: ComponentCall
  intent?: string
}

export interface AssistantConfig {
  model?: string;
  systemPrompt?: string;
  context?: Record<string, string | number | boolean | null | undefined>;
  knowledgeBase?: KnowledgeChunk[];
  actions?: Action[];
  accentColor?: string;
  components?: ComponentDefinition[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  title?: string;
  debug?: boolean
}
export interface AssistantHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  pushContext: (note: string) => void;
  clearHistory: () => void;
}

export interface ActionParameter {
  type: "string" | "number" | "boolean";
  description: string;
  required?: boolean;
}

export interface Action {
  name: string;
  description: string;
  parameters?: Record<string, ActionParameter>;
  examples?: string[];
  handler: (params: Record<string, ActionParameter>) => Promise<void>;
}

export interface ActionCall {
  action: string;
  parameters: Record<string, unknown>;
}

export type ConfirmationState =
  | { status: "idle" }
  | { status: "pending"; call: ActionCall; action: Action }
  | { status: "executing"; call?: ActionCall; action?: Action }
  | { status: "done"; result: string }
  | { status: "error"; message: string };

export interface ComponentPropDefinition {
  type: string;
  required?: boolean;
  description: string;
}

export interface ComponentDefinition {
  type: string;
  description: string;
  props?: Record<string, ComponentPropDefinition>;
  examples?: string[]
  render: (props: Record<string, unknown>) => React.ReactNode;
}
