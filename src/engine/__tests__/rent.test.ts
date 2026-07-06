import { describe, expect, it } from 'vitest';
import { rentAtMonth } from '../rent';

const base = {
  monthlyRent: 1_000,
  irlGrowth: 0.02,
  tenancyYears: 3,
  marketRentGrowth: 0.05,
  encadrement: false,
};

describe('loyer — modèle à deux régimes', () => {
  it('année 1 du bail : loyer initial', () => {
    expect(rentAtMonth(1, base)).toBe(1_000);
    expect(rentAtMonth(12, base)).toBe(1_000);
  });

  it('indexation IRL par paliers annuels en cours de bail', () => {
    expect(rentAtMonth(13, base)).toBeCloseTo(1_020, 2); // +2 % au 1er anniversaire
    expect(rentAtMonth(25, base)).toBeCloseTo(1_040.4, 2); // +2 % composé
    expect(rentAtMonth(36, base)).toBeCloseTo(1_040.4, 2); // stable jusqu'à la fin du bail
  });

  it('relocation : remise au niveau du marché', () => {
    // Mois 37 = début du bail n°2 ; marché = 1 000 × 1,05³ = 1 157,625
    expect(rentAtMonth(37, base)).toBeCloseTo(1_157.63, 2);
    // Puis IRL reprend au sein du nouveau bail
    expect(rentAtMonth(49, base)).toBeCloseTo(1_157.625 * 1.02, 2);
  });

  it('encadrement des loyers : relocation plafonnée à la trajectoire IRL', () => {
    const capped = { ...base, encadrement: true };
    // Sans encadrement : 1 157,63 ; plafonné à 1 000 × 1,02³ = 1 061,21
    expect(rentAtMonth(37, capped)).toBeCloseTo(1_061.21, 2);
  });

  it('IRL saisi au-dessus du bouclier : plafonné à 3,5 %', () => {
    const high = { ...base, irlGrowth: 0.06 };
    expect(rentAtMonth(13, high)).toBeCloseTo(1_035, 2);
  });
});
