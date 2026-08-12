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
    document: { documentElement: {}, getElementById: element, querySelectorAll: () => [] },
    requestAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {},
  };
  const exposed = script.replace(
    /reset\(\);\s*syncLevelUI\(\);\s*syncExperimentDuration\(\);\s*applyLanguage\(\);\s*requestAnimationFrame\(loop\);/,
    "globalThis.__sim = { P, reset, reassign, stepElevator, advanceSimulation, getState: () => S };",
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

test("an empty car reverses at an intermediate floor to serve the waiting direction", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 1; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[0];
  elevator.y = 7; elevator.dir = 1; elevator.targets.add(7);
  const passenger = waitingPassenger(7, 1);
  state.passengers.push(passenger);

  sim.stepElevator(elevator, 0.1);

  assert.equal(passenger.state, "ride");
  assert.equal(elevator.dir, -1);
  assert.equal(elevator.riders.length, 1);
});

test("a loaded car does not reverse for an opposite-direction intermediate call", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 1; sim.P.park = false; sim.reset();
  const state = sim.getState();
  const elevator = state.elevators[0];
  elevator.y = 7; elevator.dir = 1;
  elevator.targets.add(7); elevator.targets.add(10);
  elevator.riders.push({ ...waitingPassenger(3, 10), state: "ride", elev: 0 });
  const passenger = waitingPassenger(7, 1);
  state.passengers.push(passenger);

  sim.stepElevator(elevator, 0.1);

  assert.equal(passenger.state, "wait");
  assert.equal(elevator.dir, 1);
  assert.equal(elevator.riders.length, 1);
  assert.equal(elevator.targets.has(10), true);
});

test("reassignment removes a resolved shared call instead of leaving a ghost stop", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 2; sim.P.park = false; sim.reset();
  const state = sim.getState();
  state.elevators[0].targets.add(7);

  sim.reassign();

  assert.equal(state.elevators[0].targets.has(7), false);
});

test("reassignment always preserves destinations for passengers already aboard", () => {
  const sim = loadSimulator();
  sim.P.floors = 14; sim.P.nElev = 2; sim.P.park = false; sim.reset();
  const state = sim.getState();
  state.elevators[0].riders.push({ ...waitingPassenger(3, 11), state: "ride", elev: 0 });

  sim.reassign();

  assert.equal(state.elevators[0].targets.has(11), true);
});

test("the same fixed number of simulation steps is independent of playback speed", () => {
  const run = (speed) => {
    const sim = loadSimulator();
    sim.P.floors = 14; sim.P.nElev = 3; sim.P.ratePerMin = 8; sim.P.speed = speed; sim.P.park = true; sim.reset();
    for(let i=0;i<1200;i++) sim.advanceSimulation(0.1);
    const state = sim.getState();
    return JSON.stringify({
      time: state.t,
      passengers: state.passengers.map(p => [p.o,p.d,p.state,p.elev]),
      elevators: state.elevators.map(e => [e.y,e.dir,e.state,e.riders.length,[...e.targets]]),
      waits: [...state.servedWaits],
    });
  };

  assert.deepEqual(run(1), run(16));
});
