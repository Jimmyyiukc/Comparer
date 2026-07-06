/**
 * Configuration France — toutes les constantes fiscales et de marché de
 * l'application vivent ici, et uniquement ici. Chaque constante porte sa
 * source et sa date de validité, affichées dans l'UI.
 *
 * Pour un futur support multi-pays : créer un fichier frère (ex. belgium.ts)
 * exposant la même forme.
 */

export interface SourcedConstant<T = number> {
  value: T;
  label: string;
  sourceName: string;
  sourceUrl: string;
  asOf: string; // date ISO de la donnée
}

export interface EmolumentSlab {
  /** borne supérieure de la tranche en euros (Infinity pour la dernière) */
  upTo: number;
  /** taux HT applicable à la tranche */
  rate: number;
}

export const FRANCE = {
  // ─────────────────────────────────────────────────────────── Notaire ──
  /** Droits de mutation à titre onéreux (départemental max 5,0 % + communal + frais d'assiette). Quelques départements (36, 38, 56, 976) restent plus bas. */
  dmtoAncien: {
    value: 0.0581,
    label: 'Droits de mutation (DMTO), ancien',
    sourceName: 'ANIL — frais de notaire',
    sourceUrl: 'https://www.anil.org/votre-projet/vous-achetez-vous-construisez/achat-dun-logement-existant/frais-de-notaire/',
    asOf: '2025-04-01',
  } satisfies SourcedConstant,

  /** Émoluments du notaire : barème proportionnel dégressif (arrêté du 28/02/2020, taux 2024). Taux HT par tranche. */
  emolumentsBareme: {
    value: [
      { upTo: 6_500, rate: 0.0387 },
      { upTo: 17_000, rate: 0.01596 },
      { upTo: 60_000, rate: 0.01064 },
      { upTo: Infinity, rate: 0.00799 },
    ] as EmolumentSlab[],
    label: 'Émoluments du notaire (barème)',
    sourceName: 'Service-public.fr — émoluments du notaire',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2240',
    asOf: '2024-01-01',
  } satisfies SourcedConstant<EmolumentSlab[]>,

  /** TVA appliquée aux émoluments du notaire. */
  tva: {
    value: 0.2,
    label: 'TVA (taux normal)',
    sourceName: 'impots.gouv.fr',
    sourceUrl: 'https://www.impots.gouv.fr/professionnel/les-taux-de-tva',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Débours et frais de formalités (forfait indicatif). */
  debours: {
    value: 1_200,
    label: 'Débours et formalités',
    sourceName: 'Notaires de France — frais d\'acquisition',
    sourceUrl: 'https://www.notaires.fr/fr/immobilier-fiscalite/fiscalite-et-gestion-du-patrimoine/les-frais-dacquisition-frais-de-notaire',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Frais d'acquisition dans le neuf (régime TVA) : taux global simplifié v1. */
  notaireNeufRate: {
    value: 0.025,
    label: 'Frais de notaire, neuf (taux global simplifié)',
    sourceName: 'Notaires de France',
    sourceUrl: 'https://www.notaires.fr/fr/immobilier-fiscalite/fiscalite-et-gestion-du-patrimoine/les-frais-dacquisition-frais-de-notaire',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  // ────────────────────────────────────────────────────────── Garantie ──
  /** Caution Crédit Logement — commission (non restituée), % du prêt. */
  cautionCommissionRate: {
    value: 0.003,
    label: 'Caution : commission Crédit Logement',
    sourceName: 'Crédit Logement — barème Classic',
    sourceUrl: 'https://www.creditlogement.fr/notre-garantie/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Caution Crédit Logement — versement au Fonds Mutuel de Garantie (FMG), % du prêt. Total commission + FMG ≈ 1,2 %. */
  cautionFmgRate: {
    value: 0.009,
    label: 'Caution : versement FMG',
    sourceName: 'Crédit Logement — barème Classic',
    sourceUrl: 'https://www.creditlogement.fr/notre-garantie/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Part du versement FMG restituée en fin de prêt ou à la revente. */
  fmgRestitutionShare: {
    value: 0.75,
    label: 'Restitution FMG en fin de prêt',
    sourceName: 'Crédit Logement — restitution FMG',
    sourceUrl: 'https://www.creditlogement.fr/notre-garantie/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Hypothèque (ou PPD) : taxe de publicité foncière + émoluments + formalités, % du prêt. Pas de restitution. */
  hypothequeRate: {
    value: 0.015,
    label: 'Garantie hypothécaire (coût total)',
    sourceName: 'ANIL — garanties du prêt immobilier',
    sourceUrl: 'https://www.anil.org/votre-projet/vous-achetez-vous-construisez/financement/garanties/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Frais de mainlevée d'hypothèque si revente avant le terme du prêt, % du prêt initial. */
  mainleveeRate: {
    value: 0.0035,
    label: 'Mainlevée d\'hypothèque (revente avant terme)',
    sourceName: 'ANIL — mainlevée d\'hypothèque',
    sourceUrl: 'https://www.anil.org/votre-projet/vous-achetez-vous-construisez/financement/garanties/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  // ─────────────────────────────────────────────────────── Financement ──
  /** Taux nominal annuel d'un prêt amortissable 25 ans (moyenne marché). */
  loanRateDefault: {
    value: 0.034,
    label: 'Taux du prêt (25 ans)',
    sourceName: 'Observatoire Crédit Logement / CSA',
    sourceUrl: 'https://www.lobservatoirecreditlogement.fr/',
    asOf: '2025-06-01',
  } satisfies SourcedConstant,

  loanYearsDefault: {
    value: 25,
    label: 'Durée du prêt',
    sourceName: 'Observatoire Crédit Logement / CSA — durée moyenne',
    sourceUrl: 'https://www.lobservatoirecreditlogement.fr/',
    asOf: '2025-06-01',
  } satisfies SourcedConstant,

  /** Assurance emprunteur, % annuel (sur capital initial par défaut). */
  assuranceRateDefault: {
    value: 0.003,
    label: 'Assurance emprunteur',
    sourceName: 'ANIL — assurance emprunteur',
    sourceUrl: 'https://www.anil.org/votre-projet/vous-achetez-vous-construisez/financement/assurance-emprunteur/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Frais de dossier bancaires (forfait). */
  fraisDossierDefault: {
    value: 1_000,
    label: 'Frais de dossier',
    sourceName: 'ANIL — coût du crédit',
    sourceUrl: 'https://www.anil.org/votre-projet/vous-achetez-vous-construisez/financement/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Apport par défaut, en fraction du prix. */
  apportShareDefault: {
    value: 0.1,
    label: 'Apport (part du prix)',
    sourceName: 'Observatoire Crédit Logement / CSA — apport moyen',
    sourceUrl: 'https://www.lobservatoirecreditlogement.fr/',
    asOf: '2025-06-01',
  } satisfies SourcedConstant,

  /** IRA : plafond légal = min(6 mois d'intérêts sur le capital remboursé, 3 % du capital restant dû). */
  iraMonthsOfInterest: {
    value: 6,
    label: 'IRA : mois d\'intérêts (plafond 1)',
    sourceName: 'Code de la consommation, art. R313-25',
    sourceUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032654582',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  iraCrdCapRate: {
    value: 0.03,
    label: 'IRA : % du capital restant dû (plafond 2)',
    sourceName: 'Code de la consommation, art. R313-25',
    sourceUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032654582',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  // ─────────────────────────────────────────────── Coûts de propriété ──
  /** Taxe foncière annuelle (à remplacer par le chiffre réel de l'annonce). */
  taxeFonciereDefault: {
    value: 1_500,
    label: 'Taxe foncière annuelle',
    sourceName: 'UNPI — observatoire des taxes foncières',
    sourceUrl: 'https://www.unpi.org/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Croissance annuelle de la taxe foncière. Base cadastrale indexée IPCH depuis 2018 (+7,1 % en 2023, +3,9 % en 2024) + risque de hausse des taux communaux. Indépendante de l'inflation générale saisie. */
  taxeFonciereGrowthDefault: {
    value: 0.035,
    label: 'Croissance de la taxe foncière',
    sourceName: 'DGFiP — revalorisation des bases cadastrales',
    sourceUrl: 'https://www.impots.gouv.fr/particulier/la-taxe-fonciere-sur-les-proprietes-baties',
    asOf: '2024-01-01',
  } satisfies SourcedConstant,

  /** Charges de copropriété courantes, EUR/m²/an (à remplacer par le chiffre réel de l'annonce). */
  coproChargesPerM2Year: {
    value: 30,
    label: 'Charges de copropriété courantes',
    sourceName: 'ARC — observatoire des charges de copropriété',
    sourceUrl: 'https://arc-copro.fr/',
    asOf: '2024-01-01',
  } satisfies SourcedConstant,

  /** Surface par défaut (m²), sert au calcul des charges par défaut. */
  surfaceDefault: {
    value: 60,
    label: 'Surface',
    sourceName: 'Valeur par défaut (à ajuster)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Provision additionnelle pour gros travaux, % annuel de la valeur du bien. Les charges de copro couvrent déjà une partie de l'entretien courant. */
  travauxProvisionRateDefault: {
    value: 0.001,
    label: 'Provision additionnelle gros travaux',
    sourceName: 'Hypothèse prudente — complément aux charges de copro',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F32058',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Entretien privatif hors copropriété, % annuel de la valeur — appartement. */
  entretienAppartementRate: {
    value: 0.005,
    label: 'Entretien privatif (appartement)',
    sourceName: 'Pratique de marché (0,5 %/an)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Entretien hors copropriété, % annuel de la valeur — maison. */
  entretienMaisonRate: {
    value: 0.01,
    label: 'Entretien (maison)',
    sourceName: 'Pratique de marché (1 %/an)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Delta d'assurance propriétaire (PNO / multirisque propriétaire) vs assurance habitation locataire, EUR/mois. */
  pnoDeltaDefault: {
    value: 15,
    label: 'Surcoût assurance propriétaire',
    sourceName: 'Comparateurs assurance PNO (ordre de grandeur)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Frais d'agence à la revente, % du prix de vente. */
  sellingFeesRateDefault: {
    value: 0.045,
    label: 'Frais d\'agence à la revente',
    sourceName: 'Moyenne des honoraires d\'agence en France',
    sourceUrl: 'https://www.meilleursagents.com/',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  // ────────────────────────────────────────────────────────── Location ──
  /** Indexation annuelle du loyer en cours de bail (IRL). */
  irlGrowthDefault: {
    value: 0.02,
    label: 'Indexation IRL en cours de bail',
    sourceName: 'INSEE — indice de référence des loyers',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/serie/001515333',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Plafond de référence de l'IRL (bouclier loyer 2022-2024 : 3,5 %). */
  irlCap: {
    value: 0.035,
    label: 'Plafond IRL (bouclier loyer)',
    sourceName: 'Loi pouvoir d\'achat 2022 (plafonnement IRL)',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F13723',
    asOf: '2024-01-01',
  } satisfies SourcedConstant,

  /** Durée moyenne d'occupation d'un logement locatif avant déménagement (années). */
  tenancyYearsDefault: {
    value: 6,
    label: 'Durée moyenne d\'occupation',
    sourceName: 'INSEE — mobilité résidentielle des locataires',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/',
    asOf: '2023-01-01',
  } satisfies SourcedConstant,

  /** Croissance annuelle des loyers de marché (relocation). Volontairement inférieure à l'appréciation immobilière. */
  marketRentGrowthDefault: {
    value: 0.025,
    label: 'Croissance des loyers de marché',
    sourceName: 'INSEE / Clameur — loyers de relocation',
    sourceUrl: 'https://www.clameur.fr/',
    asOf: '2024-01-01',
  } satisfies SourcedConstant,

  // ──────────────────────────────────────────────── Marché & fiscalité ──
  /** Appréciation nominale du bien, %/an — axe de scénario, pas une prévision. Paris long terme ≈ 3-4 % nominal avec des décennies de baisse. */
  appreciationDefault: {
    value: 0.025,
    label: 'Appréciation du bien',
    sourceName: 'Notaires de France / INSEE — indices de prix des logements',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/serie/010567051',
    asOf: '2024-12-31',
  } satisfies SourcedConstant,

  appreciationMin: {
    value: -0.02,
    label: 'Appréciation minimum (curseur)',
    sourceName: 'Axe de scénario',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  appreciationMax: {
    value: 0.06,
    label: 'Appréciation maximum (curseur)',
    sourceName: 'Axe de scénario',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Rendement du portefeuille côté location, nominal net de frais. Référence MSCI World long terme ≈ 7 % brut. */
  investReturnDefault: {
    value: 0.065,
    label: 'Rendement des placements (net de frais)',
    sourceName: 'MSCI World — rendement long terme',
    sourceUrl: 'https://www.msci.com/indexes/index/990100',
    asOf: '2024-12-31',
  } satisfies SourcedConstant,

  /** Préréglage sans risque : Livret A. */
  livretARate: {
    value: 0.03,
    label: 'Livret A (préréglage sans risque)',
    sourceName: 'Banque de France — taux du Livret A',
    sourceUrl: 'https://www.banque-france.fr/fr/a-votre-service/particuliers/epargne-reglementee',
    asOf: '2025-02-01',
  } satisfies SourcedConstant,

  /** Inflation générale (croissance des charges, assurances). */
  inflationDefault: {
    value: 0.02,
    label: 'Inflation',
    sourceName: 'BCE — cible d\'inflation / INSEE IPC',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/serie/001759970',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  /** Prélèvement forfaitaire unique (flat tax) sur les gains du portefeuille. */
  pfuRate: {
    value: 0.3,
    label: 'PFU (flat tax) sur les plus-values mobilières',
    sourceName: 'impots.gouv.fr — PFU',
    sourceUrl: 'https://www.impots.gouv.fr/particulier/les-revenus-de-capitaux-mobiliers',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  // ─────────────────────────────────────────────── Défauts de scénario ──
  priceDefault: {
    value: 300_000,
    label: 'Prix du bien',
    sourceName: 'Valeur par défaut (à ajuster)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  rentDefault: {
    value: 1_200,
    label: 'Loyer mensuel équivalent',
    sourceName: 'Valeur par défaut (à ajuster)',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  holdingYearsDefault: {
    value: 10,
    label: 'Durée de détention',
    sourceName: 'Valeur par défaut',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  holdingYearsMin: {
    value: 2,
    label: 'Durée de détention min',
    sourceName: 'Valeur par défaut',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  holdingYearsMax: {
    value: 30,
    label: 'Durée de détention max',
    sourceName: 'Valeur par défaut',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  loanYearsMin: {
    value: 10,
    label: 'Durée du prêt min',
    sourceName: 'Valeur par défaut',
    sourceUrl: '',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,

  loanYearsMax: {
    value: 27,
    label: 'Durée du prêt max',
    sourceName: 'HCSF — durée maximale de 25 ans (27 ans avec différé VEFA)',
    sourceUrl: 'https://www.economie.gouv.fr/hcsf',
    asOf: '2025-01-01',
  } satisfies SourcedConstant,
} as const;

export type FranceConfig = typeof FRANCE;
