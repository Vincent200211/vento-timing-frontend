import { useEffect, useRef, useCallback, useState } from 'react'
import { createWebSocket } from '../services/api'

const RECONNECT_DELAY = 3000
const PING_INTERVAL = 25000

export function useWebSocket(onMessage) {
  const wsRef = useRef(null)
  const pingRef = useRef(null)
  const reconnectRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current) return

    const ws = createWebSocket(
      (msg) => { onMessage(msg) },
      () => {
        setConnected(true)
        pingRef.current = setInterval(() => {
          try { ws.send(JSON.stringify({ type: 'ping' })) } catch {}
        }, PING_INTERVAL)
      },
      () => {
        setConnected(false)
        clearInterval(pingRef.current)
        wsRef.current = null
        if (mountedRef.current) {
          reconnectRef.current = setTimeout(connect, RECONNECT_DELAY)
        }
      }
    )
    wsRef.current = ws
  }, [onMessage])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectRef.current)
      clearInterval(pingRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { connected }
}
