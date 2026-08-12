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

test("simulator compares both goals over the same fixed experiment", () => {
  assert.match(html, /同样本策略对比/);
  assert.match(html, /固定 15 分钟/);
  assert.match(html, /id="btnCompare"/);
  assert.match(html, /function runFixedScenario/);
  assert.match(html, /相同随机种子开始/);
  assert.match(html, /P95 等待/);
  assert.match(html, /运行距离/);
});

test("simulator explains and exposes response and energy dispatch goals", () => {
  assert.match(html, /调度目标/);
  assert.match(html, /响应优先/);
  assert.match(html, /节能优先/);
  assert.match(html, /尽量合并顺路请求，并减少停靠与空载移动/);
  assert.match(html, /当前目标：/);
  assert.doesNotMatch(html, /协同 ETA.*需求驻停/);
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
