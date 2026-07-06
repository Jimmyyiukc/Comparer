import type { AmortizationSchedule, GarantieBreakdown, MonthPoint, SimulationInputs } from './types';
import { crdAtMonth } from './amortization';
import { assurancePremium } from './assurance';
import { rentAtMonth } from './rent';
import { buildBalanceSheet, iraAmount } from './settlement';

export interface LedgerTotals {
  interest: number;
  assurance: number;
  taxeFonciere: number;
  coproCharges: number;
  travaux: number;
  entretien: number;
  pnoDelta: number;
  rentPaid: number;
}

export interface LedgerResult {
  points: MonthPoint[];
  totals: LedgerTotals;
  /** Portefeuille côté location en fin d'horizon (brut, avant PFU). */
  rentPortfolioValue: number;
  rentPortfolioBasis: number;
  /** Portefeuille symétrique côté achat (différentiels investis + FMG restituée en fin de prêt). */
  buyPortfolioValue: number;
  buyPortfolioBasis: number;
  /** IRA dues si revente au dernier mois de l'horizon. */
  iraAtExit: number;
  /** Mainlevée due si revente au dernier mois de l'horizon (hypothèque avant terme). */
  mainleveeAtExit: number;
  /** Restitution FMG encaissée à la revente (si le prêt court encore) — sinon déjà investie. */
  fmgAtExit: number;
}

/**
 * Registre mensuel, formulation comptable (bilan par chemin).
 *
 * Chaque mois, budget logement commun du ménage `B = max(sortie_achat, sortie_location)` :
 * les deux chemins coûtent autant, et le moins cher verse l'excédent
 * `B − sortie` dans SON PROPRE compte de placements (l'un des deux est nul).
 *
 * Bilan du chemin achat : Actifs (bien + placements) − Passif (capital restant
 * dû). Les frais d'acquisition (notaire, garantie, dossier) sont une dépense
 * coulée à t0 : le locataire les investit à la place, d'où un patrimoine achat
 * qui démarre en dessous de la location, de leur montant exact.
 *
 * Patrimoine « sur papier » = bilan à cette date, sans frais de revente.
 * Patrimoine « net de sortie » = on réalise agence + IRA + mainlevée + PFU et
 * on encaisse la restitution FMG, comme si l'on soldait ce mois-là.
 */
