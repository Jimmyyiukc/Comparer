import type { AmortizationRow, AmortizationSchedule } from './types';

const toCents = (eur: number) => Math.round(eur * 100);
const toEur = (cents: number) => cents / 100;

/**
 * Tableau d'amortissement d'un prêt amortissable à taux fixe (annuité
 * constante), mois par mois, en centimes entiers pour une réconciliation
 * exacte : somme(capital amorti) = prêt initial, au centime près (la
 * dernière mensualité est ajustée pour solder le capital).
 */
export function buildAmortization(loan: number, annualRate: number, years: number): AmortizationSchedule {
  const n = Math.round(years * 12);
  const loanCents = toCents(loan);
  if (loanCents <= 0 || n <= 0) {
    return { loan: Math.max(0, loan), monthlyPayment: 0, rows: [], totalInterest: 0 };
  }

  const i = annualRate / 12;
  const rawPayment = i === 0 ? loan / n : (loan * i) / (1 - (1 + i) ** -n);
  const paymentCents = Math.round(rawPayment * 100);

  const rows: AmortizationRow[] = [];
  let crd = loanCents;
  let totalInterestCents = 0;

  for (let m = 1; m <= n && crd > 0; m++) {
    const interest = Math.round(crd * i);
    let principal = paymentCents - interest;
    let payment = paymentCents;
    // Dernière échéance (ou arrondi final) : on solde exactement le capital.
    if (m === n || principal >= crd) {
      principal = crd;
      payment = principal + interest;
    }
    crd -= principal;
    totalInterestCents += interest;
    rows.push({
      month: m,
      payment: toEur(payment),
      interest: toEur(interest),
      principal: toEur(principal),
      crdEnd: toEur(crd),
    });
  }

  return {
    loan: toEur(loanCents),
    monthlyPayment: toEur(paymentCents),
    rows,
    totalInterest: toEur(totalInterestCents),
  };
}

/** Capital restant dû en fin de mois m (0 si prêt soldé ou m hors tableau). */
export function crdAtMonth(schedule: AmortizationSchedule, month: number): number {
  if (schedule.rows.length === 0) return 0;
  if (month <= 0) return schedule.loan;
  const row = schedule.rows[Math.min(month, schedule.rows.length) - 1];
  return row.crdEnd;
}
