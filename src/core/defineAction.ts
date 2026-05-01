import { Action, ActionParameter } from '../types'

interface DefineActionOptions {
  description: string
  parameters?: Record<string, ActionParameter>
  /**
   * Example phrases a user might say to trigger this action.
   * The more varied, the better — helps the classifier match
   * non-obvious phrasings.
   *
   * @example
   * examples: [
   *   'take me to billing',
   *   'go to the billing page',
   *   'open billing',
   *   'navigate to billing',
   * ]
   */
  examples?: string[]
}

/**
 * Define an action the assistant can trigger inside your app.
 *
 * When the user's message matches the action intent, the assistant shows
 * a confirmation card. If the user confirms, your handler is called.
 *
 * @example
 * ```tsx
 * defineAction(
 *   'redirectTo',
 *   {
 *     description: 'Navigate to a page in the app',
 *     examples: ['take me to billing', 'go to settings', 'open the dashboard'],
 *     parameters: {
 *       page: { type: 'string', required: true, description: 'Page name' },
 *     },
 *   },
 *   async ({ page }) => router.push(page as string)
 * )
 * ```
 */
export function defineAction(
  name: string,
  options: DefineActionOptions,
  handler: (params: Record<string, unknown>) => Promise<void>
): Action {
  return {
    name,
    description: options.description,
    parameters: options.parameters,
    examples: options.examples,
    handler,
  }
}