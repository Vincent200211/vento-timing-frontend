const PRODUCTION_API_HOST = 'https://vento-timing-backend.onrender.com'
const IS_PRODUCTION = typeof location !== 'undefined' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'
const API_BASE = IS_PRODUCTION ? `${PRODUCTION_API_HOST}/api` : '/api'
const WS_URL = IS_PRODUCTION
  ? `wss://vento-timing-backend.onrender.com/ws`
  : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`

export async function fetchSnapshot() {
  const res = await fetch(`${API_BASE}/snapshot`)
  if (!res.ok) throw new Error('Failed to fetch snapshot')
  return res.json()
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export async function fetchDrivers() {
  const res = await fetch(`${API_BASE}/drivers`)
  if (!res.ok) throw new Error('Failed to fetch drivers')
  return res.json()
}

export async function fetchTiming() {
  const res = await fetch(`${API_BASE}/timing`)
  if (!res.ok) throw new Error('Failed to fetch timing')
  return res.json()
}

export async function fetchDriverHistory(driverNumber) {
  const res = await fetch(`${API_BASE}/positions/${driverNumber}`)
  if (!res.ok) throw new Error('Failed to fetch driver history')
  return res.json()
}

export async function fetchCarData(driverNumber) {
  const res = await fetch(`${API_BASE}/car_data/${driverNumber}`)
  if (!res.ok) throw new Error('Failed to fetch car data')
  return res.json()
}

export function createWebSocket(onMessage, onOpen, onClose) {
  const ws = new WebSocket(WS_URL)
  
  ws.onopen = () => {
    console.log('WebSocket connected')
    onOpen?.()
  }
  
  ws.onclose = () => {
    console.log('WebSocket disconnected')
    onClose?.()
  }
  
  ws.onerror = (err) => {
    console.error('WebSocket error:', err)
  }
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      onMessage(msg)
    } catch (e) {
      console.error('Failed to parse message:', e)
    }
  }
  
  return ws
}
