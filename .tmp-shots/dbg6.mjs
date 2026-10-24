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
  if (m.method === "Runtime.exceptionThrown") { const d = m.params.exceptionDetails; logs.push(JSON.stringify({ text: d.text, url: d.url, line: d.lineNumber, col: d.columnNumber, scriptId: d.scriptId, desc: d.exception?.description })); }
  if (m.method === "Log.entryAdded") { const en = m.params.entry; if (en.level === "error") logs.push("LOG " + JSON.stringify({ text: en.text, url: en.url, line: en.lineNumber })); }
});
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: "about:blank" });
await new Promise((r) => setTimeout(r, 400));
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 9000));
console.log(logs.slice(0, 8).join("\n"));
ws.close();
