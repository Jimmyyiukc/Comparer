import { useMemo } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '../engine/types';
import { fmtEUR, fmtEURCompact, fmtDurationMonths } from '../lib/format';
import { PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
  deflate: (value: number, month: number) => number;
}

interface Datum {
  years: number;
  month: number;
  buy: number;
  rent: number;
  band: [number, number];
}

function HeroTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
  colors: { buy: string; rent: string };
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = d.buy - d.rent;
  return (
    <div className="viz-tooltip">
      <div className="tip-title">{fmtDurationMonths(d.month)}</div>
      <div className="tip-row">
        <span className="swatch" style={{ background: colors.buy }} />
        Achat <span className="val">{fmtEUR(d.buy)}</span>
      </div>
      <div className="tip-row">
        <span className="swatch" style={{ background: colors.rent }} />
        Location <span className="val">{fmtEUR(d.rent)}</span>
      </div>
      <div className="tip-row">
        <span className="swatch" style={{ background: 'transparent' }} />
        Écart{' '}
        <span className="val">
          {diff >= 0 ? '+' : ''}
          {fmtEUR(diff)}
        </span>
      </div>
    </div>
  );
}

/** Graphique héros : patrimoine net des deux chemins, mois par mois. */
export function HeroChart({ result, deflate }: Props) {
  const mode = useMode();
  const colors = PATH_COLORS[mode];
  const cssVar = (name: string) => `var(${name})`;

  const data: Datum[] = useMemo(
    () =>
      result.points.map((p) => {
        const buy = deflate(p.buyWealth, p.month);
        const rent = deflate(p.rentWealth, p.month);
        return {
          years: p.month / 12,
          month: p.month,
          buy,
          rent,
          band: [Math.min(buy, rent), Math.max(buy, rent)] as [number, number],
        };
      }),
    [result, deflate],
  );

  const breakeven = result.summary.breakevenMonth;
  const horizonYears = result.inputs.holdingYears;
  const yearTicks = useMemo(() => {
    const step = horizonYears > 20 ? 5 : horizonYears > 10 ? 2 : 1;
    const ticks: number[] = [];
    for (let y = 0; y <= horizonYears; y += step) ticks.push(y);
    return ticks;
  }, [horizonYears]);

  // Étiquette directe en bout de ligne (en plus de la légende).
  const endLabel =
    (text: string, color: string) =>
    ({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) => {
      if (index !== data.length - 1 || x === undefined || y === undefined) return <g />;
      return (
        <text x={Number(x) - 4} y={Number(y) - 8} textAnchor="end" fill={color} fontSize={12} fontWeight={650}>
          {text}
        </text>
      );
    };

  return (
    <section className="card">
      <h2>Patrimoine net dans le temps</h2>
      <p className="card-sub">
        Valeur nette de chaque chemin si l'on soldait tout ce mois-là : revente du bien (frais, capital restant dû,
        IRA) côté achat, portefeuille net d'impôt côté location.
      </p>
      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
            <XAxis
              dataKey="years"
              type="number"
              domain={[0, horizonYears]}
              ticks={yearTicks}
              tickFormatter={(y: number) => `${y} an${y > 1 ? 's' : ''}`}
              stroke={cssVar('--baseline')}
              tick={{ fill: cssVar('--ink-3'), fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtEURCompact}
              stroke="transparent"
              tick={{ fill: cssVar('--ink-3'), fontSize: 12 }}
              tickLine={false}
              width={62}
            />
            <Tooltip content={<HeroTooltip colors={colors} />} isAnimationActive={false} />
            <Area
              dataKey="band"
              stroke="none"
              fill={cssVar('--ink-3')}
              fillOpacity={0.12}
              isAnimationActive={false}
              activeDot={false}
              name="Écart"
              legendType="none"
              tooltipType="none"
            />
            <Line
              dataKey="buy"
              name="Achat"
              stroke={colors.buy}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              label={endLabel('Achat', colors.buy)}
            />
            <Line
              dataKey="rent"
              name="Location"
              stroke={colors.rent}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              label={endLabel('Location', colors.rent)}
            />
            {breakeven !== null && (
              <ReferenceLine
                x={breakeven / 12}
                stroke={cssVar('--ink-2')}
                strokeDasharray="4 4"
                label={{
                  value: `Croisement : ${fmtDurationMonths(breakeven)}`,
                  position: 'insideTopLeft',
                  fill: cssVar('--ink-2'),
                  fontSize: 12,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-row">
        <span className="legend-item">
          <span className="swatch" style={{ background: colors.buy }} /> Achat (revente nette)
        </span>
        <span className="legend-item">
          <span className="swatch" style={{ background: colors.rent }} /> Location (portefeuille net)
        </span>
        {breakeven === null && (
          <span className="legend-item">
            Pas de croisement sur {horizonYears} ans : la location reste devant sur tout l'horizon.
          </span>
        )}
      </div>
    </section>
  );
}
