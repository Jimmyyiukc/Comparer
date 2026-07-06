import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate';
import { assurancePremium } from '../assurance';
import { buildAmortization } from '../amortization';
import { defaultInputs } from '../../state/defaults';

describe('simulation complète', () => {
  const inputs = defaultInputs();
  const result = simulate(inputs);

  it('série mensuelle complète : un point par mois + point initial', () => {
    expect(result.points).toHaveLength(inputs.holdingYears * 12 + 1);
    expect(result.points[0].month).toBe(0);
  });

  it('à t0, le locataire détient exactement la mise initiale (apport + frais évités)', () => {
    // valeur = base de coût → aucun gain, donc PFU sans effet à t0
    expect(result.points[0].rentWealth).toBeCloseTo(result.summary.initialOutlay, 2);
    expect(result.summary.initialOutlay).toBeCloseTo(
      inputs.apport + result.summary.notaire.total + result.summary.garantie.upfront + inputs.fraisDossier,
      2,
    );
  });

  it('différentiel = achat − location ; croisement cohérent', () => {
    const { summary, points } = result;
    expect(summary.differential).toBeCloseTo(summary.buyTerminalWealth - summary.rentTerminalWealth, 6);
    if (summary.breakevenMonth !== null) {
      const p = points[summary.breakevenMonth];
      expect(p.buyWealth).toBeGreaterThanOrEqual(p.rentWealth);
      const before = points[summary.breakevenMonth - 1];
      expect(before.buyWealth).toBeLessThan(before.rentWealth);
    }
  });

  it('assurance emprunteur : constante sur capital initial vs dégressive sur CRD', () => {
    const schedule = buildAmortization(270_000, 0.034, 25);
    // Mode capital initial : constante tous les mois
    const first = assurancePremium(schedule, 0.003, 'capitalInitial', 1);
    const mid = assurancePremium(schedule, 0.003, 'capitalInitial', 150);
    expect(first).toBeCloseTo((270_000 * 0.003) / 12, 6);
    expect(mid).toBe(first);
    // Mode CRD : décroissante, premier mois assis sur le capital initial
    const crd1 = assurancePremium(schedule, 0.003, 'capitalRestantDu', 1);
    const crd150 = assurancePremium(schedule, 0.003, 'capitalRestantDu', 150);
    expect(crd1).toBeCloseTo(first, 6);
    expect(crd150).toBeLessThan(crd1);
    // Après le terme du prêt : plus de prime
    expect(assurancePremium(schedule, 0.003, 'capitalInitial', 301)).toBe(0);
  });

  it('le mode assurance sur CRD coûte moins cher au total (écart en milliers sur 25 ans)', () => {
    const long = { ...defaultInputs(), holdingYears: 25 };
    const initial = simulate({ ...long, assuranceMode: 'capitalInitial' });
    const crd = simulate({ ...long, assuranceMode: 'capitalRestantDu' });
    expect(initial.summary.costs.assurance - crd.summary.costs.assurance).toBeGreaterThan(3_000);
  });

  it('IRA à la revente pendant le prêt, exonérables', () => {
    const withIra = simulate({ ...inputs, iraWaived: false });
    const waived = simulate({ ...inputs, iraWaived: true });
    expect(withIra.summary.iraPaid).toBeGreaterThan(0);
    expect(waived.summary.iraPaid).toBe(0);
    expect(waived.summary.buyTerminalWealth).toBeGreaterThan(withIra.summary.buyTerminalWealth);
  });

  it('PFU : activer la flat tax réduit le patrimoine terminal du locataire', () => {
    const withPfu = simulate({ ...inputs, pfuEnabled: true });
    const noPfu = simulate({ ...inputs, pfuEnabled: false });
    expect(withPfu.summary.rentTerminalWealth).toBeLessThan(noPfu.summary.rentTerminalWealth);
    expect(withPfu.summary.pfuPaidRent).toBeGreaterThan(0);
  });

  it('achat comptant (apport = prix) : pas de prêt, pas de frais de crédit', () => {
    const cash = simulate({ ...inputs, apport: inputs.price });
    expect(cash.summary.loan).toBe(0);
    expect(cash.summary.monthlyPayment).toBe(0);
    expect(cash.summary.totalInterest).toBe(0);
    expect(cash.summary.garantie.upfront).toBe(0);
    expect(cash.summary.costs.fraisDossier).toBe(0);
  });
});
