import type { SimulationResult } from '../engine/types';
import type { Copy, Lang } from '../i18n';
import { formatDurationMonths } from '../i18n';
import { fmtEUR } from '../lib/format';
import { PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
  /** déflateur appliqué aux montants terminaux (1 = nominal) */
  deflate: (value: number, month: number) => number;
  t: Copy['summary'];
  lang: Lang;
}

/** Les six chiffres clés, toujours visibles. */
export function SummaryStrip({ result, deflate, t, lang }: Props) {
  const mode = useMode();
  const colors = PATH_COLORS[mode];
  const { summary, inputs } = result;
  const horizon = inputs.holdingYears * 12;

  const buy = deflate(summary.buyTerminalWealth, horizon);
  const rent = deflate(summary.rentTerminalWealth, horizon);
  const diff = buy - rent;

  return (
    <section className="summary-strip" aria-label={t.aria}>
      <div className="stat-tile">
        <div className="stat-label">
          <span className="stat-dot" style={{ background: colors.buy }} />
          {t.buyWealth}
        </div>
        <div className="stat-value">{fmtEUR(buy)}</div>
        <div className="stat-note">{t.buyNote(inputs.holdingYears)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          <span className="stat-dot" style={{ background: colors.rent }} />
          {t.rentWealth}
        </div>
        <div className="stat-value">{fmtEUR(rent)}</div>
        <div className="stat-note">{t.rentNote(inputs.pfuEnabled)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">{t.diff}</div>
        <div className={`stat-value ${diff >= 0 ? 'positive' : 'negative'}`}>
          {diff >= 0 ? '+' : ''}
          {fmtEUR(diff)}
        </div>
        <div className="stat-note">{t.diffNote(diff >= 0)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">{t.breakeven}</div>
        <div className="stat-value">
          {summary.breakevenMonth !== null ? formatDurationMonths(summary.breakevenMonth, lang) : '—'}
        </div>
        <div className="stat-note">{t.breakevenNote(summary.breakevenMonth !== null)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">{t.interest}</div>
        <div className="stat-value">{fmtEUR(summary.totalInterest)}</div>
        <div className="stat-note">{t.interestNote(inputs.holdingYears)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">{t.rentPaid}</div>
        <div className="stat-value">{fmtEUR(summary.totalRentPaid)}</div>
        <div className="stat-note">{t.rentPaidNote(inputs.holdingYears)}</div>
      </div>
    </section>
  );
}
