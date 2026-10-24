import fs from "node:fs";
const port = 9222;
const url = process.argv[2] + '?view=lyrics';
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const out = process.argv[5];
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const errs = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push(m.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 200));
});
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 12000));
await send("Runtime.evaluate", { expression: `(() => { [...document.querySelectorAll('button')].forEach(b => { if (/skip tour/i.test(b.textContent) || b.textContent.trim() === 'Skip') b.click(); }); return true; })()` });
await new Promise((r) => setTimeout(r, 800));

const measure = `(() => {
  const root = [...document.querySelectorAll('div')].find(el => typeof el.className === 'string' && el.className.includes('font-sans') && el.className.includes('overflow-y-auto') && el.className.includes('bg-card'));
  const ps = root ? [...root.querySelectorAll('p')] : [];
  const act = ps.find(p => p.className.includes('D4A32A'));
  const r = root ? root.getBoundingClientRect() : null;
  return {
    lines: ps.length,
    activeIndex: ps.indexOf(act),
    activeFont: act ? getComputedStyle(act).fontSize : null,
    activeTransform: act && act.firstElementChild ? getComputedStyle(act.firstElementChild).transform : null,
    inactiveOpacity: ps[0] ? getComputedStyle(ps[0]).opacity : null,
    root: r && { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height },
    scroller: root && { clientW: root.clientWidth, scrollW: root.scrollWidth, clientH: root.clientHeight, scrollH: root.scrollHeight },
    lineSpacing: ps.length > 2 ? +(ps[1].getBoundingClientRect().top - ps[0].getBoundingClientRect().top).toFixed(1) : null,
    stanzaGaps: (() => { const st = root ? [...root.querySelectorAll('div')].filter(d => d.className === '' && d.querySelectorAll(':scope > div > p').length) : []; return null; })(),
    docScroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    badges: root ? [...root.querySelectorAll('span')].filter(s => /^x\d+$/i.test(s.textContent.trim())).length : 0,
    pills: root ? [...root.querySelectorAll('span')].filter(s => s.className.includes && s.className.includes('rounded-full') && s.className.includes('D4A32A')).length : 0,
    mask: root ? getComputedStyle(root).maskImage : null,
  };
})()`;
const before = await send("Runtime.evaluate", { expression: measure, returnByValue: true });
console.log("BEFORE", JSON.stringify(before.result.result.value, null, 2));

const click = await send("Runtime.evaluate", { expression: `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'English'); if (b) b.click(); return !!b; })()`, returnByValue: true });
await new Promise((r) => setTimeout(r, 1500));
const after = await send("Runtime.evaluate", { expression: `(() => { const root = [...document.querySelectorAll('div')].find(el => typeof el.className === 'string' && el.className.includes('font-sans') && el.className.includes('overflow-y-auto') && el.className.includes('bg-card')); const p = root && root.querySelector('p'); return { clicked: ${JSON.stringify(true)}, first: p ? p.textContent.slice(0, 40) : null, active: root ? [...root.querySelectorAll('p')].filter(x => x.className.includes('D4A32A')).length : 0 }; })()`, returnByValue: true });
console.log("AFTER LANGUAGE CLICK", JSON.stringify(after.result.result.value));
console.log("ERRORS", JSON.stringify(errs.slice(0, 5)));

const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("saved", out);
ws.close();
