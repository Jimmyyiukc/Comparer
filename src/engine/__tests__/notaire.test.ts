import { describe, expect, it } from 'vitest';
import { emolumentsHT, notaireFees } from '../notaire';

describe('frais de notaire — barème ancien', () => {
  // Exemple de référence : achat ancien à 300 000 EUR.
  // Émoluments HT par tranche :
  //   6 500 × 3,870 %            =   251,55
  //   (17 000 − 6 500) × 1,596 % =   167,58
  //   (60 000 − 17 000) × 1,064 %=   457,52
  //   (300 000 − 60 000) × 0,799 %= 1 917,60
  //   total HT                   = 2 794,25
  it('émoluments HT sur 300 000 EUR', () => {
    expect(emolumentsHT(300_000)).toBeCloseTo(2_794.25, 2);
  });

  it('émoluments HT sur une tranche basse (5 000 EUR)', () => {
    expect(emolumentsHT(5_000)).toBeCloseTo(5_000 * 0.0387, 2);
  });

  it('décomposition complète sur 300 000 EUR ancien', () => {
    const fees = notaireFees(300_000, false);
    expect(fees.dmto).toBeCloseTo(17_430, 2); // 5,81 %
    expect(fees.emolumentsHT).toBeCloseTo(2_794.25, 2);
    expect(fees.emolumentsTVA).toBeCloseTo(558.85, 2); // TVA 20 %
    expect(fees.debours).toBe(1_200);
    expect(fees.total).toBeCloseTo(21_983.1, 2);
    expect(fees.effectiveRate).toBeCloseTo(0.0733, 4);
  });

  it('neuf : taux global simplifié 2,5 %', () => {
    const fees = notaireFees(300_000, true);
    expect(fees.total).toBeCloseTo(7_500, 2);
    expect(fees.dmto).toBe(0);
  });
});
