import { useEffect, useMemo, useRef, useState } from 'react';
import type { SimulationInputs } from './engine/types';
import { simulate } from './engine/simulate';
import { inputsFromSearchParams, inputsToSearchParams } from './state/urlState';
import { PrimaryInputs } from './components/PrimaryInputs';
import { SummaryStrip } from './components/SummaryStrip';
import { HeroChart } from './components/HeroChart';
import { SensitivityHeatmap } from './components/SensitivityHeatmap';
import { CostBreakdown } from './components/CostBreakdown';
import { BalanceSheet } from './components/BalanceSheet';
import { HypothesesPanel } from './components/HypothesesPanel';
import { Methodologie } from './components/Methodologie';
import { copy, otherLang, parseLang, type Lang } from './i18n';

export default function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(() => inputsFromSearchParams(window.location.search));
  const [realTerms, setRealTerms] = useState(
    () => new URLSearchParams(window.location.search).get('rt') === '1',
  );
  const [lang, setLang] = useState<Lang>(() => parseLang(new URLSearchParams(window.location.search).get('lang')));

  const result = useMemo(() => simulate(inputs), [inputs]);
  const t = copy[lang];

  // Tout l'état vit dans l'URL : chaque scénario est partageable tel quel.
  const urlTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      const params = inputsToSearchParams(inputs);
      if (realTerms) params.set('rt', '1');
      if (lang !== 'fr') params.set('lang', lang);
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, 300);
    return () => window.clearTimeout(urlTimer.current);
  }, [inputs, realTerms, lang]);

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
        <button className="language-switch" type="button" aria-label={t.langAria} onClick={() => setLang(otherLang(lang))}>
          {t.langLabel}
        </button>
        <h1>{t.title}</h1>
        <p>
          {t.intro(realTerms).split(t.buy)[0]}
          <span className="path-chip buy">{t.buy}</span>
          {t.intro(realTerms).split(t.buy)[1]?.split(t.rent)[0]}
          <span className="path-chip rent">{t.rent}</span>
          {t.intro(realTerms).split(t.rent)[1]}
        </p>
      </header>

      <PrimaryInputs inputs={inputs} onChange={update} t={t.primary} />
      <SummaryStrip result={result} deflate={deflate} t={t.summary} lang={lang} />
      <HeroChart result={result} deflate={deflate} t={t.chart} lang={lang} />
      <HypothesesPanel
        inputs={inputs}
        notaire={result.summary.notaire}
        realTerms={realTerms}
        t={t.hyp}
        onChange={update}
        onRealTermsChange={setRealTerms}
      />
      <SensitivityHeatmap inputs={inputs} t={t.heatmap} />
      <CostBreakdown result={result} t={t.costs} />
      <BalanceSheet result={result} t={t.balance} />
      <Methodologie t={t.method} />

      <footer className="colophon">
        {t.footer}
      </footer>
    </div>
  );
}
