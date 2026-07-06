import { FRANCE } from '../config/france';
import type { NotaireBreakdown } from './types';

/** Émoluments proportionnels du notaire (HT) : barème dégressif par tranches. */
export function emolumentsHT(price: number): number {
  let total = 0;
  let lower = 0;
  for (const { upTo, rate } of FRANCE.emolumentsBareme.value) {
    if (price <= lower) break;
    const slice = Math.min(price, upTo) - lower;
    total += slice * rate;
    lower = upTo;
  }
  return total;
}

/**
 * Frais de notaire calculés (pas estimés).
 * Ancien : DMTO + émoluments TTC + débours. Neuf : taux global simplifié (v1).
 */
export function notaireFees(price: number, neuf: boolean): NotaireBreakdown {
  if (neuf) {
    const total = price * FRANCE.notaireNeufRate.value;
    return {
      dmto: 0,
      emolumentsHT: 0,
      emolumentsTVA: 0,
      debours: 0,
      total,
      effectiveRate: price > 0 ? total / price : 0,
    };
  }
  const dmto = price * FRANCE.dmtoAncien.value;
  const emolHT = emolumentsHT(price);
  const emolTVA = emolHT * FRANCE.tva.value;
  const debours = FRANCE.debours.value;
  const total = dmto + emolHT + emolTVA + debours;
  return {
    dmto,
    emolumentsHT: emolHT,
    emolumentsTVA: emolTVA,
    debours,
    total,
    effectiveRate: price > 0 ? total / price : 0,
  };
}
