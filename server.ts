import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Market Feed State
interface LiveTick {
  symbol: string;
  price: number;
  timestamp: number;
  datetime: string;
  dayHigh?: number;
  dayLow?: number;
  change?: number;
  percentChange?: number;
}

let lastLiveTick: LiveTick | null = null;
let lastTickTime: number = 0;
let isWsConnected = false;
let wsConnectionError: string | null = null;
let activeWs: WebSocket | null = null;
let sseClients: express.Response[] = [];
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let pollInterval: NodeJS.Timeout | null = null;
let isConnecting = false;

function getApiKey(): string {
  return (
    process.env.TWELVE_DATA_API_KEY ||
    process.env.TWELVEDATA_API_KEY ||
    process.env.VITE_TWELVE_DATA_API_KEY ||
    ''
  ).trim();
}

// Broadcast SSE message to all connected clients
function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      // client dropped
    }
  });
}

// Initialize Twelve Data WebSocket with auto-reconnect
function connectTwelveDataWs() {
  const apiKey = getApiKey();
  if (!apiKey) {
    isWsConnected = false;
    isConnecting = false;
    wsConnectionError = 'TWELVE_DATA_API_KEY environment variable is not configured.';
    broadcastSSE({
      type: 'status',
      connected: false,
      status: 'DISCONNECTED',
      error: wsConnectionError,
      symbol: 'XAU/USD',
      apiKeyConfigured: false,
    });
    return;
  }

  if (activeWs && (activeWs.readyState === WebSocket.OPEN || activeWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  isConnecting = true;
  broadcastSSE({
    type: 'status',
    connected: false,
    status: 'CONNECTING',
    symbol: 'XAU/USD',
    apiKeyConfigured: true,
  });

  try {
    const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`;
    const ws = new WebSocket(wsUrl);
    activeWs = ws;

    ws.on('open', () => {
      isWsConnected = true;
      isConnecting = false;
      wsConnectionError = null;
      reconnectAttempts = 0;
      console.log('[TwelveData WS] Connected to Twelve Data stream for XAU/USD');

      // Subscribe to XAU/USD
      const subscribeMsg = JSON.stringify({
        action: 'subscribe',
        params: {
          symbols: 'XAU/USD',
        },
      });
      ws.send(subscribeMsg);

      broadcastSSE({
        type: 'status',
        connected: true,
        status: 'LIVE',
        symbol: 'XAU/USD',
        dataSource: 'Twelve Data • LIVE',
        message: 'Connected to live Twelve Data feed',
        apiKeyConfigured: true,
      });

      // Immediate quote poll for rapid initial price
      pollTwelveDataQuote();
    });

    ws.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());

        // Twelve Data price event
        if (parsed.event === 'price' && (parsed.symbol === 'XAU/USD' || parsed.symbol === 'XAUUSD')) {
          const rawPrice = typeof parsed.price === 'number' ? parsed.price : parseFloat(parsed.price);
          if (!isNaN(rawPrice) && rawPrice > 0) {
            const timestamp = parsed.timestamp ? Number(parsed.timestamp) : Math.floor(Date.now() / 1000);
            const now = new Date(timestamp * 1000);

            lastLiveTick = {
              symbol: 'XAU/USD',
              price: Number(rawPrice.toFixed(2)),
              timestamp: timestamp,
              datetime: now.toISOString(),
              dayHigh: parsed.day_high ? Number(parseFloat(parsed.day_high).toFixed(2)) : undefined,
              dayLow: parsed.day_low ? Number(parseFloat(parsed.day_low).toFixed(2)) : undefined,
            };
            lastTickTime = Date.now();
            isWsConnected = true;
            isConnecting = false;

            broadcastSSE({
              type: 'tick',
              dataSource: 'Twelve Data • LIVE',
              ...lastLiveTick,
            });
          }
        } else if (parsed.event === 'subscribe-status') {
          if (parsed.status === 'ok') {
            console.log('[TwelveData WS] Subscribed successfully to XAU/USD');
          } else {
            console.warn('[TwelveData WS] Subscribe status:', parsed);
          }
        } else if (parsed.event === 'heartbeat') {
          broadcastSSE({
            type: 'heartbeat',
            timestamp: Math.floor(Date.now() / 1000),
          });
        } else if (parsed.status === 'error' || parsed.event === 'error') {
          console.error('[TwelveData WS] Error response:', parsed.message || parsed);
          wsConnectionError = parsed.message || 'Twelve Data stream error';
          broadcastSSE({
            type: 'status',
            connected: false,
            status: 'DISCONNECTED',
            error: wsConnectionError,
            symbol: 'XAU/USD',
            apiKeyConfigured: true,
          });
        }
      } catch (err) {
        console.error('[TwelveData WS] Message parsing error:', err);
      }
    });

    ws.on('error', (err) => {
      console.error('[TwelveData WS] Socket error:', err.message);
      isWsConnected = false;
      isConnecting = false;
      wsConnectionError = err.message || 'WebSocket connection error';
      broadcastSSE({
        type: 'status',
        connected: false,
        status: 'DISCONNECTED',
        error: wsConnectionError,
        symbol: 'XAU/USD',
        apiKeyConfigured: true,
      });
    });

    ws.on('close', (code, reason) => {
      console.warn(`[TwelveData WS] Socket closed (code: ${code}, reason: ${reason})`);
      isWsConnected = false;
      isConnecting = false;
      activeWs = null;

      broadcastSSE({
        type: 'status',
        connected: false,
        status: 'DISCONNECTED',
        error: 'Market data feed disconnected. Reconnecting...',
        symbol: 'XAU/USD',
        apiKeyConfigured: !!apiKey,
      });

      // Exponential backoff reconnect: 2s, 4s, 8s, up to 10s
      reconnectAttempts++;
      const delay = Math.min(10000, 2000 * Math.pow(1.5, Math.min(reconnectAttempts, 4)));

      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        connectTwelveDataWs();
      }, delay);
    });
  } catch (e: any) {
    isWsConnected = false;
    isConnecting = false;
    wsConnectionError = e.message || 'Failed to initiate WebSocket connection';
    console.error('[TwelveData WS] Initialization exception:', e);
  }
}

// REST Poller for continuous updates & fallbacks
async function pollTwelveDataQuote() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const url = `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return;

    const data = await resp.json();
    if (data && data.close && !data.code) {
      const price = parseFloat(data.close);
      if (!isNaN(price) && price > 0) {
        const timestamp = data.timestamp ? Number(data.timestamp) : Math.floor(Date.now() / 1000);
        lastLiveTick = {
          symbol: 'XAU/USD',
          price: Number(price.toFixed(2)),
          timestamp,
          datetime: data.datetime || new Date().toISOString(),
          dayHigh: data.high ? Number(parseFloat(data.high).toFixed(2)) : undefined,
          dayLow: data.low ? Number(parseFloat(data.low).toFixed(2)) : undefined,
          change: data.change ? Number(parseFloat(data.change).toFixed(2)) : undefined,
          percentChange: data.percent_change ? Number(parseFloat(data.percent_change).toFixed(2)) : undefined,
        };
        lastTickTime = Date.now();

        broadcastSSE({
          type: 'tick',
          dataSource: 'Twelve Data • LIVE',
          ...lastLiveTick,
        });
      }
    } else if (data && data.message && data.code) {
      wsConnectionError = data.message;
    }
  } catch {
    // ignore poll errors
  }
}

// Poll every 5 seconds as a supplementary stream / fallback
pollInterval = setInterval(() => {
  if (getApiKey()) {
    // If no ticks in last 4 seconds or WebSocket is not open, fetch REST quote
    if (Date.now() - lastTickTime > 4000 || !isWsConnected) {
      pollTwelveDataQuote();
    }
  }
}, 5000);

// API ENDPOINTS

// 1. Connection & Data Status
app.get('/api/market-data/status', (req, res) => {
  const apiKey = getApiKey();
  const isAlive = (isWsConnected || (Date.now() - lastTickTime < 15000 && lastLiveTick !== null)) && !!apiKey;
  const status = !apiKey ? 'DISCONNECTED' : isAlive ? 'LIVE' : isConnecting ? 'CONNECTING' : 'DISCONNECTED';

  res.json({
    symbol: 'XAU/USD',
    apiKeyConfigured: !!apiKey,
    connected: isAlive,
    status: status,
    dataSource: isAlive ? 'Twelve Data • LIVE' : 'Twelve Data • DISCONNECTED',
    lastTick: lastLiveTick,
    lastUpdate: lastLiveTick ? new Date(lastLiveTick.timestamp * 1000).toISOString() : null,
    error: !apiKey ? 'TWELVE_DATA_API_KEY environment variable is not configured' : wsConnectionError,
  });
});

// 2. Real Historical Candles for XAU/USD from Twelve Data
app.get('/api/market-data/candles', async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(400).json({
      status: 'error',
      message: 'TWELVE_DATA_API_KEY environment variable is not configured',
      symbol: 'XAU/USD',
    });
  }

  const interval = (req.query.interval as string) || '1min'; // 1min, 5min, 15min
  const outputsize = parseInt((req.query.outputsize as string) || '120', 10);

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error' || data.code) {
      return res.status(400).json({
        status: 'error',
        message: data.message || 'Twelve Data error fetching candles',
        code: data.code,
      });
    }

    if (!Array.isArray(data.values)) {
      return res.status(500).json({
        status: 'error',
        message: 'Unexpected format from Twelve Data API',
      });
    }

    // Transform Twelve Data values to Candle objects (oldest to newest)
    const candles = data.values
      .slice()
      .reverse()
      .map((item: any) => {
        const time = Math.floor(new Date(item.datetime).getTime() / 1000);
        return {
          time: isNaN(time) ? Math.floor(Date.now() / 1000) : time,
          open: Number(parseFloat(item.open).toFixed(2)),
          high: Number(parseFloat(item.high).toFixed(2)),
          low: Number(parseFloat(item.low).toFixed(2)),
          close: Number(parseFloat(item.close).toFixed(2)),
          volume: item.volume ? parseInt(item.volume, 10) || 100 : 100,
        };
      })
      .filter((c: any) => !isNaN(c.open) && !isNaN(c.close) && c.open > 0 && c.close > 0);

    return res.json({
      status: 'ok',
      symbol: 'XAU/USD',
      interval,
      candles,
    });
  } catch (error: any) {
    console.error('Error fetching candles from Twelve Data:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch historical candles',
    });
  }
});

// 3. SSE Stream for Live Ticks
app.get('/api/market-data/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial state immediately
  const apiKey = getApiKey();
  const isAlive = (isWsConnected || (Date.now() - lastTickTime < 15000 && lastLiveTick !== null)) && !!apiKey;
  const status = !apiKey ? 'DISCONNECTED' : isAlive ? 'LIVE' : isConnecting ? 'CONNECTING' : 'DISCONNECTED';

  res.write(
    `data: ${JSON.stringify({
      type: 'status',
      connected: isAlive,
      status: status,
      apiKeyConfigured: !!apiKey,
      symbol: 'XAU/USD',
      dataSource: isAlive ? 'Twelve Data • LIVE' : 'Twelve Data • DISCONNECTED',
      lastTick: lastLiveTick,
      error: !apiKey ? 'TWELVE_DATA_API_KEY is not configured' : wsConnectionError,
    })}\n\n`
  );

  // Connect WS if not active yet
  if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
    connectTwelveDataWs();
  }

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// Trigger initial connect
connectTwelveDataWs();

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`XAU/USD Server running on port ${PORT}`);
  });
}

startServer();
