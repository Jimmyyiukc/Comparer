import { FRANCE } from '../config/france';
import type { NotaireBreakdown, SimulationInputs } from '../engine/types';
import type { Copy } from '../i18n';
import { defaultEntretienRate } from '../state/defaults';
import { fmtPct } from '../lib/format';
import { NumberField, Segmented, SliderField, Toggle } from './fields';

interface Props {
  inputs: SimulationInputs;
  notaire: NotaireBreakdown;
  realTerms: boolean;
  t: Copy['hyp'];
  onChange: (patch: Partial<SimulationInputs>) => void;
  onRealTermsChange: (v: boolean) => void;
}

/** Curseur en pourcentage : stocke un décimal, affiche des %. */
function PctSlider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  source?: Parameters<typeof SliderField>[0]['source'];
}) {
  return (
    <SliderField
      label={props.label}
      value={Number((props.value * 100).toFixed(4))}
      min={props.min}
      max={props.max}
      step={props.step ?? 0.1}
      unit="%"
      inputWidth={78}
      onChange={(v) => props.onChange(v / 100)}
      source={props.source}
    />
  );
}

/** Panneau « Hypothèses » : les bases sont visibles, les réglages fins sont repliés. */
export function HypothesesPanel({ inputs, notaire, realTerms, t, onChange, onRealTermsChange }: Props) {
  const yearsUnit = t.labels.loanYears === 'Durée du prêt' ? 'ans' : 'yrs';
  const apportRate = inputs.price > 0 ? inputs.apport / inputs.price : 0;
  const taxeFonciereRate = inputs.price > 0 ? inputs.taxeFonciere / inputs.price : 0;

  return (
    <section className="hypotheses card">
      <div className="hyp-header">
        <h2>{t.title}</h2>
        <span className="inline-values">{t.inline(inputs, notaire)}</span>
      </div>

      <div className="hyp-groups basic-hyp-groups">
        <div className="hyp-group">
          <h3>{t.finance}</h3>
          <PctSlider
            label={t.labels.apport}
            value={apportRate}
            min={0}
            max={100}
            step={1}
            source={FRANCE.apportShareDefault}
            onChange={(rate) => onChange({ apport: Math.round(inputs.price * rate) })}
          />
          <PctSlider
            label={t.labels.loanRate}
            value={inputs.loanRate}
            min={0.5}
            max={7}
            step={0.05}
            source={FRANCE.loanRateDefault}
            onChange={(loanRate) => onChange({ loanRate })}
          />
          <SliderField
            label={t.labels.loanYears}
            value={inputs.loanYears}
            min={FRANCE.loanYearsMin.value}
            max={FRANCE.loanYearsMax.value}
            step={1}
            unit={t.labels.loanYears === 'Durée du prêt' ? 'ans' : 'yrs'}
            inputWidth={70}
            source={FRANCE.loanYearsDefault}
            onChange={(loanYears) => onChange({ loanYears })}
          />
        </div>

        <div className="hyp-group">
          <h3>{t.ownership}</h3>
          <PctSlider
            label={t.labels.taxe}
            value={taxeFonciereRate}
            min={0}
            max={3}
            step={0.01}
            source={FRANCE.taxeFonciereDefault}
            onChange={(rate) => onChange({ taxeFonciere: inputs.price * rate })}
          />
          <NumberField
            label={t.labels.copro}
            value={inputs.coproCharges}
            step={10}
            unit={t.perMonth}
            source={FRANCE.coproChargesPerM2Year}
            onChange={(coproCharges) => onChange({ coproCharges })}
          />
        </div>

        <div className="hyp-group">
          <h3>{t.rental}</h3>
          <PctSlider
            label={t.labels.irl}
            value={inputs.irlGrowth}
            min={0}
            max={3.5}
            source={FRANCE.irlGrowthDefault}
            onChange={(irlGrowth) => onChange({ irlGrowth })}
          />
          <PctSlider
            label={t.labels.marketRent}
            value={inputs.marketRentGrowth}
            min={0}
            max={6}
            source={FRANCE.marketRentGrowthDefault}
            onChange={(marketRentGrowth) => onChange({ marketRentGrowth })}
          />
        </div>

        <div className="hyp-group">
          <h3>{t.marketTax}</h3>
          <PctSlider
            label={t.labels.appreciation}
            value={inputs.appreciation}
            min={FRANCE.appreciationMin.value * 100}
            max={FRANCE.appreciationMax.value * 100}
            source={FRANCE.appreciationDefault}
            onChange={(appreciation) => onChange({ appreciation })}
          />
          <PctSlider
            label={t.labels.inflation}
            value={inputs.inflation}
            min={0}
            max={6}
            source={FRANCE.inflationDefault}
            onChange={(inflation) => onChange({ inflation })}
          />
          <Toggle
            label={t.labels.pfu}
            checked={inputs.pfuEnabled}
            source={FRANCE.pfuRate}
            onChange={(pfuEnabled) => onChange({ pfuEnabled })}
          />
          <Toggle
            label={t.labels.realTerms}
            checked={realTerms}
            onChange={onRealTermsChange}
          />
        </div>
      </div>

      <details className="advanced-hyp">
        <summary>
          <span>{t.advanced}</span>
        </summary>

        <div className="hyp-groups">
          <div className="hyp-group">
            <h3>{t.finance}</h3>
            <PctSlider
              label={t.labels.assuranceRate}
              value={inputs.assuranceRate}
              min={0}
              max={1}
              step={0.01}
              source={FRANCE.assuranceRateDefault}
              onChange={(assuranceRate) => onChange({ assuranceRate })}
            />
            <Segmented
              label={t.labels.assuranceBase}
              value={inputs.assuranceMode}
              options={[
                { value: 'capitalInitial', label: t.labels.capitalInitial },
                { value: 'capitalRestantDu', label: t.labels.capitalRestantDu },
              ]}
              onChange={(assuranceMode) => onChange({ assuranceMode })}
            />
            <Segmented
              label={t.labels.garantie}
              value={inputs.garantie}
              options={[
                { value: 'caution', label: t.labels.caution },
                { value: 'hypotheque', label: t.labels.hypotheque },
              ]}
              source={FRANCE.cautionCommissionRate}
              onChange={(garantie) => onChange({ garantie })}
            />
            <Toggle
              label={t.labels.ira}
              checked={inputs.iraWaived}
              source={FRANCE.iraCrdCapRate}
              onChange={(iraWaived) => onChange({ iraWaived })}
            />
            <NumberField
              label={t.labels.dossier}
              value={inputs.fraisDossier}
              step={100}
              unit="€"
              source={FRANCE.fraisDossierDefault}
              onChange={(fraisDossier) => onChange({ fraisDossier })}
            />
            <Toggle
              label={t.labels.neuf}
              checked={inputs.neuf}
              source={FRANCE.notaireNeufRate}
              onChange={(neuf) => onChange({ neuf })}
            />
            <p className="note">{t.notaireNote(notaire, inputs.neuf)}</p>
          </div>

        <div className="hyp-group">
          <h3>{t.ownership}</h3>
          <PctSlider
            label={t.labels.taxeGrowth}
            value={inputs.taxeFonciereGrowth}
            min={0}
            max={8}
            source={FRANCE.taxeFonciereGrowthDefault}
            onChange={(taxeFonciereGrowth) => onChange({ taxeFonciereGrowth })}
          />
          <PctSlider
            label={t.labels.travaux}
            value={inputs.travauxRate}
            min={0}
            max={2}
            step={0.05}
            source={FRANCE.travauxProvisionRateDefault}
            onChange={(travauxRate) => onChange({ travauxRate })}
          />
          <Segmented
            label={t.labels.kind}
            value={inputs.propertyKind}
            options={[
              { value: 'appartement', label: t.labels.apartment },
              { value: 'maison', label: t.labels.house },
            ]}
            onChange={(propertyKind) =>
              onChange({
                propertyKind,
                entretienRate: defaultEntretienRate(propertyKind),
                ...(propertyKind === 'maison' ? { coproCharges: 0, travauxRate: 0 } : {}),
              })
            }
          />
          <PctSlider
            label={t.labels.entretien}
            value={inputs.entretienRate}
            min={0}
            max={2.5}
            step={0.05}
            source={inputs.propertyKind === 'maison' ? FRANCE.entretienMaisonRate : FRANCE.entretienAppartementRate}
            onChange={(entretienRate) => onChange({ entretienRate })}
          />
          <NumberField
            label={t.labels.pno}
            value={inputs.pnoDelta}
            step={5}
            unit={t.perMonth}
            source={FRANCE.pnoDeltaDefault}
            onChange={(pnoDelta) => onChange({ pnoDelta })}
          />
          <PctSlider
            label={t.labels.sellingFees}
            value={inputs.sellingFeesRate}
            min={0}
            max={8}
            source={FRANCE.sellingFeesRateDefault}
            onChange={(sellingFeesRate) => onChange({ sellingFeesRate })}
          />
        </div>

        <div className="hyp-group">
          <h3>{t.rental}</h3>
          <SliderField
            label={t.labels.tenancy}
            value={inputs.tenancyYears}
            min={1}
            max={15}
            step={1}
            unit={yearsUnit}
            inputWidth={70}
            source={FRANCE.tenancyYearsDefault}
            onChange={(tenancyYears) => onChange({ tenancyYears })}
          />
          <Toggle
            label={t.labels.rentControl}
            checked={inputs.encadrement}
            source={FRANCE.irlCap}
            onChange={(encadrement) => onChange({ encadrement })}
          />
        </div>

        <div className="hyp-group">
          <h3>{t.marketTax}</h3>
          <PctSlider
            label={t.labels.investReturn}
            value={inputs.investReturn}
            min={0}
            max={10}
            source={FRANCE.investReturnDefault}
            onChange={(investReturn) => onChange({ investReturn })}
          />
          <div className="field">
            <label>{t.labels.presets}</label>
            <span className="preset-chips">
              <button type="button" onClick={() => onChange({ investReturn: FRANCE.investReturnDefault.value })}>
                {t.labels.worldEquities} ({fmtPct(FRANCE.investReturnDefault.value, 1)})
              </button>
              <button type="button" onClick={() => onChange({ investReturn: FRANCE.livretARate.value })}>
                {t.labels.livretA} ({fmtPct(FRANCE.livretARate.value, 1)})
              </button>
            </span>
          </div>
          <p className="note">
            {t.saleTaxNote}
          </p>
        </div>
      </div>
      </details>
    </section>
  );
}
