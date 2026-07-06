# Acheter ou louer ? — comparateur France

SPA 100 % client (React + TypeScript + Vite) qui compare, sur un horizon de détention choisi, le patrimoine
terminal de deux chemins :

- **Achat** : résidence principale à crédit, tous les coûts réels de propriété, revente en fin d'horizon
  (frais d'agence, capital restant dû, IRA, restitution FMG).
- **Location** : bien équivalent loué ; l'apport, les frais d'achat évités et chaque écart mensuel de trésorerie
  sont investis au rendement de marché choisi (PFU 30 % optionnel à la sortie).

Moteur **déterministe à registre mensuel** (aucune approximation annuelle, pas de NPV, pas de Monte Carlo),
avec analyse de sensibilité (heatmaps appréciation × durée et rendement × durée).

## Architecture

- `src/config/france.ts` — **toutes** les constantes fiscales/marché, chacune `{ value, label, sourceName, sourceUrl, asOf }`.
  Aucun nombre magique ailleurs (vérifié) ; un futur pays = un fichier frère.
- `src/engine/` — moteur pur TypeScript, zéro dépendance UI, testé unitairement :
  amortissement au centime, barème réel des frais de notaire (ancien) + neuf, assurance emprunteur
  (capital initial / CRD), garantie (caution avec restitution FMG / hypothèque avec mainlevée),
  loyers à deux régimes (IRL + relocation), registre mensuel, règlement terminal (IRA plafonnées, PFU).
- `src/state/` — défauts assemblés depuis la config, sérialisation intégrale de l'état dans l'URL
  (chaque scénario est partageable tel quel).
- `src/components/` — UI (Recharts + grille CSS pour les heatmaps), libellés français, formats `fr-FR`.

## Commandes

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires du moteur (Vitest)
npm run build      # tsc + build de production
```

## Prévisualiser en local / Local preview

Trois façons de voir l'application :

```bash
# 1. Serveur de dev (édition + rechargement à chaud) :
npm install && npm run dev        # ouvre http://localhost:5173

# 2. Aperçu du build de production :
npm run build && npm run preview

# 3. Fichier unique autonome (aucun serveur, hors-ligne) :
npm run build:single              # génère un seul dist/index.html
#   → ouvrez dist/index.html directement dans un navigateur, ou partagez ce fichier.
```

Le fichier `dist/index.html` produit par `build:single` intègre tout le JS et le CSS
(via `vite-plugin-singlefile`) : il s'ouvre par double-clic, sans Node ni serveur. En
mode `file://`, la synchronisation de l'état dans l'URL est désactivée (origine opaque),
mais toutes les fonctions du calculateur marchent normalement.

## Invariants vérifiés par les tests

- Somme des amortissements mensuels + capital restant dû = prêt initial, **au centime**.
- Barème notaire contrôlé sur un cas connu à 300 000 € (ancien) : 21 983,10 €.
- IRA = min(6 mois d'intérêts, 3 % du CRD), les deux branches + exonération.
- Timing de la restitution FMG (fin de prêt vs revente anticipée, avec capitalisation).
- Modèle de loyer à deux régimes : paliers IRL, remise au marché à la relocation, encadrement, bouclier 3,5 %.

Hors périmètre v1 (voir la section Méthodologie de l'app) : PTZ, plus-value hors résidence principale,
rachat de crédit, Monte Carlo, backend.
