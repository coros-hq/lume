import { useCallback, useEffect, useState } from "react";
import { checkOllamaConnection } from "../providers/OllamaProvider";

export type OllamaStatus = 'checking' | 'connected' | 'unreachable';

export function useOllamaStatus(intervalMs = 10000): OllamaStatus {
    const [status, setStatus] = useState<OllamaStatus>('checking')

    const check = useCallback(async () => {
        const ok = await checkOllamaConnection();
        setStatus(ok ? 'connected': 'unreachable')
    }, [])

    useEffect(() => {
        check()
        const id = setInterval(check, intervalMs)
        return () => clearInterval(id);
    }, [intervalMs])

    return status
}