import { describe, expect, it } from 'vitest';
import { garantieCosts } from '../garantie';
import { simulate } from '../simulate';
import { defaultInputs } from '../../state/defaults';

describe('garantie — caution vs hypothèque', () => {
  it('caution : commission + FMG, restitution de 75 % du FMG', () => {
    const g = garantieCosts(200_000, 'caution');
    expect(g.upfront).toBeCloseTo(200_000 * 0.012, 2); // 0,3 % + 0,9 %
    expect(g.restitution).toBeCloseTo(200_000 * 0.009 * 0.75, 2);
    expect(g.mainlevee).toBe(0);
  });

  it('hypothèque : pas de restitution, mainlevée potentielle', () => {
    const g = garantieCosts(200_000, 'hypotheque');
    expect(g.upfront).toBeCloseTo(200_000 * 0.015, 2);
    expect(g.restitution).toBe(0);
    expect(g.mainlevee).toBeCloseTo(200_000 * 0.0035, 2);
  });
});

describe('restitution FMG — timing du flux terminal', () => {
  // Neutralise la fiscalité pour isoler le flux FMG.
  const base = {
    ...defaultInputs(),
    pfuEnabled: false,
    investReturn: 0.12,
    loanYears: 10,
    iraWaived: true,
  };
  const loan = base.price - base.apport;
  const restitution = loan * 0.009 * 0.75;
  const mainlevee = loan * 0.0035;

  it('revente APRÈS la fin du prêt : FMG encaissée en fin de prêt puis investie', () => {
    const caution = simulate({ ...base, holdingYears: 15, garantie: 'caution' });
    const hypo = simulate({ ...base, holdingYears: 15, garantie: 'hypotheque' });
    // Restitution reçue au mois 120, capitalisée 5 ans à 12 % ; pas de
    // mainlevée côté hypothèque (prêt soldé avant la vente).
    const expected = restitution * 1.12 ** 5;
    expect(caution.summary.buyTerminalWealth - hypo.summary.buyTerminalWealth).toBeCloseTo(expected, 0);
  });

  it('revente AVANT la fin du prêt : FMG encaissée à la vente, mainlevée due côté hypothèque', () => {
    const caution = simulate({ ...base, holdingYears: 5, garantie: 'caution' });
    const hypo = simulate({ ...base, holdingYears: 5, garantie: 'hypotheque' });
    // La restitution arrive telle quelle à la vente (aucune capitalisation),
    // et l'hypothèque paie en plus sa mainlevée.
    expect(caution.summary.buyTerminalWealth - hypo.summary.buyTerminalWealth).toBeCloseTo(
      restitution + mainlevee,
      0,
    );
  });
});
