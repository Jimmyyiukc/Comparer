import { useEffect, useMemo, useRef, useState } from 'react';
import type { SimulationInputs } from './engine/types';
import { simulate } from './engine/simulate';
import { inputsFromSearchParams, inputsToSearchParams } from './state/urlState';
import { PrimaryInputs } from './components/PrimaryInputs';
import { SummaryStrip } from './components/SummaryStrip';
import { HeroChart } from './components/HeroChart';
import { SensitivityHeatmap } from './components/SensitivityHeatmap';
import { CostBreakdown } from './components/CostBreakdown';
import { HypothesesPanel } from './components/HypothesesPanel';
import { Methodologie } from './components/Methodologie';

export default function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(() => inputsFromSearchParams(window.location.search));
  const [realTerms, setRealTerms] = useState(
    () => new URLSearchParams(window.location.search).get('rt') === '1',
  );

  const result = useMemo(() => simulate(inputs), [inputs]);

  // Tout l'état vit dans l'URL : chaque scénario est partageable tel quel.
  const urlTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      const params = inputsToSearchParams(inputs);
      if (realTerms) params.set('rt', '1');
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, 300);
    return () => window.clearTimeout(urlTimer.current);
  }, [inputs, realTerms]);

  const update = (patch: Partial<SimulationInputs>) => setInputs((prev) => ({ ...prev, ...patch }));

  // Affichage en euros constants : déflate un montant du mois m par l'inflation.
  const deflate = useMemo(() => {
    if (!realTerms) return (value: number) => value;
    const inflation = inputs.inflation;
    return (value: number, month: number = inputs.holdingYears * 12) =>
      value / (1 + inflation) ** (month / 12);
  }, [realTerms, inputs.inflation, inputs.holdingYears]) as (value: number, month: number) => number;

  return (
    <div className="app">
      <header className="masthead">
        <h1>Acheter ou louer ?</h1>
        <p>
          Comparaison patrimoniale sur votre horizon : <span className="path-chip buy">acheter</span> une résidence
          principale à crédit puis revendre, ou <span className="path-chip rent">louer</span> et investir l'apport,
          les frais évités et chaque euro d'écart mensuel. Registre mensuel, hypothèses françaises sourcées.
          {realTerms && <strong> Affichage en euros constants.</strong>}
        </p>
      </header>

      <PrimaryInputs inputs={inputs} onChange={update} />
      <SummaryStrip result={result} deflate={deflate} />
      <HeroChart result={result} deflate={deflate} />
      <HypothesesPanel
        inputs={inputs}
        notaire={result.summary.notaire}
        realTerms={realTerms}
        onChange={update}
        onRealTermsChange={setRealTerms}
      />
      <SensitivityHeatmap inputs={inputs} />
      <CostBreakdown result={result} />
      <Methodologie />

      <footer className="colophon">
        Outil personnel d'aide à la décision — pas un conseil financier. Moteur déterministe, calculs au centime,
        état intégralement encodé dans l'URL.
      </footer>
    </div>
  );
}
