import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("simulator leads with a concise City2049 purpose", () => {
  assert.match(html, /CITY2049 · VERTICAL MOBILITY/);
  assert.match(html, /实时观察多台电梯如何响应楼层呼叫/);
  assert.doesNotMatch(html, /ETA 最优/);
});

test("simulator keeps a focused set of live controls", () => {
  assert.match(html, /id="elevSeg"/);
  assert.match(html, /id="floorSeg"/);
  assert.match(html, /id="pattern"/);
  assert.match(html, /id="capacity"/);
  assert.match(html, /id="btnPause"/);
  assert.doesNotMatch(html, /id="seed"/);
});

test("simulator runs a visible, configurable strategy experiment", () => {
  assert.match(html, /策略实验/);
  assert.match(html, /5 分钟 · 快速/);
  assert.match(html, /10 分钟 · 推荐/);
  assert.match(html, /自定义时长/);
  assert.match(html, /id="btnCompare"/);
  assert.match(html, /id="btnExport"/);
  assert.match(html, /function startExperiment/);
  assert.match(html, /function finishExperiment/);
  assert.match(html, /实验进行中/);
  assert.match(html, /95% 等待阈值（P95）/);
  assert.match(html, /运行距离/);
});

test("simulator explains and exposes response and energy dispatch goals", () => {
  assert.match(html, /调度目标/);
  assert.match(html, /响应优先/);
  assert.match(html, /节能优先/);
  assert.match(html, /尽量合并顺路请求，并减少停靠与空载移动/);
  assert.match(html, /快速响应/);
  assert.doesNotMatch(html, /协同 ETA.*需求驻停/);
});

test("simulator provides a non-blocking model view", () => {
  assert.match(html, /模型与算法/);
  assert.match(html, /id="modelView"/);
  assert.match(html, /切换到此处不会暂停或重置/);
  assert.match(html, /application\/x-tex/);
  assert.match(html, /\\arg\\min/);
  assert.match(html, /Δt：下一位乘客的到达间隔/);
  assert.match(html, /id="viewTabs"/);
});

test("desktop sidebar remains independently scrollable within one viewport", () => {
  assert.match(html, /#app \{ display:flex; height:100dvh; \}/);
  assert.match(html, /#panel \{ width:380px;[^}]*overflow-y:auto/);
  assert.match(html, /@media \(max-width:760px\)[\s\S]*#app \{ height:auto; min-height:100dvh/);
});

test("simulator presents core live metrics as a dashboard", () => {
  assert.match(html, /运行仪表盘/);
  assert.match(html, /id="gWaiting"/);
  assert.match(html, /id="gWait"/);
  assert.match(html, /id="gDone"/);
  assert.match(html, /style\.setProperty\('--p'/);
});

test("lobby calls remain shared rather than locking each passenger to one car", () => {
  assert.match(html, /现实中的大厅呼叫是共享的/);
  assert.match(html, /p\.state==='wait' && p\.o===floor/);
  assert.doesNotMatch(html, /p\.o===floor && p\.assigned===e\.id/);
});

test("daily demand emphasizes lobby-to-floor travel and displays destinations", () => {
  assert.match(html, /日常客流（80% 大厅往返）/);
  assert.match(html, /if\(r\(\) < 0\.8\)/);
  assert.match(html, /fillText\('→'\+p\.d\+'F'/);
  assert.match(html, /e\.riders\.length\+'\/'\+P\.capacity\+' 人/);
});

test("simulator exposes a configurable hard elevator capacity", () => {
  assert.match(html, /id="capacity"/);
  assert.match(html, /P\.capacity = \+e\.target\.value/);
  assert.match(html, /if\(e\.riders\.length>=P\.capacity\) break/);
  assert.match(html, /e\.riders\.length\+'\/'\+P\.capacity\+' 人/);
  assert.match(html, /标准 · 8 人 \/ 630kg/);
  assert.match(html, /function carWidth\(\)/);
});

test("inline simulator script parses", () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});
