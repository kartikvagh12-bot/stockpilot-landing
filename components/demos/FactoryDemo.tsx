"use client";

import { useState } from "react";
import {
  ActivityFeed,
  DemoButton,
  DemoPanel,
  ResetButton,
  StatRow,
  useActivity,
  useAnimatedNumber,
} from "./demo-ui";

// Material in, units made, units out. Three clicks, three visible results.
//
// The recipe below is invented for the website. It is small on purpose: the
// point is that recording the work moves the numbers, not that this reproduces
// Operza's costing or availability engine.
//
// Deliberately absent, because Operza does not do them: purchase suggestions,
// supplier recommendations, reorder timing, scheduling, machine or operator
// assignment, stock reservation, batch and lot tracking.

const START = { steel: 48, fasteners: 30, finished: 8 };
const RECIPE = { steel: 4, fasteners: 2 }; // per unit of Bracket assembly
const RUN_SIZE = 5;
const RECEIVE_QTY = 20;
const DISPATCH_QTY = 3;

export default function FactoryDemo() {
  const [s, setS] = useState(START);
  const { items, push, clear } = useActivity();

  const steel = useAnimatedNumber(s.steel);
  const fasteners = useAnimatedNumber(s.fasteners);
  const finished = useAnimatedNumber(s.finished);

  const canRun =
    s.steel >= RECIPE.steel * RUN_SIZE && s.fasteners >= RECIPE.fasteners * RUN_SIZE;
  const canDispatch = s.finished >= DISPATCH_QTY;

  function receive() {
    setS((p) => ({ ...p, steel: p.steel + RECEIVE_QTY }));
    push(`Received ${RECEIVE_QTY} Steel sheet`, "good");
  }

  function run() {
    if (!canRun) {
      push("Not enough material for this run. Nothing was deducted.", "accent");
      return;
    }
    setS((p) => ({
      steel: p.steel - RECIPE.steel * RUN_SIZE,
      fasteners: p.fasteners - RECIPE.fasteners * RUN_SIZE,
      finished: p.finished + RUN_SIZE,
    }));
    push(
      `Ran ${RUN_SIZE} units. Materials deducted, ${RUN_SIZE} finished units added.`,
      "good",
    );
  }

  function dispatch() {
    if (!canDispatch) return;
    setS((p) => ({ ...p, finished: p.finished - DISPATCH_QTY }));
    push(`Dispatched ${DISPATCH_QTY} units`, "good");
  }

  function reset() {
    setS(START);
    clear();
  }

  return (
    <DemoPanel
      title="Bracket assembly"
      subtitle={`Recipe: ${RECIPE.steel} steel sheet and ${RECIPE.fasteners} fastener kits per unit`}
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            Illustrative values, not a live workspace.
          </p>
          <ResetButton onClick={reset} />
        </div>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Materials
          </p>
          <div className="mt-1">
            <StatRow label="Steel sheet" value={Math.round(steel).toString()} unit="pcs" />
            <StatRow
              label="Fastener kit"
              value={Math.round(fasteners).toString()}
              unit="pcs"
            />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Finished goods
          </p>
          <div className="mt-1">
            <StatRow
              label="Bracket assembly"
              value={Math.round(finished).toString()}
              unit="units"
              tone="accent"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <DemoButton onClick={receive}>Receive {RECEIVE_QTY}</DemoButton>
            <DemoButton onClick={run} variant="accent" disabled={!canRun}>
              Run {RUN_SIZE} units
            </DemoButton>
            <DemoButton onClick={dispatch} disabled={!canDispatch}>
              Dispatch {DISPATCH_QTY}
            </DemoButton>
          </div>
          {!canRun && (
            <p className="mt-3 text-xs leading-5 text-brand-300">
              Not enough material for a {RUN_SIZE} unit run. Receive more first.
              In Operza a short run is refused before anything is deducted.
            </p>
          )}
        </div>

        <ActivityFeed items={items} />
      </div>
    </DemoPanel>
  );
}
