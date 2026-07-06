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
import type { Copy, Lang } from '../i18n';
import { formatDurationMonths } from '../i18n';
import { fmtEUR, fmtEURCompact } from '../lib/format';
import { PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
  deflate: (value: number, month: number) => number;
  t: Copy['chart'];
  lang: Lang;
}

interface Datum {
  years: number;
  month: number;
  buyPaper: number;
  buyNet: number;
  rent: number;
  band: [number, number];
}

function HeroTooltip({
  active,
  payload,
  colors,
  t,
  lang,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
  colors: { buy: string; rent: string };
  t: Copy['chart'];
  lang: Lang;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = d.buyNet - d.rent;
  return (
    <div className="viz-tooltip">
      <div className="tip-title">{formatDurationMonths(d.month, lang)}</div>
      <div className="tip-row">
        <span className="swatch" style={{ background: colors.buy }} />
        {t.buyPaper} <span className="val">{fmtEUR(d.buyPaper)}</span>
      </div>
      <div className="tip-row">
        <span className="swatch" style={{ background: colors.buy, opacity: 0.5 }} />
        {t.buyNet} <span className="val">{fmtEUR(d.buyNet)}</span>
      </div>
      <div className="tip-row">
        <span className="swatch" style={{ background: colors.rent }} />
        {t.rentNet} <span className="val">{fmtEUR(d.rent)}</span>
      </div>
      <div className="tip-row">
        <span className="swatch" style={{ background: 'transparent' }} />
        {t.diff}{' '}
        <span className="val">
          {diff >= 0 ? '+' : ''}
          {fmtEUR(diff)}
        </span>
      </div>
    </div>
  );
}

/** Graphique héros : patrimoine des deux chemins (bilan comptable), mois par mois. */
export function HeroChart({ result, deflate, t, lang }: Props) {
  const mode = useMode();
  const colors = PATH_COLORS[mode];
  const cssVar = (name: string) => `var(${name})`;

  const data: Datum[] = useMemo(
    () =>
      result.points.map((p) => {
        const buyPaper = deflate(p.buyPaperWealth, p.month);
        const buyNet = deflate(p.buyNetWealth, p.month);
        const rent = deflate(p.rentNetWealth, p.month);
        // L'écart ombré sépare les deux patrimoines comparables (nets de sortie).
        return {
          years: p.month / 12,
          month: p.month,
          buyPaper,
          buyNet,
          rent,
          band: [Math.min(buyNet, rent), Math.max(buyNet, rent)] as [number, number],
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
      <h2>{t.title}</h2>
      <p className="card-sub">{t.subtitle}</p>
      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
            <XAxis
              dataKey="years"
              type="number"
              domain={[0, horizonYears]}
              ticks={yearTicks}
              tickFormatter={t.yearTick}
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
            <Tooltip content={<HeroTooltip colors={colors} t={t} lang={lang} />} isAnimationActive={false} />
            <Area
              dataKey="band"
              stroke="none"
              fill={cssVar('--ink-3')}
              fillOpacity={0.12}
              isAnimationActive={false}
              activeDot={false}
              name={t.gap}
              legendType="none"
              tooltipType="none"
            />
            <Line
              dataKey="buyNet"
              name={t.buyNet}
              stroke={colors.buy}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeOpacity={0.6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="buyPaper"
              name={t.buyPaper}
              stroke={colors.buy}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              label={endLabel(t.buy, colors.buy)}
            />
            <Line
              dataKey="rent"
              name={t.rent}
              stroke={colors.rent}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              label={endLabel(t.rent, colors.rent)}
            />
            {breakeven !== null && (
              <ReferenceLine
                x={breakeven / 12}
                stroke={cssVar('--ink-2')}
                strokeDasharray="4 4"
                label={{
                  value: t.cross(breakeven),
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
          <span className="swatch" style={{ background: colors.buy }} /> {t.paperLegend}
        </span>
        <span className="legend-item">
          <span
            className="swatch"
            style={{
              background: `repeating-linear-gradient(90deg, ${colors.buy} 0 5px, transparent 5px 9px)`,
              opacity: 0.7,
            }}
          />{' '}
          {t.netLegend}
        </span>
        <span className="legend-item">
          <span className="swatch" style={{ background: colors.rent }} /> {t.rentLegend}
        </span>
        {breakeven === null && <span className="legend-item">{t.noCross(horizonYears)}</span>}
      </div>
    </section>
  );
}
