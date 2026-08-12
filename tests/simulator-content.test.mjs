import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];

function loadUiDefinitions(){
  const canvasContext = new Proxy({}, { get: () => () => {} });
  const elements = new Map();
  const element = (id) => {
    if(!elements.has(id)) elements.set(id, {
      id, style: { setProperty() {} }, children: [], value: "", hidden: false,
      selectedOptions: [{ text: "" }], classList: { toggle() {}, contains() { return false; } },
      setAttribute() {}, addEventListener() {}, getContext: () => canvasContext,
      getBoundingClientRect: () => ({ width: 1000, height: 800 }),
    });
    return elements.get(id);
  };
  const context = {
    console, Math, Map, Set, Proxy,
    window: { addEventListener() {}, devicePixelRatio: 1 },
    document: { documentElement: {}, getElementById: element, querySelectorAll: () => [] },
    requestAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {},
  };
  const exposed = script.replace(
    /reset\(\);\s*syncLevelUI\(\);\s*syncExperimentDuration\(\);\s*applyLanguage\(\);\s*requestAnimationFrame\(loop\);/,
    "globalThis.__ui = { translations, P, canvasLayout, elevX, setViewport:(w,h)=>{ W=w; H=h; P.floorH=Math.min(62,(H-P.topPad-visualLobbyPad())/(P.floors-1)); } };",
  );
  vm.runInNewContext(exposed, context);
  return context.__ui;
}

test("simulator leads with a concise, plain-language purpose", () => {
  assert.match(html, /<title>Elevator<\/title>/);
  assert.match(html, /id="brandTitle">电梯实时仿真/);
  assert.match(html, /这里正在发生什么？/);
  assert.match(html, /乘客不断到达各楼层/);
  assert.doesNotMatch(html, /ETA 最优/);
});

test("simulator exposes the intended focused controls", () => {
  assert.match(html, /id="elevSeg"[\s\S]*data-n="1"[\s\S]*data-n="6"/);
  assert.match(html, /id="floorSeg"[\s\S]*data-n="8"[\s\S]*data-n="16"[\s\S]*data-n="20"/);
  assert.match(html, /id="pattern"/);
  assert.match(html, /id="capacity"/);
  assert.match(html, /id="btnPause"/);
  assert.doesNotMatch(html, /id="seed"/);
});

test("strategy labels describe what the implementation actually measures", () => {
  assert.match(html, /响应优先/);
  assert.match(html, /少停靠优先/);
  assert.match(html, /不是能耗模型/);
  assert.doesNotMatch(html, />节能优先</);
  assert.doesNotMatch(html, /Energy first/);
});

test("same-sample experiment reports waits, unfinished queue, service, and movement", () => {
  assert.match(html, /策略实验/);
  assert.match(html, /两次使用完全相同的乘客样本/);
  assert.match(html, /id="btnCompare"/);
  assert.match(html, /id="btnExport"/);
  assert.match(html, /id="cmpTripResponse"/);
  assert.match(html, /id="cmpQueueResponse"/);
  assert.match(html, /等待指标只统计在实验时限内已上梯的乘客/);
  assert.match(html, /function startExperiment/);
  assert.match(html, /function finishExperiment/);
});

test("model view is beginner-first while preserving inspectable formulas", () => {
  assert.match(html, /可以把它理解成四步/);
  assert.match(html, /<details class="calculation">/);
  assert.match(html, /查看计算规则/);
  assert.match(html, /B_e\(f\)=\\hat T_e\(f\)\+3I_\{opp\}\+30I_\{full\}/);
  assert.match(html, /C_\{fewer\}/);
  assert.match(html, /application\/x-tex/);
  assert.match(html, /不是全局优化器/);
});

test("desktop and narrow layouts use distinct, readable structures", () => {
  assert.match(html, /#app \{ display:flex; height:100dvh; \}/);
  assert.match(html, /#panel \{[^}]*overflow-y:auto/);
  assert.match(html, /@media \(max-width:900px\)[\s\S]*#panel \{ display:contents; \}/);
  assert.match(html, /@media \(max-width:520px\)[\s\S]*min-height:42px/);
  assert.match(html, /\.row > select,\.row > \.seg,\.row > input\[type=range\] \{ width:100%/);
});

test("compact canvas keeps all six cars inside the reserved shaft area", () => {
  const ui = loadUiDefinitions();
  ui.P.nElev = 6; ui.P.floors = 20;
  for(const [width,height] of [[320,340],[390,360],[520,420],[620,480]]){
    ui.setViewport(width,height);
    const layout = ui.canvasLayout();
    const lastCarRight = ui.elevX(5, layout) + layout.cw;
    assert.equal(layout.compact, true);
    assert.ok(lastCarRight <= width-layout.queueReserve+1, `cars overflow at ${width}px`);
    assert.ok(layout.ch <= ui.P.floorH*.72+0.01, `cars overlap floors at ${width}px`);
  }
  for(const [width,height] of [[768,580],[1024,720]]){
    ui.setViewport(width,height);
    const layout = ui.canvasLayout();
    const lastCarRight = ui.elevX(5, layout) + layout.cw;
    assert.equal(layout.compact, false);
    assert.ok(lastCarRight <= width-layout.queueReserve+1, `cars overflow at ${width}px`);
  }
});

test("all visible bilingual keys exist and English values contain no Chinese", () => {
  const ui = loadUiDefinitions();
  const keys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(match=>match[1]));
  for(const key of keys){
    assert.equal(typeof ui.translations.zh[key], "string", `missing Chinese translation: ${key}`);
    assert.equal(typeof ui.translations.en[key], "string", `missing English translation: ${key}`);
  }
  for(const [key,value] of Object.entries(ui.translations.en)){
    assert.doesNotMatch(value, /[\u3400-\u9fff]/, `Chinese leaked into English translation: ${key}`);
  }
  assert.deepEqual(Object.keys(ui.translations.zh).sort(), Object.keys(ui.translations.en).sort());
});

test("simulation uses a fixed integration step independent of playback speed", () => {
  assert.match(html, /const FIXED_DT = 0\.1/);
  assert.match(html, /while\(simAccumulator\+1e-9 >= FIXED_DT/);
  const advanceBody = html.match(/function advanceSimulation\(dt\)\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.doesNotMatch(advanceBody, /P\.speed/);
});

test("shared calls are rebuilt on reassignment instead of accumulating ghost stops", () => {
  assert.match(html, /e\.targets = new Set\(e\.riders\.map\(p=>p\.d\)\)/);
  assert.match(html, /p\.state==='wait' && p\.o===floor/);
  assert.doesNotMatch(html, /p\.o===floor && p\.assigned===e\.id/);
});

test("daily demand, destinations, and capacity remain explicit", () => {
  assert.match(html, /日常客流（80% 大厅往返）/);
  assert.match(html, /if\(r\(\) < 0\.8\)/);
  assert.match(html, /ctx\.fillText\('→'\+p\.d\+'F'/);
  assert.match(html, /if\(e\.riders\.length>=P\.capacity\) break/);
  assert.match(html, /标准 · 8 人 \/ 630kg/);
  assert.match(html, /function carWidth\(\)/);
});

test("interactive controls include keyboard focus and live status semantics", () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /role="img" aria-label=/);
  assert.match(html, /aria-pressed/);
});

test("inline simulator script parses", () => {
  assert.doesNotThrow(() => new Function(script));
});
