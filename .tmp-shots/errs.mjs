const port = 9222;
const url = process.argv[2];
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") logs.push(m.params.args.map(a => a.value ?? a.description ?? "").join(" "));
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text) + "\n" + (m.params.exceptionDetails.stackTrace?.callFrames || []).slice(0,6).map(f => f.functionName + ":" + f.lineNumber).join(" | "));
});
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 9000));
console.log(JSON.stringify(logs.slice(0, 10), null, 2));
ws.close();
