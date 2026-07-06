import { FRANCE } from '../config/france';
import type { SimulationInputs } from './types';

type RentParams = Pick<
  SimulationInputs,
  'monthlyRent' | 'irlGrowth' | 'tenancyYears' | 'marketRentGrowth' | 'encadrement'
>;

/**
 * Loyer du mois m (1-indexé) — modèle à deux régimes :
 * 1. En cours de bail : indexation IRL par paliers annuels à chaque
 *    anniversaire du bail (plafonnée au bouclier loyer).
 * 2. À chaque relocation (tous les `tenancyYears` ans) : remise au niveau du
 *    marché, qui suit sa propre trajectoire `marketRentGrowth`.
 *
 * Encadrement des loyers (Paris) : la remise au marché ne peut pas dépasser
 * la trajectoire d'indexation IRL depuis l'origine (croissance effective
 * plafonnée à l'IRL).
 */
export function rentAtMonth(month: number, params: RentParams): number {
  const irl = Math.min(params.irlGrowth, FRANCE.irlCap.value);
  const leaseMonths = Math.max(1, Math.round(params.tenancyYears * 12));

  const monthsElapsed = month - 1; // mois complets écoulés au début du mois m
  const leaseIndex = Math.floor(monthsElapsed / leaseMonths);
  const monthsIntoLease = monthsElapsed - leaseIndex * leaseMonths;

  // Base du bail courant : loyer de marché à la date de relocation.
  const yearsAtLeaseStart = (leaseIndex * leaseMonths) / 12;
  let leaseBase = params.monthlyRent * (1 + params.marketRentGrowth) ** yearsAtLeaseStart;

  // Encadrement : la relocation est plafonnée à la trajectoire IRL depuis t0.
  if (params.encadrement) {
    leaseBase = Math.min(leaseBase, params.monthlyRent * (1 + irl) ** yearsAtLeaseStart);
  }

  // Indexation IRL par paliers annuels au sein du bail.
  const leaseYear = Math.floor(monthsIntoLease / 12);
  return leaseBase * (1 + irl) ** leaseYear;
}
