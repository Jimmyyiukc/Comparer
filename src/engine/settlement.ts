import { FRANCE } from '../config/france';
import type { BalanceSheet } from './types';

/** Montant de PFU (flat tax) dû sur les gains d'un portefeuille. */
export function pfuOnGains(value: number, costBasis: number, pfuEnabled: boolean): number {
  if (!pfuEnabled) return 0;
  return Math.max(0, value - costBasis) * FRANCE.pfuRate.value;
}

/**
 * Indemnités de remboursement anticipé à la revente :
 * min(6 mois d'intérêts sur le capital remboursé par anticipation,
 *     3 % du capital restant dû) — plafond légal (C. conso. R313-25).
 * Souvent négociées à zéro : `waived`.
 */
export function iraAmount(crd: number, annualLoanRate: number, waived: boolean): number {
  if (waived || crd <= 0) return 0;
  const sixMonthsInterest = crd * annualLoanRate * (FRANCE.iraMonthsOfInterest.value / 12);
  const crdCap = crd * FRANCE.iraCrdCapRate.value;
  return Math.min(sixMonthsInterest, crdCap);
}

/**
 * Valeur nette d'un portefeuille après PFU (flat tax 30 %) sur les gains,
 * les gains étant la valeur moins la base de coût (sommes versées).
 */
export function portfolioNetOfPfu(value: number, costBasis: number, pfuEnabled: boolean): number {
  return value - pfuOnGains(value, costBasis, pfuEnabled);
}

export interface ExitInputs {
  /** Actif immobilier (0 pour la location). */
  property: number;
  /** Placements bruts. */
  investments: number;
  /** Base de coût des placements (sommes versées) pour le calcul du PFU. */
  investBasis: number;
  /** Passif : capital restant dû. */
  crd: number;
  /** Frais d'agence à la revente = property × taux. */
  sellingFees: number;
  ira: number;
  mainlevee: number;
  /** Restitution FMG encaissée à la sortie (si le prêt court encore). */
  fmgRestitution: number;
  pfuEnabled: boolean;
}

/**
 * Assemble le bilan d'un chemin à une date : Actifs − Passif = capitaux
 * propres sur papier ; capitaux propres nets de sortie après réalisation des
 * frais (agence, IRA, mainlevée, PFU) et encaissement de la restitution FMG.
 */
export function buildBalanceSheet(e: ExitInputs): BalanceSheet {
  const pfu = pfuOnGains(e.investments, e.investBasis, e.pfuEnabled);
  const paperEquity = e.property + e.investments - e.crd;
  const netEquity = paperEquity - e.sellingFees - e.ira - e.mainlevee + e.fmgRestitution - pfu;
  return {
    property: e.property,
    investments: e.investments,
    mortgage: e.crd,
    sellingFees: e.sellingFees,
    ira: e.ira,
    mainlevee: e.mainlevee,
    fmgRestitution: e.fmgRestitution,
    pfu,
    paperEquity,
    netEquity,
  };
}
