import type { SimulationInputs, SimulationResult } from './types';
import { buildAmortization } from './amortization';
import { notaireFees } from './notaire';
import { garantieCosts } from './garantie';
import { runLedger } from './ledger';
import { portfolioNetOfPfu } from './settlement';

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

  const buyTerminalWealth = last.buyWealth;
  const rentTerminalWealth = last.rentWealth;

  const breakevenPoint = ledger.points.find((p) => p.month > 0 && p.buyWealth >= p.rentWealth);

  const pfuPaidRent =
    ledger.rentPortfolioValue -
    portfolioNetOfPfu(ledger.rentPortfolioValue, ledger.rentPortfolioBasis, inputs.pfuEnabled);

  return {
    inputs,
    points: ledger.points,
    summary: {
      buyTerminalWealth,
      rentTerminalWealth,
      differential: buyTerminalWealth - rentTerminalWealth,
      breakevenMonth: breakevenPoint ? breakevenPoint.month : null,
      totalInterest: ledger.totals.interest,
      totalRentPaid: ledger.totals.rentPaid,
      initialOutlay,
      notaire,
      garantie,
      monthlyPayment: schedule.monthlyPayment,
      loan: schedule.loan,
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
      pfuPaidRent,
    },
  };
}
