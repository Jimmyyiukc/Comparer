import type { SimulationResult } from '../engine/types';
import { fmtEUR, fmtDurationMonths } from '../lib/format';
import { PATH_COLORS, useMode } from '../lib/palette';

interface Props {
  result: SimulationResult;
  /** déflateur appliqué aux montants terminaux (1 = nominal) */
  deflate: (value: number, month: number) => number;
}

/** Les six chiffres clés, toujours visibles. */
export function SummaryStrip({ result, deflate }: Props) {
  const mode = useMode();
  const colors = PATH_COLORS[mode];
  const { summary, inputs } = result;
  const horizon = inputs.holdingYears * 12;

  const buy = deflate(summary.buyTerminalWealth, horizon);
  const rent = deflate(summary.rentTerminalWealth, horizon);
  const diff = buy - rent;

  return (
    <section className="summary-strip" aria-label="Synthèse">
      <div className="stat-tile">
        <div className="stat-label">
          <span className="stat-dot" style={{ background: colors.buy }} />
          Patrimoine final — achat
        </div>
        <div className="stat-value">{fmtEUR(buy)}</div>
        <div className="stat-note">après revente, à {inputs.holdingYears} ans</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          <span className="stat-dot" style={{ background: colors.rent }} />
          Patrimoine final — location
        </div>
        <div className="stat-value">{fmtEUR(rent)}</div>
        <div className="stat-note">portefeuille net {inputs.pfuEnabled ? 'de PFU 30 %' : "d'impôt (PFU off)"}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Différentiel</div>
        <div className={`stat-value ${diff >= 0 ? 'positive' : 'negative'}`}>
          {diff >= 0 ? '+' : ''}
          {fmtEUR(diff)}
        </div>
        <div className="stat-note">{diff >= 0 ? "en faveur de l'achat" : 'en faveur de la location'}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Croisement</div>
        <div className="stat-value">
          {summary.breakevenMonth !== null ? fmtDurationMonths(summary.breakevenMonth) : '—'}
        </div>
        <div className="stat-note">
          {summary.breakevenMonth !== null ? "l'achat repasse devant" : "pas de croisement sur l'horizon"}
        </div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Intérêts payés</div>
        <div className="stat-value">{fmtEUR(summary.totalInterest)}</div>
        <div className="stat-note">sur {inputs.holdingYears} ans (nominal)</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">Loyers payés</div>
        <div className="stat-value">{fmtEUR(summary.totalRentPaid)}</div>
        <div className="stat-note">sur {inputs.holdingYears} ans (nominal)</div>
      </div>
    </section>
  );
}