export function runLedger(
  inputs: SimulationInputs,
  schedule: AmortizationSchedule,
  garantie: GarantieBreakdown,
  initialOutlay: number,
): LedgerResult {
  const horizonMonths = Math.round(inputs.holdingYears * 12);
  const loanMonths = schedule.rows.length;
  const monthlyReturn = (1 + inputs.investReturn) ** (1 / 12) - 1;

  // Compte de placements du locataire : apport + frais évités, investis à t0.
  let rentValue = initialOutlay;
  let rentBasis = initialOutlay;
  // Compte de placements de l'acheteur : apport excédentaire éventuel (si l'apport
  // dépasse le prix), excédents de budget, restitution FMG en fin de prêt.
  const excessApport = Math.max(0, inputs.apport - inputs.price);
  let buyValue = excessApport;
  let buyBasis = excessApport;

  const totals: LedgerTotals = {
    interest: 0,
    assurance: 0,
    taxeFonciere: 0,
    coproCharges: 0,
    travaux: 0,
    entretien: 0,
    pnoDelta: 0,
    rentPaid: 0,
  };

  const wealthPoint = (month: number): MonthPoint => {
    const propertyValue = inputs.price * (1 + inputs.appreciation) ** (month / 12);
    const crd = crdAtMonth(schedule, month);
    const loanActive = crd > 0;
    const ira = loanActive ? iraAmount(crd, inputs.loanRate, inputs.iraWaived) : 0;
    const mainlevee = loanActive ? garantie.mainlevee : 0;
    // Caution : FMG restituée à la revente si le prêt court encore ;
    // si le prêt est déjà soldé, elle a été versée (et investie) en fin de prêt.
    const fmgAtSale = month < loanMonths ? garantie.restitution : 0;

    const buySheet = buildBalanceSheet({
      property: propertyValue,
      investments: buyValue,
      investBasis: buyBasis,
      crd,
      sellingFees: propertyValue * inputs.sellingFeesRate,
      ira,
      mainlevee,
      fmgRestitution: fmgAtSale,
      pfuEnabled: inputs.pfuEnabled,
    });
    const rentSheet = buildBalanceSheet({
      property: 0,
      investments: rentValue,
      investBasis: rentBasis,
      crd: 0,
      sellingFees: 0,
      ira: 0,
      mainlevee: 0,
      fmgRestitution: 0,
      pfuEnabled: inputs.pfuEnabled,
    });

    return {
      month,
      buyPaperWealth: buySheet.paperEquity,
      buyNetWealth: buySheet.netEquity,
      buyInvest: buyValue,
      rentPaperWealth: rentSheet.paperEquity,
      rentNetWealth: rentSheet.netEquity,
      rentInvest: rentValue,
      buyOutflow: 0,
      rentOutflow: 0,
      rent: 0,
      crd,
      propertyValue,
    };
  };

  const points: MonthPoint[] = [wealthPoint(0)];

  for (let m = 1; m <= horizonMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const propertyValue = inputs.price * (1 + inputs.appreciation) ** (m / 12);

    const row = m <= loanMonths ? schedule.rows[m - 1] : undefined;
    const payment = row?.payment ?? 0;
    const assurance = assurancePremium(schedule, inputs.assuranceRate, inputs.assuranceMode, m);
    // Taxe foncière : indexée sur la valeur courante du bien (la base cadastrale
    // suit à long terme le marché), puis sa propre croissance additionnelle.
    const taxeFonciereRate = inputs.price > 0 ? inputs.taxeFonciere / inputs.price : 0;
    const taxeFonciere = (taxeFonciereRate * propertyValue * (1 + inputs.taxeFonciereGrowth) ** yearIndex) / 12;
    const copro = inputs.coproCharges * (1 + inputs.inflation) ** yearIndex;
    const travaux = (inputs.travauxRate * propertyValue) / 12;
    const entretien = (inputs.entretienRate * propertyValue) / 12;
    const pno = inputs.pnoDelta * (1 + inputs.inflation) ** yearIndex;

    const buyOutflow = payment + assurance + taxeFonciere + copro + travaux + entretien + pno;
    const rent = rentAtMonth(m, inputs);
    const rentOutflow = rent;

    totals.interest += row?.interest ?? 0;
    totals.assurance += assurance;
    totals.taxeFonciere += taxeFonciere;
    totals.coproCharges += copro;
    totals.travaux += travaux;
    totals.entretien += entretien;
    totals.pnoDelta += pno;
    totals.rentPaid += rent;

    // Budget logement commun : le chemin le moins cher épargne l'excédent dans
    // son propre compte (l'un des deux versements est nul). Capitalisation
    // mensuelle d'abord, versement en fin de mois.
    const budget = Math.max(buyOutflow, rentOutflow);
    rentValue *= 1 + monthlyReturn;
    buyValue *= 1 + monthlyReturn;
    const buyContribution = budget - buyOutflow;
    const rentContribution = budget - rentOutflow;
    buyValue += buyContribution;
    buyBasis += buyContribution;
    rentValue += rentContribution;
    rentBasis += rentContribution;

    // Fin de prêt avant l'horizon : la restitution FMG est encaissée et investie.
    if (m === loanMonths && garantie.restitution > 0) {
      buyValue += garantie.restitution;
      buyBasis += garantie.restitution;
    }

    const point = wealthPoint(m);
    point.buyOutflow = buyOutflow;
    point.rentOutflow = rentOutflow;
    point.rent = rent;
    points.push(point);
  }

  const exitCrd = crdAtMonth(schedule, horizonMonths);
  return {
    points,
    totals,
    rentPortfolioValue: rentValue,
    rentPortfolioBasis: rentBasis,
    buyPortfolioValue: buyValue,
    buyPortfolioBasis: buyBasis,
    iraAtExit: exitCrd > 0 ? iraAmount(exitCrd, inputs.loanRate, inputs.iraWaived) : 0,
    mainleveeAtExit: exitCrd > 0 ? garantie.mainlevee : 0,
    fmgAtExit: horizonMonths < loanMonths ? garantie.restitution : 0,
  };
}
