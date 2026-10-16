// endpoints/tick.js — posts the current NEAR (or RHEA) /USD price to the channel, BTC Price style:
// 🟢 up / 🔴 down vs the last post, no emoji if unchanged.
// Serverless has no cron yet, so .github/workflows/tick.yml (GitHub cron, every 5 min) calls this 5 times,
// one per minute: `npx tgcloud run endpoints/tick "{ channel: '@yourchannel', coin: 'RHEA' }"` (coin defaults to NEAR).
// ponytail: no Mini App is configured, so nothing else can reach this endpoint.

import { api, db, fetch } from 'sdk';
import { eq } from 'sdk/db';
import { last } from '../schema.js';

// id = row in `last`. RHEA isn't on Binance; MEXC answers with the same { price } shape.
const COINS = {
  NEAR: { id: 1, url: 'https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT' },
  RHEA: { id: 2, url: 'https://api.mexc.com/api/v3/ticker/price?symbol=RHEAUSDT' },
};

export default async function ({ channel, coin = 'NEAR' }) {
  const { id, url } = COINS[coin];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const price = parseFloat((await res.json()).price);

  const prev = (await db.select().from(last).where(eq(last.id, id)).get())?.price;
  const dot = prev == null || price === prev ? '' : price > prev ? '🟢 ' : '🔴 ';

  const text = `${dot}${price}$`;
  await api.sendMessage({ chat_id: channel, text, disable_notification: true });
  await db.insert(last).values({ id, price })
    .onConflictDoUpdate({ target: last.id, set: { price } }).run();
  return text;
}
