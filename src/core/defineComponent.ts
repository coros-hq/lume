import { ComponentDefinition, ComponentPropDefinition } from '../types'

interface DefineComponentOptions {
  description: string
  props?: Record<string, ComponentPropDefinition>
  /**
   * Example phrases a user might say to trigger this component.
   * Helps the classifier match varied and indirect phrasings.
   *
   * @example
   * examples: [
   *   'what is my billing status',
   *   'how much do I owe',
   *   'when does my card get charged',
   *   'am I being charged correctly',
   *   'show me my invoice',
   * ]
   */
  examples?: string[]
}

/**
 * Define a structured UI component the assistant can render inside the chat.
 *
 * @example
 * ```tsx
 * defineComponent(
 *   'billing_summary',
 *   {
 *     description: 'Show billing info when the user asks about their plan or payments',
 *     examples: [
 *       'what is my billing status',
 *       'how much do I owe',
 *       'am I being charged correctly',
 *     ],
 *     props: {
 *       plan:   { type: 'string', required: true,  description: 'Plan name' },
 *       status: { type: 'string', required: true,  description: 'active or past_due' },
 *     },
 *   },
 *   (props) => <BillingCard plan={String(props.plan)} />
 * )
 * ```
 */
export function defineComponent(
  type: string,
  options: DefineComponentOptions,
  render: (props: Record<string, unknown>) => React.ReactNode
): ComponentDefinition {
  return {
    type,
    description: options.description,
    props: options.props,
    examples: options.examples,
    render,
  }
}