import { describe, expect, it } from 'vitest';
import { buildAmortization, crdAtMonth } from '../amortization';

describe('amortissement — annuité constante', () => {
  // Cas d'école vérifiable sur toute table d'annuités :
  // 100 000 EUR à 12 %/an sur 12 mois (i = 1 %/mois)
  // M = 100 000 × 0,01 / (1 − 1,01^−12) = 8 884,88
  it('mensualité du cas d\'école 100 000 EUR / 12 % / 12 mois', () => {
    const s = buildAmortization(100_000, 0.12, 1);
    expect(s.monthlyPayment).toBeCloseTo(8_884.88, 2);
    expect(s.rows[0].interest).toBeCloseTo(1_000, 2);
    expect(s.rows[0].principal).toBeCloseTo(7_884.88, 2);
    expect(s.rows).toHaveLength(12);
    expect(s.rows[11].crdEnd).toBe(0);
  });

  it('réconciliation au centime : somme du capital amorti = prêt initial', () => {
    const s = buildAmortization(270_000, 0.034, 25);
    const sumPrincipalCents = s.rows.reduce((acc, r) => acc + Math.round(r.principal * 100), 0);
    expect(sumPrincipalCents).toBe(270_000 * 100);
    expect(s.rows[s.rows.length - 1].crdEnd).toBe(0);
    // CRD strictement décroissant
    for (let i = 1; i < s.rows.length; i++) {
      expect(s.rows[i].crdEnd).toBeLessThan(s.rows[i - 1].crdEnd + 1e-9);
    }
  });

  it('cohérence interne de chaque ligne : mensualité = intérêts + capital', () => {
    const s = buildAmortization(185_432.17, 0.0412, 22);
    for (const r of s.rows) {
      expect(Math.round(r.payment * 100)).toBe(Math.round(r.interest * 100) + Math.round(r.principal * 100));
    }
    const sumPrincipalCents = s.rows.reduce((acc, r) => acc + Math.round(r.principal * 100), 0);
    expect(sumPrincipalCents).toBe(Math.round(185_432.17 * 100));
  });

  it('prêt à taux zéro de taux : mensualité = capital / n', () => {
    const s = buildAmortization(120_000, 0, 10);
    expect(s.monthlyPayment).toBeCloseTo(1_000, 2);
    expect(s.totalInterest).toBe(0);
  });

  it('prêt nul : tableau vide', () => {
    const s = buildAmortization(0, 0.034, 25);
    expect(s.rows).toHaveLength(0);
    expect(s.monthlyPayment).toBe(0);
  });

  it('crdAtMonth : bornes', () => {
    const s = buildAmortization(100_000, 0.03, 20);
    expect(crdAtMonth(s, 0)).toBe(100_000);
    expect(crdAtMonth(s, 1)).toBe(s.rows[0].crdEnd);
    expect(crdAtMonth(s, 240)).toBe(0);
    expect(crdAtMonth(s, 500)).toBe(0); // au-delà du terme
  });
});
