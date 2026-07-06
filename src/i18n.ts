import type { NotaireBreakdown, SimulationInputs } from './engine/types';
import { FRANCE } from './config/france';
import { fmtEUR, fmtPct } from './lib/format';

export type Lang = 'fr' | 'en';

export function parseLang(raw: string | null): Lang {
  return raw === 'en' ? 'en' : 'fr';
}

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

export function formatDurationMonths(months: number, lang: Lang): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (lang === 'fr') {
    if (years === 0) return `${rest} mois`;
    if (rest === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} et ${rest} mois`;
  }
  if (years === 0) return `${rest} month${rest > 1 ? 's' : ''}`;
  if (rest === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} and ${rest} month${rest > 1 ? 's' : ''}`;
}

function notaireDetails(notaire: NotaireBreakdown, neuf: boolean, lang: Lang): string {
  if (lang === 'fr') {
    return neuf
      ? ', taux global neuf'
      : ` — DMTO ${fmtEUR(notaire.dmto)}, émoluments TTC ${fmtEUR(notaire.emolumentsHT + notaire.emolumentsTVA)}, débours ${fmtEUR(notaire.debours)}`;
  }
  return neuf
    ? ', new-build blended rate'
    : ` - transfer duties ${fmtEUR(notaire.dmto)}, notary fees incl. VAT ${fmtEUR(notaire.emolumentsHT + notaire.emolumentsTVA)}, disbursements ${fmtEUR(notaire.debours)}`;
}

