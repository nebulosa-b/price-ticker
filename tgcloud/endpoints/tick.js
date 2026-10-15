// endpoints/tick.js — posts the current NEAR/USD price to the channel, BTC Price style:
// 🟢 up / 🔴 down vs the last post, no emoji if unchanged.
// Serverless has no cron yet, so .github/workflows/tick.yml (GitHub cron, every 5 min) calls this 5 times,
// one per minute: `npx tgcloud run endpoints/tick "{ channel: '@yourchannel' }"`.
// ponytail: no Mini App is configured, so nothing else can reach this endpoint.

import { api, db, fetch } from 'sdk';
import { eq } from 'sdk/db';
import { last } from '../schema.js';

const URL = 'https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT';

export default async function ({ channel }) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const price = parseFloat((await res.json()).price);

  const prev = (await db.select().from(last).where(eq(last.id, 1)).get())?.price;
  const dot = prev == null || price === prev ? '' : price > prev ? '🟢 ' : '🔴 ';

  const text = `${dot}${price}$`;
  await api.sendMessage({ chat_id: channel, text, disable_notification: true });
  await db.insert(last).values({ id: 1, price })
    .onConflictDoUpdate({ target: last.id, set: { price } }).run();
  return text;
}
