import { useSyncExternalStore } from 'react';

/**
 * Palette des graphiques (validée avec scripts/validate_palette.js du guide
 * dataviz : bande de luminance, chroma, séparation CVD, contraste).
 *
 * Identités fixes dans TOUTE l'application :
 *  - chemin ACHAT  = bleu
 *  - chemin LOCATION = rouge
 * La heatmap divergente réutilise ces pôles (bleu = achat gagnant,
 * rouge = location gagnante, gris neutre = équilibre).
 */

export const PATH_COLORS = {
  light: { buy: '#2a78d6', rent: '#e34948' },
  dark: { buy: '#3987e5', rent: '#e66767' },
} as const;

/** Segments du graphique de coûts (catégoriel, ordre fixe, rouge exclu — réservé à la location). */
export const COST_COLORS = {
  light: ['#6f747c', '#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e87ba4', '#eb6834'],
  dark: ['#a2a8b0', '#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#d55181', '#d95926'],
} as const;

const DIVERGING = {
  light: { mid: [240, 239, 236], buyPole: [28, 92, 171], rentPole: [181, 47, 46] },
  dark: { mid: [56, 56, 53], buyPole: [134, 182, 239], rentPole: [232, 138, 138] },
} as const;

function mix(a: readonly number[], b: readonly number[], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Couleur divergente pour un différentiel (achat − location).
 * `t` dans [−1, 1] : −1 = location largement gagnante, +1 = achat.
 */
export function divergingColor(t: number, mode: 'light' | 'dark'): string {
  const { mid, buyPole, rentPole } = DIVERGING[mode];
  const clamped = Math.max(-1, Math.min(1, t));
  // Racine carrée : donne de la couleur aux petites valeurs sans saturer.
  const eased = Math.sqrt(Math.abs(clamped));
  return clamped >= 0 ? mix(mid, buyPole, eased) : mix(mid, rentPole, eased);
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Mode clair/sombre du système, réactif. */
export function useMode(): 'light' | 'dark' {
  return useSyncExternalStore(
    (onChange) => {
      const q = darkQuery();
      q.addEventListener('change', onChange);
      return () => q.removeEventListener('change', onChange);
    },
    () => (darkQuery().matches ? 'dark' : 'light'),
  );
}
