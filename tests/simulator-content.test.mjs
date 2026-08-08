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

test("inline simulator script parses", () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});
