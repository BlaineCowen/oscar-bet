import { KALSHI_EVENTS, STATIC_CATEGORIES } from "./kalshi-events";

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

// Kalshi uses this generic diamond icon when they have no real image for a market
const KALSHI_FALLBACK_IMAGE =
  "https://kalshi-fallback-images.s3.amazonaws.com/structured_icons/diamond.webp";

function kalshiHeaders() {
  return {
    Authorization: `Bearer ${process.env.KALSHI_KEY}`,
    Accept: "application/json",
  };
}

// --- Raw API types ---

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  status: string; // "active" | "finalized"
  custom_strike: { Nominee?: string } | null;
  subtitle: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  last_price_dollars: string;
}

interface KalshiEventResponse {
  event: object;
  markets: KalshiMarket[];
}

interface KalshiMarketMetadata {
  market_ticker: string;
  image_url: string;
  color_code: string;
}

interface KalshiEventMetadataResponse {
  market_details: KalshiMarketMetadata[];
}

// --- Public types ---

export interface KalshiNominee {
  name: string;
  kalshiTicker: string;
  /**
   * Payout multiplier = 1 / yes_bid  (e.g. 0.79 → 1.27, 0.03 → 33.3)
   */
  odds: number;
  imageUrl: string | null;
}

export interface KalshiCategory {
  category: string;
  nominees: KalshiNominee[];
}

// --- Helpers ---

const MIN_MULTIPLIER = 1.01;
const NO_BETS_MULTIPLIER = 100;

/**
 * Best-effort probability from a Kalshi market.
 * Priority: mid-price (bid+ask)/2 → last traded price → ask → 100x fallback.
 * yes_bid is often 0 for illiquid long-shots even when the market has a real price.
 */
function marketProbability(market: KalshiMarket): number {
  const bid = parseFloat(market.yes_bid_dollars);
  const ask = parseFloat(market.yes_ask_dollars);
  const last = parseFloat(market.last_price_dollars);

  if (bid > 0 && ask > 0) return (bid + ask) / 2; // tight market: use mid
  if (bid > 0) return bid;
  if (ask > 0) return ask; // bid=0 but ask exists (illiquid long-shot)
  if (last > 0) return last; // stale but better than nothing
  return 0;
}

function probabilityToMultiplier(market: KalshiMarket): number {
  const p = marketProbability(market);
  if (!p || p <= 0) return NO_BETS_MULTIPLIER;
  const raw = 1 / p;
  return Math.max(MIN_MULTIPLIER, Math.round(raw * 100) / 100);
}

/** Display/payout odds: never below 1.01, treat 0 as 100 (no bets). */
export function effectiveOdds(odds: number): number {
  if (odds <= 0) return NO_BETS_MULTIPLIER;
  return Math.max(MIN_MULTIPLIER, odds);
}

function getNomineeName(market: KalshiMarket): string {
  return (
    market.custom_strike?.Nominee?.trim() ||
    market.subtitle?.trim() ||
    market.ticker
  );
}

/** Treat Kalshi's generic fallback icon as no image */
function realImageUrl(url: string | undefined | null): string | null {
  if (!url || url.includes("diamond.webp")) return null;
  return url;
}

// --- API fetchers ---

