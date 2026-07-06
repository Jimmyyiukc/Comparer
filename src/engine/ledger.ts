import type { AmortizationSchedule, GarantieBreakdown, MonthPoint, SimulationInputs } from './types';
import { crdAtMonth } from './amortization';
import { assurancePremium } from './assurance';
import { rentAtMonth } from './rent';
import { iraAmount, portfolioNetOfPfu } from './settlement';

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
 * Registre mensuel : chaque mois, sorties du chemin achat (mensualité,
 * assurance, taxe foncière/12, charges copro, provision travaux, entretien,
 * surcoût PNO) et du chemin location (loyer). Le différentiel est investi
 * chaque mois, côté locataire quand louer est moins cher, côté acheteur
 * sinon, capitalisé au taux de marché mensuel équivalent.
 *
 * Les deux chemins partent de la même richesse initiale : le locataire
 * investit à t0 l'apport + tous les frais d'achat évités (notaire, garantie,
 * dossier) ; l'acheteur les a dépensés.
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

  // Portefeuille locataire : apport + frais évités, investis à t0.
  let rentValue = initialOutlay;
  let rentBasis = initialOutlay;
  // Portefeuille acheteur : différentiels des mois où acheter est moins cher,
  // apport excédentaire éventuel, FMG restituée en fin de prêt.
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

  const sellingCosts = (value: number) => value * inputs.sellingFeesRate;

  const wealthPoint = (month: number): MonthPoint => {
    const propertyValue = inputs.price * (1 + inputs.appreciation) ** (month / 12);
    const crd = crdAtMonth(schedule, month);
    const loanActive = crd > 0;
    const ira = loanActive ? iraAmount(crd, inputs.loanRate, inputs.iraWaived) : 0;
    const mainlevee = loanActive ? garantie.mainlevee : 0;
    // Caution : FMG restituée à la revente si le prêt court encore ;
    // si le prêt est déjà soldé, elle a été versée (et investie) en fin de prêt.
    const fmgAtSale = month < loanMonths ? garantie.restitution : 0;
    const buyWealth =
      propertyValue -
      sellingCosts(propertyValue) -
      crd -
      ira -
      mainlevee +
      fmgAtSale +
      portfolioNetOfPfu(buyValue, buyBasis, inputs.pfuEnabled);
    return {
      month,
      buyWealth,
      rentWealth: portfolioNetOfPfu(rentValue, rentBasis, inputs.pfuEnabled),
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
    const taxeFonciere = (inputs.taxeFonciere * (1 + inputs.taxeFonciereGrowth) ** yearIndex) / 12;
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

    // Capitalisation mensuelle, puis versement du différentiel en fin de mois.
    rentValue *= 1 + monthlyReturn;
    buyValue *= 1 + monthlyReturn;
    const diff = buyOutflow - rentOutflow;
    if (diff >= 0) {
      rentValue += diff;
      rentBasis += diff;
    } else {
      buyValue += -diff;
      buyBasis += -diff;
    }

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
