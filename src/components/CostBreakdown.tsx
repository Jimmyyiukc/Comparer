import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SimulationResult } from '../engine/types';
import { fmtEUR, fmtEURCompact } from '../lib/format';
import { COST_COLORS, PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
}

/** Où l'argent est réellement parti : coûts cumulés de l'achat vs loyers versés. */
export function CostBreakdown({ result }: Props) {
  const mode = useMode();
  const segColors = COST_COLORS[mode];
  const pathColors = PATH_COLORS[mode];
  const c = result.summary.costs;

  const segments = useMemo(
    () => [
      { key: 'interets', label: 'Intérêts du prêt', value: c.interest },
      { key: 'assurances', label: 'Assurances (emprunteur + PNO)', value: c.assurance + c.pnoDelta },
      {
        key: 'acquisition',
        label: 'Notaire, garantie & dossier',
        value: c.notaire + c.garantieNet + c.fraisDossier,
      },
      { key: 'taxeFonciere', label: 'Taxe foncière', value: c.taxeFonciere },
      { key: 'copro', label: 'Charges de copropriété', value: c.coproCharges },
      { key: 'travaux', label: 'Travaux & entretien', value: c.travaux + c.entretien },
      { key: 'revente', label: 'Revente (agence + IRA)', value: c.sellingFees + c.ira },
    ],
    [c],
  );

  const buyTotal = segments.reduce((acc, s) => acc + s.value, 0);

  const data = useMemo(() => {
    const buyRow: Record<string, number | string> = { name: 'Achat' };
    for (const s of segments) buyRow[s.key] = s.value;
    return [buyRow, { name: 'Location', loyers: c.totalRentPaid }];
  }, [segments, c.totalRentPaid]);

  const surface = 'var(--surface)';

  return (
    <section className="card">
      <h2>Où part l'argent</h2>
      <p className="card-sub">
        Coûts cumulés (nominaux) sur {result.inputs.holdingYears} ans — hors remboursement du capital, qui n'est pas
        un coût mais de l'épargne forcée.
      </p>
      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <XAxis
              type="number"
              tickFormatter={fmtEURCompact}
              stroke="transparent"
              tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={68}
              stroke="transparent"
              tick={{ fill: 'var(--ink-2)', fontSize: 13 }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const rows = payload.filter((p) => (p.value as number) > 0);
                return (
                  <div className="viz-tooltip">
                    {rows.map((p) => (
                      <div key={p.dataKey as string} className="tip-row">
                        <span className="swatch" style={{ background: p.color }} />
                        {p.name} <span className="val">{fmtEUR(p.value as number)}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {segments.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="a"
                fill={segColors[i]}
                stroke={surface}
                strokeWidth={1}
                isAnimationActive={false}
                radius={i === segments.length - 1 ? [0, 4, 4, 0] : undefined}
              />
            ))}
            <Bar
              dataKey="loyers"
              name="Loyers versés"
              stackId="a"
              fill={pathColors.rent}
              stroke={surface}
              strokeWidth={1}
              isAnimationActive={false}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-scroll">
        <table className="cost-table">
          <thead>
            <tr>
              <th>Poste (achat)</th>
              <th className="num">Montant</th>
              <th className="num">Part</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s, i) => (
              <tr key={s.key}>
                <td>
                  <span className="row-swatch" style={{ background: segColors[i] }} />
                  {s.label}
                </td>
                <td className="num">{fmtEUR(s.value)}</td>
                <td className="num">{buyTotal > 0 ? `${Math.round((s.value / buyTotal) * 100)} %` : '—'}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total coûts achat</strong>
              </td>
              <td className="num">
                <strong>{fmtEUR(buyTotal)}</strong>
              </td>
              <td className="num">100 %</td>
            </tr>
            <tr>
              <td>
                <span className="row-swatch" style={{ background: pathColors.rent }} />
                <strong>Total loyers versés</strong>
              </td>
              <td className="num">
                <strong>{fmtEUR(c.totalRentPaid)}</strong>
              </td>
              <td className="num">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
