/** Types du moteur de simulation. Aucune dépendance UI. */

export type GarantieType = 'caution' | 'hypotheque';
export type AssuranceMode = 'capitalInitial' | 'capitalRestantDu';
export type PropertyKind = 'appartement' | 'maison';

export interface SimulationInputs {
  /** Prix d'achat du bien (EUR). */
  price: number;
  /** Loyer mensuel du bien équivalent (EUR). */
  monthlyRent: number;
  /** Durée de détention avant revente (années). */
  holdingYears: number;

  // Financement
  /** Apport personnel (EUR). */
  apport: number;
  /** Taux nominal annuel du prêt. */
  loanRate: number;
  /** Durée du prêt (années). */
  loanYears: number;
  /** Taux annuel d'assurance emprunteur. */
  assuranceRate: number;
  assuranceMode: AssuranceMode;
  garantie: GarantieType;
  /** IRA négociées (exonérées) à la revente. */
  iraWaived: boolean;
  /** Frais de dossier bancaires (EUR). */
  fraisDossier: number;
  /** Achat dans le neuf (frais de notaire réduits, régime TVA). */
  neuf: boolean;

  // Coûts de propriété
  /** Taxe foncière annuelle (EUR), année 1. */
  taxeFonciere: number;
  /** Croissance annuelle de la taxe foncière. */
  taxeFonciereGrowth: number;
  /** Charges de copropriété courantes (EUR/mois), année 1. Croissent à l'inflation. */
  coproCharges: number;
  /** Provision gros travaux, % annuel de la valeur courante du bien. */
  travauxRate: number;
  /** Entretien privatif hors copro, % annuel de la valeur courante du bien. */
  entretienRate: number;
  /** Surcoût mensuel d'assurance propriétaire vs locataire (EUR/mois), année 1. Croît à l'inflation. */
  pnoDelta: number;
  propertyKind: PropertyKind;
  /** Frais d'agence à la revente, % du prix de vente. */
  sellingFeesRate: number;

  // Location
  /** Indexation IRL annuelle en cours de bail. */
  irlGrowth: number;
  /** Durée moyenne d'un bail avant déménagement (années). */
  tenancyYears: number;
  /** Croissance annuelle des loyers de marché (appliquée à la relocation). */
  marketRentGrowth: number;
  /** Encadrement des loyers (Paris) : plafonne la croissance effective à l'IRL. */
  encadrement: boolean;

  // Marché & fiscalité
  /** Appréciation nominale annuelle du bien. */
  appreciation: number;
  /** Rendement nominal annuel du portefeuille (net de frais). */
  investReturn: number;
  /** Inflation générale (charges, assurances). */
  inflation: number;
  /** PFU 30 % appliqué aux gains du portefeuille à la sortie. */
  pfuEnabled: boolean;
}

export interface AmortizationRow {
  /** Mois, 1-indexé. */
  month: number;
  /** Mensualité hors assurance (EUR). */
  payment: number;
  interest: number;
  principal: number;
  /** Capital restant dû en fin de mois (EUR). */
  crdEnd: number;
}

export interface AmortizationSchedule {
  loan: number;
  monthlyPayment: number;
  rows: AmortizationRow[];
  totalInterest: number;
}

export interface NotaireBreakdown {
  dmto: number;
  emolumentsHT: number;
  emolumentsTVA: number;
  debours: number;
  total: number;
  /** total / prix */
  effectiveRate: number;
}

export interface GarantieBreakdown {
  type: GarantieType;
  /** Coût initial payé à la mise en place (EUR). */
  upfront: number;
  /** Restitution FMG en fin de prêt / à la revente (caution uniquement). */
  restitution: number;
  /** Frais de mainlevée si revente avant le terme du prêt (hypothèque uniquement). */
  mainlevee: number;
}

/**
 * Point mensuel de la simulation (bilan en fin de mois m, m=0 → instant initial).
 * Approche comptable : Capitaux propres = Actifs − Passif.
 */
