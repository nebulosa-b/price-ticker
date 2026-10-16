import { table, integer, real } from 'sdk/db';

// One row per coin (see COINS in endpoints/tick.js) holding the last posted price, to pick 🟢/🔴.
export const last = table('last', {
  id: integer('id').primaryKey(),
  price: real('price').notNull(),
});
