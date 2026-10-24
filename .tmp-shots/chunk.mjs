const port = 9222;
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
const res = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `(async () => {
  const r = await fetch('/_next/static/chunks/app/layout.js', { cache: 'no-store' });
  const t = await r.text();
  let parseErr = null;
  try { new Function(t); } catch (e) { parseErr = e.message; }
  return { status: r.status, clen: r.headers.get('content-length'), len: t.length, head: t.slice(0, 40), tail: t.slice(-60), parseErr };
})()` });
console.log(JSON.stringify(res.result.result.value, null, 2));
ws.close();
