# nordnet-vgla-cron

Cloudflare Worker that checks once a day whether VGLA (Vanguard FTSE Global All-Cap UCITS ETF, USD Acc, ISIN `IE000VAHT5T0`) can be used for monthly saving on Nordnet, and sends a Telegram message when it can.

## How it works

- Runs daily at 07:00 UTC (`wrangler.toml`).
- Calls Nordnet's ETF search API (the one behind [nordnet.no/etf/liste](https://www.nordnet.no/etf/liste?sortField=yield_1y&sortOrder=descending&freeTextSearch=Vgla&isMonthlySave=true)) and reads VGLA's `is_monthly_saveable` flag. The API requires the header `client-id: NEXT`.
- Sends a Telegram message:
  - ✅ when the flag is `true`, once a day until you delete the worker.
  - ⚠️ when the check fails: bad HTTP status, VGLA missing from the results, or the flag missing.
- Nothing is sent while VGLA isn't available.
- The worker has no public URL (`workers_dev = false`); it only runs on the schedule.

## Setup

```sh
pnpm install
pnpm wrangler login
pnpm wrangler secret put TELEGRAM_BOT_TOKEN   # from @BotFather
pnpm wrangler secret put TELEGRAM_CHAT_ID     # message the bot, then check https://api.telegram.org/bot<TOKEN>/getUpdates
pnpm run deploy
```

## Checking that it runs

- Live logs: `pnpm run tail`
- Past runs: Cloudflare dashboard → Workers & Pages → `nordnet-vgla-cron` → Settings → Trigger Events → View events

## Stopping it

Once monthly saving is set up in Nordnet:

```sh
pnpm wrangler delete
```
