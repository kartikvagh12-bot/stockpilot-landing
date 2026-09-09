"use client";

import { useState } from "react";
import {
  ActivityFeed,
  DemoButton,
  DemoPanel,
  ResetButton,
  StatRow,
  inr,
  useActivity,
  useAnimatedNumber,
} from "./demo-ui";

// One relationship, shown by moving one input: when a material costs more, the
// unit costs more to make, and the margin on the same selling price narrows.
//
// Gross margin only. Not net profit, not a price recommendation, not a
// forecast, and no variance analysis.

const START_MATERIAL = 120;
const MATERIAL_PER_UNIT = 2; // illustrative recipe quantity
const OTHER_COSTS = 220; // labour, overhead and packing, held flat here
const PRICE = 600;
const STEP = 10;

const makeCost = (material: number) => material * MATERIAL_PER_UNIT + OTHER_COSTS;

export default function CostingDemo() {
  const [material, setMaterial] = useState(START_MATERIAL);
  const { items, push, clear } = useActivity();

  const cost = makeCost(material);
  const margin = PRICE - cost;
  const marginPct = (margin / PRICE) * 100;

  const aMaterial = useAnimatedNumber(material);
  const aCost = useAnimatedNumber(cost);
  const aMargin = useAnimatedNumber(margin);

  function bump(delta: number) {
    const next = Math.max(0, material + delta);
    setMaterial(next);
    push(
      `Material cost ${delta > 0 ? "rose" : "fell"} to ${inr(next)}. Cost to make is now ${inr(makeCost(next))}.`,
      delta > 0 ? "accent" : "good",
    );
  }

  function reset() {
    setMaterial(START_MATERIAL);
    clear();
  }

  return (
    <DemoPanel
      title="Cost to make"
      subtitle={`${MATERIAL_PER_UNIT} units of material per unit, plus ${inr(OTHER_COSTS)} labour, overhead and packing`}
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
          <StatRow label="Material cost" value={inr(aMaterial)} hint="Per unit of material" />
          <StatRow label="Cost to make" value={inr(aCost)} hint="Rolled up through the recipe" />
          <StatRow label="Selling price" value={inr(PRICE)} tone="muted" />
          <StatRow
            label="Gross margin"
            value={inr(aMargin)}
            hint={`${marginPct.toFixed(1)}% of the selling price`}
            tone={margin > 0 ? "good" : "accent"}
          />

          <div className="mt-6 flex flex-wrap gap-2">
            <DemoButton onClick={() => bump(STEP)} variant="accent">
              Material cost +{inr(STEP)}
            </DemoButton>
            <DemoButton
              onClick={() => bump(-STEP)}
              disabled={material - STEP < 0}
            >
              Material cost -{inr(STEP)}
            </DemoButton>
          </div>
          {margin <= 0 && (
            <p className="mt-3 text-xs leading-5 text-brand-300">
              At this material cost the unit sells at or below what it costs to
              make.
            </p>
          )}
        </div>

        <ActivityFeed items={items} empty="Move the material cost to see the margin follow." />
      </div>
    </DemoPanel>
  );
}