export const copy = {
  fr: {
    langLabel: 'English',
    langAria: 'Passer en anglais',
    title: 'Acheter ou louer ?',
    intro: (
      realTerms: boolean,
    ) =>
      `Comparaison patrimoniale sur votre horizon : acheter une résidence principale à crédit puis revendre, ou louer et investir l'apport, les frais évités et chaque euro d'écart mensuel. Registre mensuel, hypothèses françaises sourcées.${realTerms ? ' Affichage en euros constants.' : ''}`,
    buy: 'acheter',
    rent: 'louer',
    footer:
      "Outil personnel d'aide à la décision - pas un conseil financier. Moteur déterministe, calculs au centime, état intégralement encodé dans l'URL.",
    primary: {
      price: 'Prix du bien',
      rent: 'Loyer mensuel équivalent',
      horizon: 'Durée de détention',
      investReturn: 'Rendement des placements',
      yearsUnit: 'ans',
      monthlyUnit: '€/mois',
    },
    summary: {
      aria: 'Synthèse',
      buyWealth: 'Patrimoine final - achat',
      buyNote: (years: number) => `après revente, à ${years} ans`,
      rentWealth: 'Patrimoine final - location',
      rentNote: (pfu: boolean) => `portefeuille net ${pfu ? 'de PFU 30 %' : "d'impôt (PFU off)"}`,
      diff: 'Différentiel',
      diffNote: (positive: boolean) => (positive ? "en faveur de l'achat" : 'en faveur de la location'),
      breakeven: 'Croisement',
      breakevenNote: (has: boolean) => (has ? "l'achat repasse devant" : "pas de croisement sur l'horizon"),
      interest: 'Intérêts payés',
      interestNote: (years: number) => `sur ${years} ans (nominal)`,
      rentPaid: 'Loyers payés',
      rentPaidNote: (years: number) => `sur ${years} ans (nominal)`,
    },
    chart: {
      title: 'Patrimoine net dans le temps',
      subtitle:
        "Valeur nette de chaque chemin si l'on soldait tout ce mois-là : revente du bien (frais, capital restant dû, IRA) côté achat, portefeuille net d'impôt côté location.",
      buy: 'Achat',
      rent: 'Location',
      diff: 'Écart',
      gap: 'Écart',
      buyLegend: 'Achat (revente nette)',
      rentLegend: 'Location (portefeuille net)',
      noCross: (years: number) => `Pas de croisement sur ${years} ans : la location reste devant sur tout l'horizon.`,
      cross: (month: number) => `Croisement : ${formatDurationMonths(month, 'fr')}`,
      yearTick: (y: number) => `${y} an${y > 1 ? 's' : ''}`,
    },
    hyp: {
      title: 'Hypothèses',
      inline: (inputs: SimulationInputs, notaire: NotaireBreakdown) =>
        [
          `Notaire : ${fmtPct(notaire.effectiveRate, 1)} calculé`,
          `Taux : ${fmtPct(inputs.loanRate, 2)} / ${inputs.loanYears} ans`,
          `Apport : ${fmtPct(inputs.price > 0 ? inputs.apport / inputs.price : 0, 1)} (${fmtEUR(inputs.apport)})`,
          `Assurance : ${fmtPct(inputs.assuranceRate, 2)} ${inputs.assuranceMode === 'capitalInitial' ? 'CI' : 'CRD'}`,
          `Garantie : ${inputs.garantie === 'caution' ? 'caution' : 'hypothèque'}`,
          `TF : ${fmtPct(inputs.price > 0 ? inputs.taxeFonciere / inputs.price : 0, 2)} de la valeur +${fmtPct(inputs.taxeFonciereGrowth, 1)}/an`,
          `Copro : ${fmtEUR(inputs.coproCharges)}/mois`,
          `Loyer : IRL ${fmtPct(inputs.irlGrowth, 1)} · marché ${fmtPct(inputs.marketRentGrowth, 1)}${inputs.encadrement ? ' · encadré' : ''}`,
          `Appréciation : ${fmtPct(inputs.appreciation, 1)}`,
          `Rendement : ${fmtPct(inputs.investReturn, 1)}`,
          `PFU : ${inputs.pfuEnabled ? 'oui' : 'non'}`,
          inputs.neuf ? 'Neuf' : 'Ancien',
        ].join('  ·  '),
      finance: 'Financement',
      ownership: 'Coûts de propriété',
      rental: 'Location',
      marketTax: 'Marché & fiscalité',
      advanced: 'Hypothèses avancées',
      labels: {
        apport: 'Apport personnel (% du prix)',
        loanRate: 'Taux nominal du prêt',
        loanYears: 'Durée du prêt',
        assuranceRate: 'Assurance emprunteur (taux annuel)',
        assuranceBase: "Assiette de l'assurance",
        capitalInitial: 'Capital initial',
        capitalRestantDu: 'Capital restant dû',
        garantie: 'Garantie du prêt',
        caution: 'Caution',
        hypotheque: 'Hypothèque',
        ira: 'IRA négociées (exonérées à la revente)',
        dossier: 'Frais de dossier',
        neuf: `Achat dans le neuf (notaire ≈ ${fmtPct(FRANCE.notaireNeufRate.value, 1)})`,
        taxe: 'Taxe foncière (% de la valeur du bien)',
        taxeGrowth: 'Croissance additionnelle de la taxe foncière',
        copro: 'Charges de copropriété courantes',
        travaux: 'Provision additionnelle gros travaux (% de la valeur / an)',
        kind: 'Type de bien',
        apartment: 'Appartement',
        house: 'Maison',
        entretien: 'Entretien privatif (% de la valeur / an)',
        pno: 'Surcoût assurance propriétaire (PNO)',
        sellingFees: "Frais d'agence à la revente",
        irl: 'Indexation IRL en cours de bail',
        tenancy: "Durée moyenne d'occupation (relocation)",
        marketRent: 'Croissance des loyers de marché',
        rentControl: "Encadrement des loyers (Paris) - croissance plafonnée à l'IRL",
        appreciation: 'Appréciation nominale du bien (scénario)',
        investReturn: 'Rendement des placements (net de frais)',
        presets: 'Préréglages du rendement',
        worldEquities: 'Actions monde',
        livretA: 'Livret A',
        inflation: 'Inflation (charges & assurances)',
        pfu: 'PFU 30 % sur les gains du portefeuille à la sortie',
        realTerms: "Afficher en euros constants (déflatés de l'inflation)",
      },
      notaireNote: (notaire: NotaireBreakdown, neuf: boolean) =>
        `Frais de notaire calculés : ${fmtEUR(notaire.total)} (${fmtPct(notaire.effectiveRate, 1)}${notaireDetails(notaire, neuf, 'fr')})`,
      saleTaxNote:
        "Plus-value à la revente : exonérée - résidence principale. L'appréciation, la taxe foncière et le rendement sont des axes de scénario, pas des prévisions.",
      perYear: '€/an',
      perMonth: '€/mois',
    },
    heatmap: {
      title: 'Sensibilité du verdict',
      subtitle:
        'Différentiel de patrimoine terminal (achat - location) selon la durée de détention et le paramètre choisi. La cellule encadrée est le scénario courant.',
      tabs: {
        appreciation: { title: 'Appréciation du bien', axis: 'Appréciation nominale, %/an' },
        investReturn: { title: 'Rendement des placements', axis: 'Rendement nominal net, %/an' },
      },
      rentWins: 'Location gagnante',
      buyWins: 'Achat gagnant',
      axisPrefix: 'Axe vertical : durée de détention',
      years: (years: number) => `${years} ans`,
      winner: (positive: boolean) => (positive ? 'Achat' : 'Location'),
      winningBy: 'gagnant de',
    },
    costs: {
      title: "Sorties de trésorerie cumulées",
      subtitle: (years: number) =>
        `Sorties cumulées (nominales) sur ${years} ans. Le capital remboursé est inclus pour réconcilier les flux de trésorerie, mais c'est de l'épargne forcée qui construit de l'equity.`,
      buyName: 'Achat',
      rentName: 'Location',
      segments: {
        principal: 'Capital remboursé',
        interets: 'Intérêts du prêt',
        assurances: 'Assurances (emprunteur + PNO)',
        acquisition: 'Notaire, garantie & dossier',
        taxeFonciere: 'Taxe foncière',
        copro: 'Charges de copropriété',
        travaux: 'Gros travaux & entretien',
        revente: 'Revente (agence + IRA)',
        loyers: 'Loyers versés',
      },
      tablePost: 'Poste (achat)',
      amount: 'Montant',
      share: 'Part',
      totalBuy: 'Total sorties achat',
      totalRent: 'Total loyers versés',
      principalNote: '(patrimoine)',
    },
    method: {
      title: 'Méthodologie',
      h1: "Registre mensuel, pas d'approximation annuelle",
      p1:
        "Chaque mois, le simulateur enregistre les sorties réelles des deux chemins - côté achat : mensualité (intérêts + capital), assurance emprunteur, taxe foncière/12, charges de copropriété, provision travaux, entretien, surcoût d'assurance propriétaire ; côté location : loyer. La taxe foncière est modélisée comme un pourcentage de la valeur courante du bien, avec une hypothèse de croissance additionnelle de base fiscale / taux communal. Le différentiel du mois est investi du côté le moins cher au taux de marché composé mensuellement. Le locataire investit dès le départ l'apport et tous les frais d'achat évités (notaire, garantie, dossier). Aucune actualisation (NPV) : on compare des patrimoines terminaux.",
      h2: 'Règlement terminal',
      buySettle:
        "Achat : prix × (1+appréciation)^années - frais d'agence - capital restant dû - IRA + restitution FMG (caution). IRA = min(6 mois d'intérêts, 3 % du CRD), souvent négociées. La plus-value est exonérée (résidence principale).",
      rentSettle: `Location : valeur du portefeuille, moins PFU ${fmtPct(FRANCE.pfuRate.value, 0)} sur les gains si activé (défaut : activé).`,
      h3: 'Loyers : modèle à deux régimes',
      p3: `En cours de bail, le loyer suit l'IRL (palier annuel, plafonné à ${fmtPct(FRANCE.irlCap.value, 1)}, référence bouclier loyer) ; à chaque relocation (tous les ${FRANCE.tenancyYearsDefault.value} ans par défaut), il est remis au niveau du marché, qui suit sa propre trajectoire. Les hypothèses de croissance des loyers sont volontairement inférieures à l'appréciation immobilière par défaut.`,
      h4: 'Taxe foncière',
      p4:
        "Elle est modélisée comme un pourcentage de la valeur courante du bien. L'hypothèse de croissance additionnelle capture l'indexation des bases cadastrales et le risque de hausse des taux communaux, séparément de l'appréciation du bien et de l'inflation.",
      h5: "Ce qui n'est volontairement PAS modélisé (v1)",
      exclusions: [
        'La taxation de la plus-value hors résidence principale (bascule « investissement locatif »).',
        'Le PTZ et les prêts aidés.',
        'Le rachat / la renégociation de crédit en cours de route.',
        'Toute simulation stochastique (Monte Carlo) : le moteur est déterministe.',
      ],
      h6: 'Avertissement sur les paramètres de scénario',
      p6a:
        "L'appréciation du bien et le rendement des placements sont des axes de scénario, pas des prévisions. Le long terme parisien est de l'ordre de 3-4 % nominal avec des décennies entières de baisse",
      p6b:
        ' ; la heatmap de sensibilité est là pour explorer, pas pour prédire. Toutes les valeurs par défaut sont sourcées et datées - survolez les annotations.',
    },
  },
  en: {
    langLabel: 'Français',
    langAria: 'Switch to French',
    title: 'Buy or rent?',
    intro: (
      realTerms: boolean,
    ) =>
      `Net-worth comparison over your own horizon: buy a primary residence with a mortgage and sell later, or rent and invest the down payment, avoided transaction costs, and every monthly cash-flow difference. Monthly ledger, France-specific sourced assumptions.${realTerms ? ' Displayed in real euros.' : ''}`,
    buy: 'buy',
    rent: 'rent',
    footer:
      'Personal decision-support tool - not financial advice. Deterministic engine, cent-level calculations, full state encoded in the URL.',
    primary: {
      price: 'Property price',
      rent: 'Equivalent monthly rent',
      horizon: 'Holding period',
      investReturn: 'Investment return',
      yearsUnit: 'yrs',
      monthlyUnit: '€/mo',
    },
    summary: {
      aria: 'Summary',
      buyWealth: 'Final wealth - buying',
      buyNote: (years: number) => `after sale, at ${years} years`,
      rentWealth: 'Final wealth - renting',
      rentNote: (pfu: boolean) => `portfolio net of ${pfu ? '30% PFU tax' : 'tax (PFU off)'}`,
      diff: 'Difference',
      diffNote: (positive: boolean) => (positive ? 'in favor of buying' : 'in favor of renting'),
      breakeven: 'Breakeven',
      breakevenNote: (has: boolean) => (has ? 'buying moves ahead' : 'no breakeven over horizon'),
      interest: 'Interest paid',
      interestNote: (years: number) => `over ${years} years (nominal)`,
      rentPaid: 'Rent paid',
      rentPaidNote: (years: number) => `over ${years} years (nominal)`,
    },
    chart: {
      title: 'Net worth over time',
      subtitle:
        'Net value of each path if everything were settled that month: property resale proceeds net of fees, remaining principal and prepayment charge for buying; portfolio after tax for renting.',
      buy: 'Buying',
      rent: 'Renting',
      diff: 'Difference',
      gap: 'Gap',
      buyLegend: 'Buying (net resale)',
      rentLegend: 'Renting (net portfolio)',
      noCross: (years: number) => `No breakeven over ${years} years: renting stays ahead throughout the horizon.`,
      cross: (month: number) => `Breakeven: ${formatDurationMonths(month, 'en')}`,
      yearTick: (y: number) => `${y}y`,
    },
    hyp: {
      title: 'Assumptions',
      inline: (inputs: SimulationInputs, notaire: NotaireBreakdown) =>
        [
          `Notary: ${fmtPct(notaire.effectiveRate, 1)} calculated`,
          `Rate: ${fmtPct(inputs.loanRate, 2)} / ${inputs.loanYears} yrs`,
          `Down payment: ${fmtPct(inputs.price > 0 ? inputs.apport / inputs.price : 0, 1)} (${fmtEUR(inputs.apport)})`,
          `Insurance: ${fmtPct(inputs.assuranceRate, 2)} ${inputs.assuranceMode === 'capitalInitial' ? 'initial capital' : 'remaining principal'}`,
          `Guarantee: ${inputs.garantie === 'caution' ? 'guarantee' : 'mortgage lien'}`,
          `Property tax: ${fmtPct(inputs.price > 0 ? inputs.taxeFonciere / inputs.price : 0, 2)} of value +${fmtPct(inputs.taxeFonciereGrowth, 1)}/yr`,
          `Condo: ${fmtEUR(inputs.coproCharges)}/mo`,
          `Rent: IRL ${fmtPct(inputs.irlGrowth, 1)} · market ${fmtPct(inputs.marketRentGrowth, 1)}${inputs.encadrement ? ' · capped' : ''}`,
          `Appreciation: ${fmtPct(inputs.appreciation, 1)}`,
          `Return: ${fmtPct(inputs.investReturn, 1)}`,
          `PFU: ${inputs.pfuEnabled ? 'yes' : 'no'}`,
          inputs.neuf ? 'New build' : 'Existing',
        ].join('  ·  '),
      finance: 'Financing',
      ownership: 'Ownership costs',
      rental: 'Rental',
      marketTax: 'Market & tax',
      advanced: 'Advanced assumptions',
      labels: {
        apport: 'Down payment (% of price)',
        loanRate: 'Nominal mortgage rate',
        loanYears: 'Loan term',
        assuranceRate: 'Borrower insurance (annual rate)',
        assuranceBase: 'Insurance base',
        capitalInitial: 'Initial capital',
        capitalRestantDu: 'Remaining principal',
        garantie: 'Loan guarantee',
        caution: 'Guarantee',
        hypotheque: 'Mortgage lien',
        ira: 'Prepayment charge waived on sale',
        dossier: 'Application fee',
        neuf: `New-build purchase (notary ≈ ${fmtPct(FRANCE.notaireNeufRate.value, 1)})`,
        taxe: 'Property tax (% of property value)',
        taxeGrowth: 'Additional property tax growth',
        copro: 'Recurring condo charges',
        travaux: 'Extra major works reserve (% of value / year)',
        kind: 'Property type',
        apartment: 'Apartment',
        house: 'House',
        entretien: 'Private maintenance (% of value / year)',
        pno: 'Owner insurance uplift (PNO)',
        sellingFees: 'Agency fees on resale',
        irl: 'IRL rent indexation during lease',
        tenancy: 'Average tenancy duration (reletting)',
        marketRent: 'Market rent growth',
        rentControl: 'Rent control (Paris) - growth capped at IRL',
        appreciation: 'Nominal property appreciation (scenario)',
        investReturn: 'Investment return (net of fees)',
        presets: 'Return presets',
        worldEquities: 'Global equities',
        livretA: 'Livret A',
        inflation: 'Inflation (costs & insurance)',
        pfu: '30% PFU tax on portfolio gains at exit',
        realTerms: 'Show in real euros (deflated by inflation)',
      },
      notaireNote: (notaire: NotaireBreakdown, neuf: boolean) =>
        `Calculated notary costs: ${fmtEUR(notaire.total)} (${fmtPct(notaire.effectiveRate, 1)}${notaireDetails(notaire, neuf, 'en')})`,
      saleTaxNote:
        'Capital gain on sale: exempt - primary residence. Appreciation, property tax and investment return are scenario axes, not forecasts.',
      perYear: '€/yr',
      perMonth: '€/mo',
    },
    heatmap: {
      title: 'Verdict sensitivity',
      subtitle:
        'Terminal wealth difference (buying - renting) by holding period and selected parameter. The outlined cell is the current scenario.',
      tabs: {
        appreciation: { title: 'Property appreciation', axis: 'Nominal appreciation, %/yr' },
        investReturn: { title: 'Investment return', axis: 'Nominal net return, %/yr' },
      },
      rentWins: 'Renting wins',
      buyWins: 'Buying wins',
      axisPrefix: 'Vertical axis: holding period',
      years: (years: number) => `${years} yrs`,
      winner: (positive: boolean) => (positive ? 'Buying' : 'Renting'),
      winningBy: 'wins by',
    },
    costs: {
      title: 'Cumulative cash outflows',
      subtitle: (years: number) =>
        `Cumulative nominal outflows over ${years} years. Principal repayment is included to reconcile cash flows, but it is forced saving that builds equity.`,
      buyName: 'Buying',
      rentName: 'Renting',
      segments: {
        principal: 'Principal repaid',
        interets: 'Mortgage interest',
        assurances: 'Insurance (borrower + PNO)',
        acquisition: 'Notary, guarantee & application',
        taxeFonciere: 'Property tax',
        copro: 'Condo charges',
        travaux: 'Major works & maintenance',
        revente: 'Resale (agency + prepayment)',
        loyers: 'Rent paid',
      },
      tablePost: 'Item (buying)',
      amount: 'Amount',
      share: 'Share',
      totalBuy: 'Total buying outflows',
      totalRent: 'Total rent paid',
      principalNote: '(equity)',
    },
    method: {
      title: 'Methodology',
      h1: 'Monthly ledger, no annual approximation',
      p1:
        'Each month, the simulator records actual cash outflows for both paths - buying: mortgage payment (interest + principal), borrower insurance, property tax/12, condo charges, works reserve, maintenance, owner insurance uplift; renting: rent. Property tax is modeled as a percentage of the current property value, with an additional tax-base / municipal-rate growth assumption. The monthly cash-flow difference is invested on the cheaper side at a monthly-compounded market rate. The renter invests the down payment and all avoided purchase costs upfront (notary, guarantee, application fee). No discounting (NPV): the comparison is terminal wealth.',
      h2: 'Terminal settlement',
      buySettle:
        'Buying: price × (1+appreciation)^years - agency fees - remaining principal - prepayment charge + guarantee fund refund. Prepayment charge = min(6 months of interest, 3% of remaining principal), often negotiated away. Capital gain is exempt for a primary residence.',
      rentSettle: `Renting: portfolio value, less ${fmtPct(FRANCE.pfuRate.value, 0)} PFU on gains if enabled (default: enabled).`,
      h3: 'Rent: two-regime model',
      p3: `During a lease, rent follows IRL (annual step, capped at ${fmtPct(FRANCE.irlCap.value, 1)}, rent-shield reference); at each reletting event (every ${FRANCE.tenancyYearsDefault.value} years by default), it resets to the market rent path. Default rent-growth assumptions are intentionally below default property appreciation.`,
      h4: 'Property tax',
      p4:
        'It is modeled as a percentage of the current property value. The additional growth assumption captures cadastral-base indexation and municipal tax-rate risk separately from market-value appreciation and inflation.',
      h5: 'What is intentionally NOT modeled (v1)',
      exclusions: [
        'Capital-gains tax outside a primary residence (rental-investment mode).',
        'PTZ and subsidized loans.',
        'Mortgage refinancing or renegotiation during the holding period.',
        'Any stochastic simulation (Monte Carlo): the engine is deterministic.',
      ],
      h6: 'Scenario-parameter warning',
      p6a:
        'Property appreciation and investment return are scenario axes, not forecasts. The long-term Paris figure is roughly 3-4% nominal, with full decades of decline',
      p6b:
        '; the sensitivity heatmap is for exploration, not prediction. All defaults are sourced and dated - hover the annotations.',
    },
  },
} as const;

export type Copy = (typeof copy)[Lang];
