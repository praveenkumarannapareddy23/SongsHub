const port = 9222;
const baseUrl = process.argv[2];
const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") logs.push(m.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 300));
});
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: "about:blank" });
await new Promise((r) => setTimeout(r, 500));
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 10000));
const res = await send("Runtime.evaluate", { expression: `({ effect: window.__lyrEffect, observed: window.__lyrObserved, debug: window.__lyrDebug && window.__lyrDebug.slice(0,5), active: [...document.querySelectorAll('p')].filter(p => p.className.includes && p.className.includes('D4A32A')).length })`, returnByValue: true });
console.log(JSON.stringify(res.result.result.value, null, 2));
console.log("errors", JSON.stringify(logs.slice(0,4)));
ws.close();
