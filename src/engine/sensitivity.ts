import type { SimulationInputs } from './types';
import { simulate } from './simulate';

export interface HeatmapCell {
  /** valeur de l'axe X (taux, en décimal) */
  x: number;
  /** valeur de l'axe Y (durée de détention, années) */
  years: number;
  /** patrimoine terminal achat − location (EUR) */
  differential: number;
}

export interface HeatmapGrid {
  cells: HeatmapCell[];
  xValues: number[];
  yearValues: number[];
}

/** Grille de sensibilité : fait varier un paramètre (x) × durée de détention. */
export function sensitivityGrid(
  base: SimulationInputs,
  param: 'appreciation' | 'investReturn',
  xValues: number[],
  yearValues: number[],
): HeatmapGrid {
  const cells: HeatmapCell[] = [];
  for (const years of yearValues) {
    for (const x of xValues) {
      const result = simulate({ ...base, [param]: x, holdingYears: years });
      cells.push({ x, years, differential: result.summary.differential });
    }
  }
  return { cells, xValues, yearValues };
}
