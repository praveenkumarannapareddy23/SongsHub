import fs from "node:fs";
const port = 9222;
const url = process.argv[2];
const width = Number(process.argv[3] || 390);
const height = Number(process.argv[4] || 844);
const out = process.argv[5];
const theme = process.argv[6] || null;

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id; pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
await new Promise((r) => ws.addEventListener("open", r));
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 8000));
await send("Runtime.evaluate", {
  expression: `(() => { [...document.querySelectorAll('button')].forEach(b => { if (/skip tour/i.test(b.textContent) || b.textContent.trim() === 'Skip') b.click(); }); return true; })()`,
});
await new Promise((r) => setTimeout(r, 700));
if (theme) {
  await send("Runtime.evaluate", { expression: `document.documentElement.setAttribute('data-theme', '${theme}')` });
  await new Promise((r) => setTimeout(r, 400));
}

const expr = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '), bg: cs.backgroundColor, font: cs.fontSize, lh: cs.lineHeight, opacity: cs.opacity, color: cs.color }; };
  const root = [...document.querySelectorAll('div')].find(el => typeof el.className === 'string' && el.className.includes('overflow-y-auto') && el.className.includes('bg-card') && el.className.includes('font-sans'));
  const ps = root ? [...root.querySelectorAll('p')] : [];
  const stanzaCol = root && root.querySelector('.space-y-8');
  const active = ps.find(p => p.className.includes('D4A32A'));
  return {
    viewport: { w: innerWidth, h: innerHeight },
    docScrollW: document.documentElement.scrollWidth,
    docScrollH: document.documentElement.scrollHeight,
    lyricsRoot: r(root),
    scroller: root && { clientW: root.clientWidth, scrollW: root.scrollWidth, clientH: root.clientHeight, scrollH: root.scrollHeight, scrollTop: root.scrollTop },
    mask: root ? getComputedStyle(root).maskImage : null,
    lineCount: ps.length,
    stanzaColGap: stanzaCol ? getComputedStyle(stanzaCol).rowGap : null,
    firstLines: ps.slice(0, 4).map(p => ({ t: p.textContent.slice(0, 28), t: +p.getBoundingClientRect().top.toFixed(1), font: getComputedStyle(p).fontSize, opacity: getComputedStyle(p).opacity })),
    active: active ? { t: active.textContent.slice(0, 28), font: getComputedStyle(active).fontSize, color: getComputedStyle(active).color, weight: getComputedStyle(active).fontWeight, transform: getComputedStyle(active.firstElementChild || active).transform } : null,
    badges: [...(root ? root.querySelectorAll('span') : [])].filter(s => /^x\d+$/.test(s.textContent.trim())).length,
    pills: [...(root ? root.querySelectorAll('span') : [])].filter(s => s.className.includes('D4A32A') && s.className.includes('rounded-full')).length,
    bodyBg: getComputedStyle(document.querySelector('main') || document.body).backgroundColor,
  };
})()`;
const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(res.result?.result?.value, null, 2));

const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("saved", out);
ws.close();
