import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("simulator states its heuristic and simulation scope", () => {
  assert.match(html, /规则式启发式 · 随机离散时间仿真/);
  assert.match(html, /不是全局最优求解器/);
  assert.doesNotMatch(html, /ETA 最优/);
});

test("simulator exposes reproducible paired comparison", () => {
  assert.match(html, /id="seed"/);
  assert.match(html, /mulberry32/);
  assert.match(html, /expGap/);
  assert.match(html, /运行同样本 A\/B 对比/);
});

test("simulator exposes the single-elevator and group-control learning levels", () => {
  assert.match(html, /Level 1 · 单梯/);
  assert.match(html, /Level 2 · 群控/);
  assert.match(html, /P95 等待/);
  assert.match(html, /totalDistance/);
});

test("opposite-direction calls are released after an incompatible stop", () => {
  assert.match(html, /该车本次运行方向无法接走的乘客必须释放/);
  assert.match(html, /for\(const p of candidates\) p\.assigned = -1/);
});

test("daily demand emphasizes lobby-to-floor travel and displays destinations", () => {
  assert.match(html, /日常客流（80% 大厅往返）/);
  assert.match(html, /if\(r\(\) < 0\.8\)/);
  assert.match(html, /fillText\('→'\+p\.d\+'F'/);
  assert.match(html, /轿厢上方显示人数\/容量和目标楼层/);
});

test("simulator exposes a configurable hard elevator capacity", () => {
  assert.match(html, /id="capacity"/);
  assert.match(html, /P\.capacity = \+e\.target\.value/);
  assert.match(html, /if\(e\.riders\.length>=P\.capacity\) break/);
  assert.match(html, /e\.riders\.length\+'\/'\+P\.capacity\+' 人/);
});

test("inline simulator script parses", () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});
