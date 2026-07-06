import type { BalanceSheet as BalanceSheetData, SimulationResult } from '../engine/types';
import type { Copy } from '../i18n';
import { fmtEUR } from '../lib/format';
import { PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
  t: Copy['balance'];
}

interface Row {
  label: string;
  value: number;
  /** signe comptable pour l'affichage (− pour passif / frais). */
  negative?: boolean;
  strong?: boolean;
  /** grisé quand la ligne ne concerne pas ce chemin. */
  muted?: boolean;
}

function pathRows(bs: BalanceSheetData, isBuy: boolean, t: Copy['balance']): Row[] {
  return [
    { label: t.property, value: bs.property, muted: !isBuy },
    { label: t.investments, value: bs.investments },
    { label: t.mortgage, value: bs.mortgage, negative: true, muted: !isBuy },
    { label: t.paperEquity, value: bs.paperEquity, strong: true },
    { label: t.sellingFees, value: bs.sellingFees, negative: true, muted: !isBuy },
    { label: t.ira, value: bs.ira, negative: true, muted: !isBuy },
    { label: t.mainlevee, value: bs.mainlevee, negative: true, muted: !isBuy },
    { label: t.fmg, value: bs.fmgRestitution, muted: !isBuy },
    { label: t.pfu, value: bs.pfu, negative: true },
    { label: t.netEquity, value: bs.netEquity, strong: true },
  ];
}

/** Bilan de sortie : Actifs − Passif = capitaux propres, pour chaque chemin. */
export function BalanceSheet({ result, t }: Props) {
  const mode = useMode();
  const colors = PATH_COLORS[mode];
  const { buyBalanceSheet, rentBalanceSheet, initialOutlay } = result.summary;
  const buyRows = pathRows(buyBalanceSheet, true, t);
  const rentRows = pathRows(rentBalanceSheet, false, t);

  const cell = (r: Row) => {
    if (r.value === 0 && !r.strong) return <span style={{ color: 'var(--ink-3)' }}>—</span>;
    const sign = r.negative && r.value !== 0 ? '−' : '';
    return (
      <span style={r.muted && !r.strong ? { color: 'var(--ink-3)' } : undefined}>
        {sign}
        {fmtEUR(r.value)}
      </span>
    );
  };

  return (
    <section className="card">
      <h2>{t.title}</h2>
      <p className="card-sub">{t.subtitle(result.inputs.holdingYears, fmtEUR(initialOutlay))}</p>
      <div className="table-scroll">
        <table className="cost-table">
          <thead>
            <tr>
              <th>{t.post}</th>
              <th className="num">
                <span className="row-swatch" style={{ background: colors.buy }} />
                {t.buy}
              </th>
              <th className="num">
                <span className="row-swatch" style={{ background: colors.rent }} />
                {t.rent}
              </th>
            </tr>
          </thead>
          <tbody>
            {buyRows.map((r, i) => (
              <tr key={r.label}>
                <td>{r.strong ? <strong>{r.label}</strong> : r.label}</td>
                <td className="num">{r.strong ? <strong>{cell(r)}</strong> : cell(r)}</td>
                <td className="num">{rentRows[i].strong ? <strong>{cell(rentRows[i])}</strong> : cell(rentRows[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">{t.note}</p>
    </section>
  );
}
