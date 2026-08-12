# Elevator

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)](LICENSE.md)

[在线体验 / Live demo](https://marsguo2049.github.io/elevator-dispatch/)

## 中文

一个面向普通用户、运筹学入门和教学展示的多电梯调度仿真。乘客会在不同楼层出现，调度规则持续决定哪台电梯响应呼叫；你可以观察等待、拥堵、停靠与运行距离怎样随设置和规则变化。

项目属于 City2049 的 Vertical Mobility 模块，但当前实现只模拟基础办公楼电梯。它是**规则式调度启发式 + 随机离散时间仿真**，不是数学规划求解器，不证明全局最优，也不能用于真实楼宇控制或安全认证。

### 怎样使用

1. 选择 1–6 台电梯、8/16/20 层、客流模式、轿厢规格和乘客到达率。
2. 在实时画布中观察电梯、候梯乘客、轿厢乘客和等待指标。
3. 先运行一种调度规则，再切换另一种规则重新运行。两次实验从相同随机种子和相同乘客序列开始，结果并排显示。

界面提供完整中英文切换，并针对手机、平板、笔记本和宽屏布局调整。窄屏会把同层乘客合并显示为上行/下行人数和最长已等待时间，避免 6 台电梯时画布横向溢出。

### 两种调度规则

| 规则 | 主要倾向 | 代价 |
| --- | --- | --- |
| 响应优先 | 更积极响应新呼叫，优先缩短乘客等待 | 可能增加停靠和空载移动 |
| 少停靠优先 | 奖励顺路合乘，减少新增停靠和空载移动 | 部分乘客可能等待更久 |

“少停靠优先”只使用停靠与运行距离作为效率代理，**不是实际能耗模型**。

### 仿真方法

- 乘客到达间隔服从指数分布，对应泊松到达过程；
- 日常客流中 80% 为大厅与办公楼层之间的出行；另含早高峰、晚高峰和午间双向模式；
- 同一楼层、同一方向的乘客组成共享呼叫组；
- 派梯成本考虑预计路线距离、计划停靠、当前载客、反向行驶、满载惩罚和等待时长；
- 轿厢按 LOOK 式方向扫描服务任务，容量是硬约束；
- 空闲电梯使用近期呼叫热度和客流先验选择驻停楼层；
- 核心仿真采用 0.1 秒固定步长，因此播放倍速只改变观看速度，不改变实验积分步长。

### 指标口径

| 指标 | 口径 |
| --- | --- |
| 候梯人数 | 当前仍未上梯的人数 |
| 已上梯者平均等待 | 已经上梯的乘客从到达到上梯的平均时间 |
| 最长已观察等待 | 已上梯等待时间与当前候梯已等待时间中的最大值 |
| P95 等待 | 95% 的已上梯乘客等待不超过该值 |
| 平均全程时间 | 已完成乘客从到达到抵达目的层的平均时间 |
| 结束时仍在候梯 | 实验时限结束时尚未上梯的人数 |
| 运行距离 / 停靠次数 | 所有电梯累计移动楼层数 / 实际上下客停靠数 |

等待均值和 P95 只统计实验时限内已经上梯的乘客，因此比较时必须同时查看“结束时仍在候梯”，避免未完成队列造成选择偏差。

### 运行与检查

项目没有运行时依赖，可直接打开 `index.html`。也可以使用内置的零依赖预览服务器；测试需要 Node.js 18 或更高版本：

```bash
npm run dev
npm test
```

### 已知边界

- 停靠任务使用集合而不是完整的带时刻路线序列，ETA 是规则近似；
- 未建模加速度曲线、门区安全、故障、消防模式、目的层控制和真实能耗；
- 固定时限实验会留下未完成队列，页面已单独报告该队列，但不会推断这些乘客最终等待时间；
- 单个随机样本不能证明某种规则普遍更好，严谨实验应扩展为多随机种子与置信区间。

## English

Elevator is a browser-based multi-car dispatch simulation for general audiences, introductory operations research, and teaching. Passengers arrive on different floors while a rule continuously decides which car should respond. The live view makes waiting, congestion, stops, and travel visible.

The project is a **rule-based dispatch heuristic with a stochastic discrete-time simulation**. It is not a mathematical optimizer, does not prove global optimality, and is not an engineering controller for real buildings.

Users can configure 1–6 cars, 8/16/20 floors, traffic patterns, car capacity, and arrival rate. Two rules are available:

- **Response first** answers new calls more aggressively to reduce waiting.
- **Fewer stops** rewards on-route sharing and reduces new stops and empty travel. It is not a physical energy model.

Strategy experiments use the same random seed and passenger sequence. Wait statistics cover passengers who boarded within the experiment window, so results must be read together with **Still waiting at end**. The simulator uses a fixed 0.1-second integration step, making playback speed a viewing control only.

The interface is fully bilingual and responsive across phones, tablets, laptops, and wide screens. On narrow screens, floor calls are aggregated into upward/downward counts and the longest observed wait so all six cars remain visible.

## License

This project uses the [PolyForm Noncommercial License 1.0.0](LICENSE.md). Noncommercial learning, teaching, research, experimentation, modification, and redistribution are permitted. Commercial use requires separate written permission from the copyright holder.