export interface MonthPoint {
  month: number;
  /**
   * Patrimoine sur papier du chemin achat : Actifs (bien + placements) − Passif
   * (capital restant dû). Sans frais de sortie — c'est le bilan à cette date.
   */
  buyPaperWealth: number;
  /**
   * Patrimoine net de sortie du chemin achat : patrimoine sur papier moins les
   * frais réalisés si l'on soldait ce mois-ci (agence, IRA, mainlevée, PFU sur
   * les gains) plus la restitution FMG le cas échéant.
   */
  buyNetWealth: number;
  /** Placements du chemin achat (actif hors bien), valeur brute. */
  buyInvest: number;
  /** Patrimoine sur papier du chemin location = placements bruts. */
  rentPaperWealth: number;
  /** Patrimoine net de sortie du chemin location (placements nets de PFU). */
  rentNetWealth: number;
  /** Placements du chemin location, valeur brute. */
  rentInvest: number;
  /** Sorties de trésorerie du mois, chemin achat. */
  buyOutflow: number;
  /** Sorties de trésorerie du mois, chemin location. */
  rentOutflow: number;
  /** Loyer du mois (EUR). */
  rent: number;
  /** Capital restant dû en fin de mois (passif du chemin achat). */
  crd: number;
  /** Valeur de marché du bien en fin de mois (actif). */
  propertyValue: number;
}

/**
 * Bilan d'un chemin à une date : Actifs − Passif = Capitaux propres, avec le
 * détail des frais de sortie réalisés (nuls tant qu'on ne solde pas).
 */
export interface BalanceSheet {
  /** Actif immobilier (valeur de marché du bien) — 0 pour la location. */
  property: number;
  /** Actif financier (placements bruts). */
  investments: number;
  /** Passif : capital restant dû. */
  mortgage: number;
  /** Frais d'agence réalisés à la revente. */
  sellingFees: number;
  /** IRA réalisées. */
  ira: number;
  /** Mainlevée réalisée (hypothèque avant terme). */
  mainlevee: number;
  /** Restitution FMG encaissée à la sortie (si le prêt court encore). */
  fmgRestitution: number;
  /** PFU réalisé sur les gains des placements. */
  pfu: number;
  /** Capitaux propres sur papier = property + investments − mortgage. */
  paperEquity: number;
  /** Capitaux propres nets de sortie. */
  netEquity: number;
}

export interface CostTotals {
  interest: number;
  assurance: number;
  notaire: number;
  garantieNet: number; // upfront − restitution + mainlevée
  fraisDossier: number;
  taxeFonciere: number;
  coproCharges: number;
  travaux: number;
  entretien: number;
  pnoDelta: number;
  sellingFees: number;
  ira: number;
  totalRentPaid: number;
}

export interface SimulationSummary {
  /** Patrimoine net de sortie du chemin achat (figure de référence). */
  buyTerminalWealth: number;
  /** Patrimoine net de sortie du chemin location (figure de référence). */
  rentTerminalWealth: number;
  /** Patrimoine sur papier du chemin achat à la sortie (avant frais de revente). */
  buyTerminalPaper: number;
  /** achat − location (net de sortie) */
  differential: number;
  /** Premier mois où l'achat (net de sortie) ≥ location (net de sortie), ou null. */
  breakevenMonth: number | null;
  totalInterest: number;
  totalRentPaid: number;
  /** Richesse initiale commune investie par le locataire à t0 (apport + frais évités). */
  initialOutlay: number;
  notaire: NotaireBreakdown;
  garantie: GarantieBreakdown;
  monthlyPayment: number;
  loan: number;
  costs: CostTotals;
  /** Bilan du chemin achat à la sortie. */
  buyBalanceSheet: BalanceSheet;
  /** Bilan du chemin location à la sortie. */
  rentBalanceSheet: BalanceSheet;
  /** IRA payées à la revente (0 si prêt soldé ou exonérées). */
  iraPaid: number;
  fmgRestitution: number;
  /** Impôt PFU payé à la sortie, chemin location. */
  pfuPaidRent: number;
}

export interface SimulationResult {
  inputs: SimulationInputs;
  points: MonthPoint[];
  summary: SimulationSummary;
}
