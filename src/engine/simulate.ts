import type { SimulationInputs, SimulationResult } from './types';
import { buildAmortization } from './amortization';
import { notaireFees } from './notaire';
import { garantieCosts } from './garantie';
import { runLedger } from './ledger';
import { buildBalanceSheet } from './settlement';

/**
 * Simulation complète : amortissement, frais d'acquisition, registre mensuel,
 * règlement terminal des deux chemins.
 */
export function simulate(inputs: SimulationInputs): SimulationResult {
  const loan = Math.max(0, inputs.price - inputs.apport);
  const schedule = buildAmortization(loan, inputs.loanRate, inputs.loanYears);
  const notaire = notaireFees(inputs.price, inputs.neuf);
  const garantie = garantieCosts(loan, inputs.garantie);
  const fraisDossier = loan > 0 ? inputs.fraisDossier : 0;

  // Richesse initiale commune : ce que l'acheteur décaisse à t0 et que le
  // locataire investit à la place (apport plafonné au prix + frais évités).
  const initialOutlay = Math.min(inputs.apport, inputs.price) + notaire.total + garantie.upfront + fraisDossier;

  const ledger = runLedger(inputs, schedule, garantie, initialOutlay);
  const last = ledger.points[ledger.points.length - 1];

  // Bilans de sortie : capitaux propres = actifs − passif, nets des frais réalisés.
  const buyBalanceSheet = buildBalanceSheet({
    property: last.propertyValue,
    investments: ledger.buyPortfolioValue,
    investBasis: ledger.buyPortfolioBasis,
    crd: last.crd,
    sellingFees: last.propertyValue * inputs.sellingFeesRate,
    ira: ledger.iraAtExit,
    mainlevee: ledger.mainleveeAtExit,
    fmgRestitution: ledger.fmgAtExit,
    pfuEnabled: inputs.pfuEnabled,
  });
  const rentBalanceSheet = buildBalanceSheet({
    property: 0,
    investments: ledger.rentPortfolioValue,
    investBasis: ledger.rentPortfolioBasis,
    crd: 0,
    sellingFees: 0,
    ira: 0,
    mainlevee: 0,
    fmgRestitution: 0,
    pfuEnabled: inputs.pfuEnabled,
  });

  const buyTerminalWealth = buyBalanceSheet.netEquity;
  const rentTerminalWealth = rentBalanceSheet.netEquity;

  // Croisement comparé sur les patrimoines nets de sortie (comparable des deux côtés).
  const breakevenPoint = ledger.points.find((p) => p.month > 0 && p.buyNetWealth >= p.rentNetWealth);

  return {
    inputs,
    points: ledger.points,
    summary: {
      buyTerminalWealth,
      rentTerminalWealth,
      buyTerminalPaper: buyBalanceSheet.paperEquity,
      differential: buyTerminalWealth - rentTerminalWealth,
      breakevenMonth: breakevenPoint ? breakevenPoint.month : null,
      totalInterest: ledger.totals.interest,
      totalRentPaid: ledger.totals.rentPaid,
      initialOutlay,
      notaire,
      garantie,
      monthlyPayment: schedule.monthlyPayment,
      loan: schedule.loan,
      buyBalanceSheet,
      rentBalanceSheet,
      costs: {
        interest: ledger.totals.interest,
        assurance: ledger.totals.assurance,
        notaire: notaire.total,
        garantieNet: garantie.upfront - garantie.restitution + ledger.mainleveeAtExit,
        fraisDossier,
        taxeFonciere: ledger.totals.taxeFonciere,
        coproCharges: ledger.totals.coproCharges,
        travaux: ledger.totals.travaux,
        entretien: ledger.totals.entretien,
        pnoDelta: ledger.totals.pnoDelta,
        sellingFees: last.propertyValue * inputs.sellingFeesRate,
        ira: ledger.iraAtExit,
        totalRentPaid: ledger.totals.rentPaid,
      },
      iraPaid: ledger.iraAtExit,
      fmgRestitution: garantie.restitution,
      pfuPaidRent: rentBalanceSheet.pfu,
    },
  };
}
