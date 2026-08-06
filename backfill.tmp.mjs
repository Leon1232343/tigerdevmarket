import { Client } from "pg";
const KEY = process.env.LOVABLE_API_KEY;
const DIMS = 3072, MODEL = "google/gemini-embedding-2";
const c = new Client({ connectionString: process.env.TIGER_MARKET_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const input = (r) => [r.post_type&&`Post type: ${r.post_type}`, r.category&&`Category: ${r.category}`, r.service_type&&`Service: ${r.service_type}`, r.price_display&&`Price: ${r.price_display}`, (r.description||"").trim()||(r.message_content||"").trim()].filter(Boolean).join("\n").slice(0,4000);
let total = 0;
for (;;) {
  const { rows } = await c.query(`SELECT o.offer_id,o.message_content,o.description,o.category,o.service_type,o.post_type,o.price_display FROM offers o LEFT JOIN offer_embeddings e ON e.offer_id=o.offer_id WHERE e.offer_id IS NULL AND o.message_content IS NOT NULL AND length(o.message_content)>20 ORDER BY o.timestamp DESC NULLS LAST LIMIT 100`);
  if (!rows.length) break;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ model: MODEL, input: rows.map(input) }) });
  if (!res.ok) { console.error(res.status, (await res.text()).slice(0,400)); if(res.status===429||res.status>=500){await new Promise(r=>setTimeout(r,5000)); continue;} break; }
  const data = (await res.json()).data.sort((a,b)=>a.index-b.index);
  for (let i=0;i<rows.length;i++) {
    const e = data[i]?.embedding; if (!e || e.length!==DIMS) continue;
    await c.query(`INSERT INTO offer_embeddings(offer_id,model,content_hash,embedding) VALUES($1,$2,md5($3),$4::vector(${DIMS})) ON CONFLICT (offer_id) DO UPDATE SET embedding=EXCLUDED.embedding,model=EXCLUDED.model,content_hash=EXCLUDED.content_hash,updated_at=now()`, [rows[i].offer_id, MODEL, input(rows[i]), `[${e.join(",")}]`]);
    total++;
  }
  console.log("indexed", total);
}
console.log("done", total);
await c.end();
