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
  if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.type + " :: " + m.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 500));
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC :: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 700));
});
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: "about:blank" });
await new Promise((r) => setTimeout(r, 400));
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 10000));
const res = await send("Runtime.evaluate", { expression: `(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'English');
  const before = document.querySelector('p.text-center') ? document.querySelector('p.text-center').textContent.slice(0,20) : null;
  if (btn) btn.click();
  return { clicked: !!btn, before };
})()`, returnByValue: true });
await new Promise((r) => setTimeout(r, 1200));
const after = await send("Runtime.evaluate", { expression: `({ effect: window.__lyrEffect, observed: window.__lyrObserved, first: document.querySelector('[data-line-index] p') ? document.querySelector('[data-line-index] p').textContent.slice(0,30) : null })`, returnByValue: true });
console.log("click", JSON.stringify(res.result.result.value), "after", JSON.stringify(after.result.result.value));
console.log(logs.slice(0, 12).join("\n"));
ws.close();