async function fetchKalshiEvent(eventTicker: string): Promise<KalshiMarket[]> {
  const res = await fetch(`${KALSHI_BASE}/events/${eventTicker}`, {
    headers: kalshiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Kalshi event fetch failed for ${eventTicker}: ${res.status}`
    );
  }
  const data: KalshiEventResponse = await res.json();
  return data.markets ?? [];
}

async function fetchKalshiEventMetadata(
  eventTicker: string
): Promise<Map<string, string>> {
  const res = await fetch(`${KALSHI_BASE}/events/${eventTicker}/metadata`, {
    headers: kalshiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`Kalshi metadata fetch failed for ${eventTicker}: ${res.status}`);
    return new Map();
  }
  const data: KalshiEventMetadataResponse = await res.json();
  const map = new Map<string, string>();
  for (const detail of data.market_details ?? []) {
    const url = realImageUrl(detail.image_url);
    if (url) map.set(detail.market_ticker, url);
  }
  return map;
}

/**
 * Fetches one Oscar category sequentially (event then metadata) to stay
 * well within Kalshi's rate limits.
 */
async function fetchKalshiCategory(
  categoryName: string,
  eventTicker: string
): Promise<KalshiCategory> {
  // Sequential — avoids doubling the concurrent request count
  const markets = await fetchKalshiEvent(eventTicker);
  const imageMap = await fetchKalshiEventMetadata(eventTicker);

  const activeMarkets = markets.filter(
    (m) => m.status === "active" && m.custom_strike?.Nominee !== "Tie"
  );

  const nominees: KalshiNominee[] = activeMarkets.map((market) => ({
    name: getNomineeName(market),
    kalshiTicker: market.ticker,
    odds: probabilityToMultiplier(market),
    imageUrl: imageMap.get(market.ticker) ?? null,
  }));

  return { category: categoryName, nominees };
}

const BATCH_SIZE = 4;
const BATCH_DELAY_MS = 400; // pause between batches to stay under rate limits

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch all Oscar categories in small batches with a pause between each
 * to stay well under Kalshi's rate limits.
 */
export async function fetchAllOscarCategories(): Promise<KalshiCategory[]> {
  const entries = Object.entries(KALSHI_EVENTS);
  const categories: KalshiCategory[] = [];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(BATCH_DELAY_MS);

    const batch = entries.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(([categoryName, eventTicker]) =>
        fetchKalshiCategory(categoryName, eventTicker)
      )
    );

    for (let j = 0; j < results.length; j++) {
      const [categoryName, eventTicker] = batch[j];
      const result = results[j];
      if (result.status === "fulfilled") {
        if (result.value.nominees.length > 0) {
          categories.push(result.value);
          console.log(
            `  ✓ ${categoryName}: ${result.value.nominees.length} nominees`
          );
        } else {
          console.log(`  ○ ${categoryName}: 0 active nominees (skipped)`);
        }
      } else {
        console.warn(
          `  ✗ ${categoryName} (${eventTicker}): ${result.reason?.message ?? result.reason}`
        );
      }
    }
  }

  // Merge in static categories that Kalshi doesn't have markets for
  const fetchedNames = new Set(categories.map((c) => c.category));
  for (const staticCat of STATIC_CATEGORIES) {
    if (!fetchedNames.has(staticCat.category)) {
      categories.push(staticCat);
      console.log(
        `  + ${staticCat.category}: ${staticCat.nominees.length} nominees (static)`
      );
    }
  }

  // Re-sort to match KALSHI_EVENTS key order, static categories land at their natural position
  const ORDER = Object.keys(KALSHI_EVENTS);
  categories.sort((a, b) => {
    const ai = ORDER.indexOf(a.category);
    const bi = ORDER.indexOf(b.category);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  console.log(
    `fetchAllOscarCategories: ${categories.length}/${entries.length} categories loaded`
  );
  return categories;
}

/**
 * Fetches fresh yes_bid odds for a list of market tickers.
 * Groups tickers by event, makes one pair of calls per event, sequentially.
 */
export async function fetchFreshOdds(
  kalshiTickers: string[]
): Promise<Map<string, { odds: number; imageUrl: string | null }>> {
  // Derive event tickers: "KXOSCARPIC-26-ONE" → "KXOSCARPIC-26"
  const eventTickerSet = new Set<string>();
  for (const ticker of kalshiTickers) {
    const parts = ticker.split("-");
    eventTickerSet.add(parts.slice(0, -1).join("-"));
  }

  const tickerSet = new Set(kalshiTickers);
  const result = new Map<string, { odds: number; imageUrl: string | null }>();

  for (const eventTicker of eventTickerSet) {
    try {
      const markets = await fetchKalshiEvent(eventTicker);
      const imageMap = await fetchKalshiEventMetadata(eventTicker);

      for (const market of markets) {
        if (tickerSet.has(market.ticker)) {
          result.set(market.ticker, {
            odds: probabilityToMultiplier(market),
            imageUrl: imageMap.get(market.ticker) ?? null,
          });
        }
      }
    } catch (err) {
      console.warn(`fetchFreshOdds: skipped event ${eventTicker}:`, err);
    }
  }

  return result;
}
