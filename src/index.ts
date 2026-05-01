// components
export { AssistantWidget }          from './components/AssistantWidget'

// context — new
export { LumeProvider, useLume }    from './context/LumeContext'

// hooks
export { useAssistant }             from './hooks/useAssistant'

// helpers
export { defineAction }             from './core/defineAction'
export { defineComponent }          from './core/defineComponent'

// types
export type {
  AssistantConfig,
  AssistantHandle,
  Message,
  Action,
  ActionParameter,
  ComponentDefinition,
  ComponentPropDefinition,
  ConfirmationState,
} from './types'

export type { KnowledgeChunk }      from './core/ragScorer'