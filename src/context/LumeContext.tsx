import {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    ReactNode,
  } from 'react'
  import { AssistantConfig, AssistantHandle } from '../types'
  
  interface LumeContextValue {
    // base config — set once at provider level
    config: Partial<AssistantConfig>
  
    // live app context — updated as user navigates
    context: Record<string, string | number | boolean | null | undefined>
    setContext: (ctx: Record<string, string | number | boolean | null | undefined>) => void
    mergeContext: (partial: Record<string, string | number | boolean | null | undefined>) => void
  
    // widget controls — callable from anywhere
    open: () => void
    close: () => void
    toggle: () => void
    pushContext: (note: string) => void
    clearHistory: () => void
  
    // internal — widget registers itself here
    _registerWidget: (handle: AssistantHandle | null) => void
  }
  
  const LumeContext = createContext<LumeContextValue | null>(null)
  
  interface LumeProviderProps extends Partial<AssistantConfig> {
    children: ReactNode
  }
  
  export function LumeProvider({
    children,
    // everything else becomes base config
    ...config
  }: LumeProviderProps) {
    const [liveContext, setLiveContext] = useState<
      Record<string, string | number | boolean | null | undefined>
    >(config.context ?? {})
  
    const widgetRef = useRef<AssistantHandle | null>(null)
  
    const setContext = useCallback(
      (ctx: Record<string, string | number | boolean | null | undefined>) => {
        setLiveContext(ctx)
      },
      []
    )
  
    const mergeContext = useCallback(
      (partial: Record<string, string | number | boolean | null | undefined>) => {
        setLiveContext(prev => ({ ...prev, ...partial }))
      },
      []
    )
  
    const open         = useCallback(() => widgetRef.current?.open(), [])
    const close        = useCallback(() => widgetRef.current?.close(), [])
    const toggle       = useCallback(() => widgetRef.current?.toggle(), [])
    const pushContext  = useCallback((note: string) => widgetRef.current?.pushContext(note), [])
    const clearHistory = useCallback(() => widgetRef.current?.clearHistory(), [])
  
    const _registerWidget = useCallback((handle: AssistantHandle | null) => {
      widgetRef.current = handle
    }, [])
  
    return (
      <LumeContext.Provider value={{
        config,
        context: liveContext,
        setContext,
        mergeContext,
        open,
        close,
        toggle,
        pushContext,
        clearHistory,
        _registerWidget,
      }}>
        {children}
      </LumeContext.Provider>
    )
  }
  
  /**
   * Access Lume controls and context from anywhere in your app.
   *
   * @example
   * ```tsx
   * const { setContext, pushContext, open } = useLume()
   *
   * // update context on navigation
   * useEffect(() => {
   *   setContext({ currentPage: page, userPlan: user.plan })
   * }, [page, user.plan])
   *
   * // push live events
   * pushContext('Payment failed: card_declined')
   *
   * // open the widget programmatically
   * open()
   * ```
   */
  export function useLume(): LumeContextValue {
    const ctx = useContext(LumeContext)
    if (!ctx) {
      throw new Error('useLume must be used inside a <LumeProvider>')
    }
    return ctx
  }
  
  export function useLumeSafe(): LumeContextValue | null {
    return useContext(LumeContext)
  }