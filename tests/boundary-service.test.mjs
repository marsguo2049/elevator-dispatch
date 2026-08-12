import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];

function loadSimulator(){
  const canvasContext = new Proxy({}, { get: () => () => {} });
  const elements = new Map();
  const element = (id) => {
    if(!elements.has(id)) elements.set(id, {
      id, style: {}, children: [], value: "", selectedOptions: [{ text: "" }],
      classList: { toggle() {} }, setAttribute() {}, addEventListener() {},
      getContext: () => canvasContext,
      getBoundingClientRect: () => ({ width: 1000, height: 800 }),
    });
    return elements.get(id);
  };
  const context = {
    console, Math, Map, Set, Proxy,
    window: { addEventListener() {} },
    document: { getElementById: element, querySelectorAll: () => [] },
    requestAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {},
  };
  const exposed = script.replace(
    /reset\(\);\s*syncLevelUI\(\);\s*requestAnimationFrame\(loop\);/,
    "globalThis.__sim = { P, reset, stepElevator, getState: () => S };",
  );
  vm.runInNewContext(exposed, context);
  return context.__sim;
}

function waitingPassenger(origin, destination, assigned = 0){
  return { pid: 1, o: origin, d: destination, t0: 0, state: "wait", elev: -1, assigned, tBoard: 0, tDone: 0 };
}

test("an elevator arriving downward at the lobby immediately boards upward passengers", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 1; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[0];
  elevator.y = 1; elevator.dir = -1; elevator.targets.add(1);
  const passenger = waitingPassenger(1, 9);
  state.passengers.push(passenger);

  sim.stepElevator(elevator, 0.1);

  assert.equal(passenger.state, "ride");
  assert.equal(elevator.dir, 1);
  assert.equal(elevator.riders.length, 1);
});

test("an elevator arriving upward at the top floor immediately boards downward passengers", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 1; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[0];
  elevator.y = 14; elevator.dir = 1; elevator.targets.add(14);
  const passenger = waitingPassenger(14, 3);
  state.passengers.push(passenger);

  sim.stepElevator(elevator, 0.1);

  assert.equal(passenger.state, "ride");
  assert.equal(elevator.dir, -1);
  assert.equal(elevator.riders.length, 1);
});

test("a full elevator never boards beyond its configured capacity", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 1; sim.P.capacity = 2; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[0];
  elevator.y = 1; elevator.dir = -1; elevator.targets.add(1);
  elevator.riders.push({ ...waitingPassenger(5, 8), state: "ride" });
  state.passengers.push(waitingPassenger(1, 6), waitingPassenger(1, 9));

  sim.stepElevator(elevator, 0.1);

  assert.equal(elevator.riders.length, 2);
  assert.equal(state.passengers.filter(p => p.state === "ride").length, 1);
  assert.equal(state.passengers.filter(p => p.state === "wait").length, 1);
});

test("a car can board an eligible passenger even when a different car planned the call", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 2; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[1];
  elevator.y = 1; elevator.dir = -1; elevator.targets.add(1);
  const passenger = waitingPassenger(1, 8, 0);
  state.passengers.push(passenger);

  sim.stepElevator(elevator, 0.1);

  assert.equal(passenger.state, "ride");
  assert.equal(passenger.elev, 1);
});
