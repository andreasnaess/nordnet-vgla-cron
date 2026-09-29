// Checks whether VGLA (Vanguard FTSE Global All-Cap, USD Acc) can be used for
// monthly saving on Nordnet, and pings Telegram when it can.
//
// Data source: the JSON API behind https://www.nordnet.no/etf/liste. The page
// server-renders the same call; the API returns 401 without `client-id: NEXT`.
// We search without the is_monthly_save filter and read the instrument's own
// `is_monthly_saveable` flag, so "not saveable yet" (flag false) is
// distinguishable from "search broke / instrument gone" (no match), which is
// reported as an error instead of silently looking like "not available".

const ISIN = "IE000VAHT5T0";
const SEARCH_URL =
  "https://www.nordnet.no/api/2/instrument_search/query/etflist?free_text_search=VGLA&limit=100";
const PAGE_URL =
  "https://www.nordnet.no/etf/liste?sortField=yield_1y&sortOrder=descending&freeTextSearch=Vgla&isMonthlySave=true";

async function checkVgla() {
  const res = await fetch(SEARCH_URL, {
    headers: { "client-id": "NEXT", accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nordnet API returned HTTP ${res.status}`);

  const body = await res.json();
  const match = (body.results ?? []).find(
    (r) => r.instrument_info?.isin === ISIN,
  );
  if (!match) throw new Error(`No instrument with ISIN ${ISIN} in search results`);

  const saveable = match.instrument_info.is_monthly_saveable;
  if (typeof saveable !== "boolean") {
    throw new Error(`is_monthly_saveable missing or not a boolean: ${JSON.stringify(saveable)}`);
  }
  return saveable;
}

async function notify(env, text) {
  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    },
  );
  if (!res.ok) throw new Error(`Telegram returned HTTP ${res.status}: ${await res.text()}`);
}

async function run(env) {
  let saveable;
  try {
    saveable = await checkVgla();
  } catch (err) {
    await notify(env, `⚠️ VGLA monthly-save check failed: ${err.message}`);
    throw err;
  }
  console.log(`VGLA is_monthly_saveable=${saveable}`);
  if (saveable) {
    await notify(env, `✅ VGLA is now available for monthly saving on Nordnet!\n${PAGE_URL}`);
  }
  return saveable;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(run(env));
  },
};
