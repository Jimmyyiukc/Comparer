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

/** Point mensuel de la simulation (état en fin de mois m, m=0 → instant initial). */
export interface MonthPoint {
  month: number;
  /** Patrimoine net du chemin achat si revente ce mois-ci (EUR). */
  buyWealth: number;
  /** Patrimoine net du chemin location (portefeuille net d'impôt) (EUR). */
  rentWealth: number;
  /** Sorties de trésorerie du mois, chemin achat. */
  buyOutflow: number;
  /** Sorties de trésorerie du mois, chemin location. */
  rentOutflow: number;
  /** Loyer du mois (EUR). */
  rent: number;
  /** Capital restant dû en fin de mois. */
  crd: number;
  /** Valeur du bien en fin de mois. */
  propertyValue: number;
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
  buyTerminalWealth: number;
  rentTerminalWealth: number;
  /** achat − location */
  differential: number;
  /** Premier mois où le chemin achat ≥ chemin location, ou null. */
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
