import { describe, expect, it } from 'vitest';
import { iraAmount, portfolioNetOfPfu } from '../settlement';

describe('IRA — indemnités de remboursement anticipé', () => {
  it('taux bas : le plafond « 6 mois d\'intérêts » s\'applique', () => {
    // CRD 100 000 à 3,4 % : 6 mois d'intérêts = 1 700 < 3 % du CRD = 3 000
    expect(iraAmount(100_000, 0.034, false)).toBeCloseTo(1_700, 2);
  });

  it('taux élevé : le plafond « 3 % du CRD » s\'applique', () => {
    // CRD 100 000 à 7 % : 6 mois d'intérêts = 3 500 > 3 000
    expect(iraAmount(100_000, 0.07, false)).toBeCloseTo(3_000, 2);
  });

  it('IRA négociées (exonérées) : zéro', () => {
    expect(iraAmount(100_000, 0.034, true)).toBe(0);
  });

  it('prêt soldé : zéro', () => {
    expect(iraAmount(0, 0.034, false)).toBe(0);
  });
});

describe('PFU sur les gains du portefeuille', () => {
  it('30 % des gains uniquement', () => {
    expect(portfolioNetOfPfu(120_000, 100_000, true)).toBeCloseTo(120_000 - 20_000 * 0.3, 2);
  });

  it('pas de gains, pas d\'impôt', () => {
    expect(portfolioNetOfPfu(90_000, 100_000, true)).toBe(90_000);
  });

  it('désactivé : valeur brute', () => {
    expect(portfolioNetOfPfu(120_000, 100_000, false)).toBe(120_000);
  });
});
