import type { AssuranceMode, GarantieType, PropertyKind, SimulationInputs } from '../engine/types';
import { defaultInputs } from './defaults';
import { FRANCE } from '../config/france';

/**
 * Sérialisation de l'état complet dans la query string de l'URL, pour que
 * chaque scénario soit partageable / mettable en favori. Seules les valeurs
 * différentes des défauts sont écrites, pour des URLs courtes.
 */

type Codec = {
  toStr: (inputs: SimulationInputs) => string;
  apply: (inputs: SimulationInputs, raw: string) => void;
};

const PCT_DIGITS = 4; // 0.0345 → "3.45"

function eurParam(key: keyof SimulationInputs & string): Codec {
  return {
    toStr: (s) => String(s[key]),
    apply: (s, raw) => {
      const v = Number(raw);
      if (Number.isFinite(v) && v >= 0) (s[key] as number) = v;
    },
  };
}

/** Taux stocké en décimal, sérialisé en pourcentage (accepte les négatifs). */
function pctParam(key: keyof SimulationInputs & string): Codec {
  return {
    toStr: (s) => String(Number(((s[key] as number) * 100).toFixed(PCT_DIGITS))),
    apply: (s, raw) => {
      const v = Number(raw);
      if (Number.isFinite(v)) (s[key] as number) = v / 100;
    },
  };
}

function boolParam(key: keyof SimulationInputs & string): Codec {
  return {
    toStr: (s) => ((s[key] as boolean) ? '1' : '0'),
    apply: (s, raw) => {
      if (raw === '1' || raw === '0') (s[key] as boolean) = raw === '1';
    },
  };
}

function enumParam<T extends string>(key: keyof SimulationInputs & string, values: readonly T[]): Codec {
  return {
    toStr: (s) => s[key] as string,
    apply: (s, raw) => {
      if ((values as readonly string[]).includes(raw)) (s[key] as unknown) = raw;
    },
  };
}

const CODECS: Record<string, Codec> = {
  p: eurParam('price'),
  l: eurParam('monthlyRent'),
  y: eurParam('holdingYears'),
  ap: eurParam('apport'),
  tx: pctParam('loanRate'),
  ly: eurParam('loanYears'),
  as: pctParam('assuranceRate'),
  am: enumParam<AssuranceMode>('assuranceMode', ['capitalInitial', 'capitalRestantDu']),
  g: enumParam<GarantieType>('garantie', ['caution', 'hypotheque']),
  ira: boolParam('iraWaived'),
  fd: eurParam('fraisDossier'),
  nf: boolParam('neuf'),
  tf: eurParam('taxeFonciere'),
  tfg: pctParam('taxeFonciereGrowth'),
  cc: eurParam('coproCharges'),
  tvx: pctParam('travauxRate'),
  ent: pctParam('entretienRate'),
  pno: eurParam('pnoDelta'),
  pk: enumParam<PropertyKind>('propertyKind', ['appartement', 'maison']),
  fa: pctParam('sellingFeesRate'),
  irl: pctParam('irlGrowth'),
  ten: eurParam('tenancyYears'),
  mrg: pctParam('marketRentGrowth'),
  enc: boolParam('encadrement'),
  app: pctParam('appreciation'),
  ret: pctParam('investReturn'),
  inf: pctParam('inflation'),
  pfu: boolParam('pfuEnabled'),
};

export function inputsToSearchParams(inputs: SimulationInputs): URLSearchParams {
  const defaults = defaultInputs();
  const params = new URLSearchParams();
  for (const [param, codec] of Object.entries(CODECS)) {
    if (
      param === 'ap' &&
      Math.abs(inputs.apport / inputs.price - FRANCE.apportShareDefault.value) < 1e-6
    ) {
      continue;
    }
    if (
      param === 'tf' &&
      Math.abs(inputs.taxeFonciere / inputs.price - FRANCE.taxeFonciereDefault.value / FRANCE.priceDefault.value) <
        1e-6
    ) {
      continue;
    }
    if (codec.toStr(inputs) !== codec.toStr(defaults)) {
      params.set(param, codec.toStr(inputs));
    }
  }
  return params;
}

export function inputsFromSearchParams(search: string | URLSearchParams): SimulationInputs {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const inputs = defaultInputs();
  for (const [param, codec] of Object.entries(CODECS)) {
    const raw = params.get(param);
    if (raw !== null) codec.apply(inputs, raw);
  }
  if (params.has('p') && !params.has('ap')) {
    inputs.apport = Math.round(inputs.price * FRANCE.apportShareDefault.value);
  }
  if (params.has('p') && !params.has('tf')) {
    inputs.taxeFonciere = inputs.price * (FRANCE.taxeFonciereDefault.value / FRANCE.priceDefault.value);
  }
  return inputs;
}
