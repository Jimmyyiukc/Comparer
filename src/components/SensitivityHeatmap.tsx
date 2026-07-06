import { useMemo, useState } from 'react';
import { FRANCE } from '../config/france';
import type { SimulationInputs } from '../engine/types';
import { sensitivityGrid, type HeatmapGrid } from '../engine/sensitivity';
import { fmtEURCompact, fmtEUR, fmtPct } from '../lib/format';
import { divergingColor, useMode } from '../lib/palette';

interface Props {
  inputs: SimulationInputs;
}

type Tab = 'appreciation' | 'investReturn';

const TAB_LABELS: Record<Tab, { title: string; axis: string }> = {
  appreciation: { title: 'Appréciation du bien', axis: 'Appréciation nominale, %/an' },
  investReturn: { title: 'Rendement des placements', axis: 'Rendement nominal net, %/an' },
};

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

interface HoverState {
  x: number;
  years: number;
  differential: number;
  clientX: number;
  clientY: number;
}

/** Heatmap de sensibilité : différentiel terminal (achat − location). */
export function SensitivityHeatmap({ inputs }: Props) {
  const mode = useMode();
  const [tab, setTab] = useState<Tab>('appreciation');
  const [hover, setHover] = useState<HoverState | null>(null);

  const yearValues = useMemo(() => range(FRANCE.holdingYearsMin.value, FRANCE.holdingYearsMax.value, 2), []);
  const xValues = useMemo(
    () =>
      tab === 'appreciation'
        ? range(FRANCE.appreciationMin.value * 100, FRANCE.appreciationMax.value * 100, 1)
        : range(1, 10, 1),
    [tab],
  );

  const grid: HeatmapGrid = useMemo(
    () =>
      sensitivityGrid(
        inputs,
        tab,
        xValues.map((v) => v / 100),
        yearValues,
      ),
    [inputs, tab, xValues, yearValues],
  );

  const maxAbs = useMemo(
    () => Math.max(1, ...grid.cells.map((c) => Math.abs(c.differential))),
    [grid],
  );

  const currentX = tab === 'appreciation' ? inputs.appreciation : inputs.investReturn;
  const nearestX = grid.xValues.reduce((a, b) => (Math.abs(b - currentX) < Math.abs(a - currentX) ? b : a));
  const nearestY = yearValues.reduce((a, b) =>
    Math.abs(b - inputs.holdingYears) < Math.abs(a - inputs.holdingYears) ? b : a,
  );

  const rentPole = divergingColor(-1, mode);
  const midColor = divergingColor(0, mode);
  const buyPole = divergingColor(1, mode);

  return (
    <section className="card">
      <h2>Sensibilité du verdict</h2>
      <p className="card-sub">
        Différentiel de patrimoine terminal (achat − location) selon la durée de détention et le paramètre choisi.
        La cellule encadrée est le scénario courant.
      </p>
      <div className="tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {TAB_LABELS[t].title}
          </button>
        ))}
      </div>
      <div
        className="heatmap"
        style={{ gridTemplateColumns: `auto repeat(${grid.xValues.length}, 1fr)` }}
        onMouseLeave={() => setHover(null)}
      >
        {yearValues.map((years) => (
          <YearRow
            key={years}
            years={years}
            grid={grid}
            maxAbs={maxAbs}
            mode={mode}
            nearestX={nearestX}
            nearestY={nearestY}
            onHover={setHover}
          />
        ))}
        <div className="hm-axis y" aria-hidden />
        {grid.xValues.map((x) => (
          <div key={x} className="hm-axis">
            {fmtPct(x, 0)}
          </div>
        ))}
      </div>
      <div className="hm-scale">
        <span>Location gagnante</span>
        <span
          className="hm-gradient"
          style={{ background: `linear-gradient(90deg, ${rentPole}, ${midColor}, ${buyPole})` }}
        />
        <span>Achat gagnant</span>
        <span style={{ marginLeft: 'auto' }}>
          Axe vertical : durée de détention · {TAB_LABELS[tab].axis}
        </span>
      </div>
      {hover && (
        <div className="hm-tooltip" style={{ left: hover.clientX, top: hover.clientY }}>
          <div className="viz-tooltip">
            <div className="tip-title">
              {fmtPct(hover.x, 0)} · {hover.years} ans
            </div>
            <div className="tip-row">
              {hover.differential >= 0 ? 'Achat' : 'Location'} gagnant de{' '}
              <span className="val">{fmtEUR(Math.abs(hover.differential))}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function YearRow({
  years,
  grid,
  maxAbs,
  mode,
  nearestX,
  nearestY,
  onHover,
}: {
  years: number;
  grid: HeatmapGrid;
  maxAbs: number;
  mode: 'light' | 'dark';
  nearestX: number;
  nearestY: number;
  onHover: (h: HoverState | null) => void;
}) {
  const cells = grid.cells.filter((c) => c.years === years);
  return (
    <>
      <div className="hm-axis y">{years} ans</div>
      {cells.map((cell) => {
        const isCurrent = cell.x === nearestX && years === nearestY;
        return (
          <div
            key={cell.x}
            className={`hm-cell${isCurrent ? ' current' : ''}`}
            style={{ background: divergingColor(cell.differential / maxAbs, mode) }}
            role="img"
            aria-label={`${fmtPct(cell.x, 0)}, ${years} ans : ${
              cell.differential >= 0 ? 'achat' : 'location'
            } gagnant de ${fmtEURCompact(Math.abs(cell.differential))}`}
            onMouseMove={(e) =>
              onHover({ x: cell.x, years, differential: cell.differential, clientX: e.clientX, clientY: e.clientY })
            }
          />
        );
      })}
    </>
  );
}
