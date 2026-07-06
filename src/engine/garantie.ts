import { FRANCE } from '../config/france';
import type { GarantieBreakdown, GarantieType } from './types';

/**
 * Coût de la garantie du prêt.
 * - Caution (Crédit Logement) : commission + versement FMG à la mise en place ;
 *   ~75 % du versement FMG est restitué en fin de prêt ou à la revente
 *   (encaissement terminal).
 * - Hypothèque : taxe de publicité foncière + émoluments (~1,5 %), aucune
 *   restitution. `mainlevee` est le montant dû UNIQUEMENT si la revente a
 *   lieu avant le terme du prêt — c'est l'appelant qui applique la condition.
 */
export function garantieCosts(loan: number, type: GarantieType): GarantieBreakdown {
  if (loan <= 0) return { type, upfront: 0, restitution: 0, mainlevee: 0 };
  if (type === 'caution') {
    const commission = loan * FRANCE.cautionCommissionRate.value;
    const fmg = loan * FRANCE.cautionFmgRate.value;
    return {
      type,
      upfront: commission + fmg,
      restitution: fmg * FRANCE.fmgRestitutionShare.value,
      mainlevee: 0,
    };
  }
  return {
    type,
    upfront: loan * FRANCE.hypothequeRate.value,
    restitution: 0,
    mainlevee: loan * FRANCE.mainleveeRate.value,
  };
}
