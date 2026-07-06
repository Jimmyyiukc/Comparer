/** Formatage des nombres à la française (1 500 €, virgule décimale). */

const eur0 = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function fmtEUR(value: number): string {
  return eur0.format(value);
}

export function fmtEURCents(value: number): string {
  return eur2.format(value);
}

/** Montant compact pour les axes/heatmaps : « 12 k€ », « 1,2 M€ ». */
export function fmtEURCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    return `${sign}${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(abs / 1_000_000)} M€`;
  }
  if (abs >= 1_000) {
    return `${sign}${num0.format(abs / 1_000)} k€`;
  }
  return `${sign}${num0.format(abs)} €`;
}

/** Pourcentage : 0.034 → « 3,4 % ». */
export function fmtPct(decimal: number, digits = 1): string {
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(decimal * 100)} %`;
}

export function fmtNumber(value: number): string {
  return num0.format(value);
}

/** « 10 ans », « 18 mois », « 3 ans et 4 mois » selon la granularité. */
export function fmtDurationMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  if (rest === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} et ${rest} mois`;
}
