import { FRANCE } from '../config/france';
import type { PropertyKind, SimulationInputs } from '../engine/types';

/** Charges de copro courantes par défaut (EUR/mois) pour une surface donnée. */
export function defaultCoproCharges(surfaceM2: number): number {
  return Math.round((FRANCE.coproChargesPerM2Year.value * surfaceM2) / 12);
}

/** Taux d'entretien privatif par défaut selon le type de bien. */
export function defaultEntretienRate(kind: PropertyKind): number {
  return kind === 'maison' ? FRANCE.entretienMaisonRate.value : FRANCE.entretienAppartementRate.value;
}

/** Jeu d'entrées par défaut, entièrement assemblé depuis la config France. */
export function defaultInputs(): SimulationInputs {
  const price = FRANCE.priceDefault.value;
  return {
    price,
    monthlyRent: FRANCE.rentDefault.value,
    holdingYears: FRANCE.holdingYearsDefault.value,
    apport: Math.round(price * FRANCE.apportShareDefault.value),
    loanRate: FRANCE.loanRateDefault.value,
    loanYears: FRANCE.loanYearsDefault.value,
    assuranceRate: FRANCE.assuranceRateDefault.value,
    assuranceMode: 'capitalInitial',
    garantie: 'caution',
    iraWaived: false,
    fraisDossier: FRANCE.fraisDossierDefault.value,
    neuf: false,
    taxeFonciere: FRANCE.taxeFonciereDefault.value,
    taxeFonciereGrowth: FRANCE.taxeFonciereGrowthDefault.value,
    coproCharges: defaultCoproCharges(FRANCE.surfaceDefault.value),
    travauxRate: FRANCE.travauxProvisionRateDefault.value,
    entretienRate: defaultEntretienRate('appartement'),
    pnoDelta: FRANCE.pnoDeltaDefault.value,
    propertyKind: 'appartement',
    sellingFeesRate: FRANCE.sellingFeesRateDefault.value,
    irlGrowth: FRANCE.irlGrowthDefault.value,
    tenancyYears: FRANCE.tenancyYearsDefault.value,
    marketRentGrowth: FRANCE.marketRentGrowthDefault.value,
    encadrement: false,
    appreciation: FRANCE.appreciationDefault.value,
    investReturn: FRANCE.investReturnDefault.value,
    inflation: FRANCE.inflationDefault.value,
    pfuEnabled: true,
  };
}
