import pg from "pg";
const u=new URL(process.env.TIGER_MARKET_DB_URL);u.searchParams.delete("channel_binding");u.searchParams.delete("sslmode");
const c=new pg.Client({connectionString:u.toString(),ssl:{rejectUnauthorized:false,servername:u.hostname}});await c.connect();
console.log((await c.query("select payment_method, count(*) from offers group by 1 order by 2 desc limit 15")).rows);
console.log((await c.query("select column_name from information_schema.columns where table_name='offers'")).rows.map(r=>r.column_name).join(","));
await c.end();
