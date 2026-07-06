import { FRANCE } from '../config/france';
import type { NotaireBreakdown, SimulationInputs } from '../engine/types';
import { defaultEntretienRate } from '../state/defaults';
import { fmtEUR, fmtPct } from '../lib/format';
import { NumberField, Segmented, SliderField, Toggle } from './fields';

interface Props {
  inputs: SimulationInputs;
  notaire: NotaireBreakdown;
  realTerms: boolean;
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

/** Panneau « Hypothèses » : replié, il affiche les valeurs courantes en ligne. */
export function HypothesesPanel({ inputs, notaire, realTerms, onChange, onRealTermsChange }: Props) {
  const inline = [
    `Notaire : ${fmtPct(notaire.effectiveRate, 1)} calculé`,
    `Taux : ${fmtPct(inputs.loanRate, 2)} / ${inputs.loanYears} ans`,
    `Apport : ${fmtEUR(inputs.apport)}`,
    `Assurance : ${fmtPct(inputs.assuranceRate, 2)} ${inputs.assuranceMode === 'capitalInitial' ? 'CI' : 'CRD'}`,
    `Garantie : ${inputs.garantie === 'caution' ? 'caution' : 'hypothèque'}`,
    `TF : ${fmtEUR(inputs.taxeFonciere)} +${fmtPct(inputs.taxeFonciereGrowth, 1)}/an`,
    `Copro : ${fmtEUR(inputs.coproCharges)}/mois`,
    `Loyer : IRL ${fmtPct(inputs.irlGrowth, 1)} · marché ${fmtPct(inputs.marketRentGrowth, 1)}${inputs.encadrement ? ' · encadré' : ''}`,
    `Appréciation : ${fmtPct(inputs.appreciation, 1)}`,
    `Rendement : ${fmtPct(inputs.investReturn, 1)}`,
    `PFU : ${inputs.pfuEnabled ? 'oui' : 'non'}`,
    inputs.neuf ? 'Neuf' : 'Ancien',
  ].join('  ·  ');

  return (
    <details className="hypotheses card">
      <summary>
        <span className="summary-head">Hypothèses</span>
        <span className="inline-values">{inline}</span>
      </summary>

      <div className="hyp-groups">
        <div className="hyp-group">
          <h3>Financement</h3>
          <NumberField
            label="Apport personnel"
            value={inputs.apport}
            step={1_000}
            unit="€"
            source={FRANCE.apportShareDefault}
            onChange={(apport) => onChange({ apport })}
          />
          <PctSlider
            label="Taux nominal du prêt"
            value={inputs.loanRate}
            min={0.5}
            max={7}
            step={0.05}
            source={FRANCE.loanRateDefault}
            onChange={(loanRate) => onChange({ loanRate })}
          />
          <SliderField
            label="Durée du prêt"
            value={inputs.loanYears}
            min={FRANCE.loanYearsMin.value}
            max={FRANCE.loanYearsMax.value}
            step={1}
            unit="ans"
            inputWidth={70}
            source={FRANCE.loanYearsDefault}
            onChange={(loanYears) => onChange({ loanYears })}
          />
          <PctSlider
            label="Assurance emprunteur (taux annuel)"
            value={inputs.assuranceRate}
            min={0}
            max={1}
            step={0.01}
            source={FRANCE.assuranceRateDefault}
            onChange={(assuranceRate) => onChange({ assuranceRate })}
          />
          <Segmented
            label="Assiette de l'assurance"
            value={inputs.assuranceMode}
            options={[
              { value: 'capitalInitial', label: 'Capital initial' },
              { value: 'capitalRestantDu', label: 'Capital restant dû' },
            ]}
            onChange={(assuranceMode) => onChange({ assuranceMode })}
          />
          <Segmented
            label="Garantie du prêt"
            value={inputs.garantie}
            options={[
              { value: 'caution', label: 'Caution' },
              { value: 'hypotheque', label: 'Hypothèque' },
            ]}
            source={FRANCE.cautionCommissionRate}
            onChange={(garantie) => onChange({ garantie })}
          />
          <Toggle
            label="IRA négociées (exonérées à la revente)"
            checked={inputs.iraWaived}
            source={FRANCE.iraCrdCapRate}
            onChange={(iraWaived) => onChange({ iraWaived })}
          />
          <NumberField
            label="Frais de dossier"
            value={inputs.fraisDossier}
            step={100}
            unit="€"
            source={FRANCE.fraisDossierDefault}
            onChange={(fraisDossier) => onChange({ fraisDossier })}
          />
          <Toggle
            label={`Achat dans le neuf (notaire ≈ ${fmtPct(FRANCE.notaireNeufRate.value, 1)})`}
            checked={inputs.neuf}
            source={FRANCE.notaireNeufRate}
            onChange={(neuf) => onChange({ neuf })}
          />
          <p className="note">
            Frais de notaire calculés : <strong>{fmtEUR(notaire.total)}</strong> ({fmtPct(notaire.effectiveRate, 1)}
            {inputs.neuf ? ', taux global neuf' : ` — DMTO ${fmtEUR(notaire.dmto)}, émoluments TTC ${fmtEUR(notaire.emolumentsHT + notaire.emolumentsTVA)}, débours ${fmtEUR(notaire.debours)}`}
            )
          </p>
        </div>

        <div className="hyp-group">
          <h3>Coûts de propriété</h3>
          <NumberField
            label="Taxe foncière annuelle (chiffre réel de l'annonce)"
            value={inputs.taxeFonciere}
            step={50}
            unit="€/an"
            source={FRANCE.taxeFonciereDefault}
            onChange={(taxeFonciere) => onChange({ taxeFonciere })}
          />
          <PctSlider
            label="Croissance de la taxe foncière"
            value={inputs.taxeFonciereGrowth}
            min={0}
            max={8}
            source={FRANCE.taxeFonciereGrowthDefault}
            onChange={(taxeFonciereGrowth) => onChange({ taxeFonciereGrowth })}
          />
          <NumberField
            label="Charges de copropriété courantes"
            value={inputs.coproCharges}
            step={10}
            unit="€/mois"
            source={FRANCE.coproChargesPerM2Year}
            onChange={(coproCharges) => onChange({ coproCharges })}
          />
          <PctSlider
            label="Provision gros travaux (% de la valeur / an)"
            value={inputs.travauxRate}
            min={0}
            max={2}
            step={0.05}
            source={FRANCE.travauxProvisionRateDefault}
            onChange={(travauxRate) => onChange({ travauxRate })}
          />
          <Segmented
            label="Type de bien"
            value={inputs.propertyKind}
            options={[
              { value: 'appartement', label: 'Appartement' },
              { value: 'maison', label: 'Maison' },
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
            label="Entretien privatif (% de la valeur / an)"
            value={inputs.entretienRate}
            min={0}
            max={2.5}
            step={0.05}
            source={inputs.propertyKind === 'maison' ? FRANCE.entretienMaisonRate : FRANCE.entretienAppartementRate}
            onChange={(entretienRate) => onChange({ entretienRate })}
          />
          <NumberField
            label="Surcoût assurance propriétaire (PNO)"
            value={inputs.pnoDelta}
            step={5}
            unit="€/mois"
            source={FRANCE.pnoDeltaDefault}
            onChange={(pnoDelta) => onChange({ pnoDelta })}
          />
          <PctSlider
            label="Frais d'agence à la revente"
            value={inputs.sellingFeesRate}
            min={0}
            max={8}
            source={FRANCE.sellingFeesRateDefault}
            onChange={(sellingFeesRate) => onChange({ sellingFeesRate })}
          />
        </div>

        <div className="hyp-group">
          <h3>Location</h3>
          <PctSlider
            label="Indexation IRL en cours de bail"
            value={inputs.irlGrowth}
            min={0}
            max={3.5}
            source={FRANCE.irlGrowthDefault}
            onChange={(irlGrowth) => onChange({ irlGrowth })}
          />
          <SliderField
            label="Durée moyenne d'occupation (relocation)"
            value={inputs.tenancyYears}
            min={1}
            max={15}
            step={1}
            unit="ans"
            inputWidth={70}
            source={FRANCE.tenancyYearsDefault}
            onChange={(tenancyYears) => onChange({ tenancyYears })}
          />
          <PctSlider
            label="Croissance des loyers de marché"
            value={inputs.marketRentGrowth}
            min={0}
            max={6}
            source={FRANCE.marketRentGrowthDefault}
            onChange={(marketRentGrowth) => onChange({ marketRentGrowth })}
          />
          <Toggle
            label="Encadrement des loyers (Paris) — croissance plafonnée à l'IRL"
            checked={inputs.encadrement}
            source={FRANCE.irlCap}
            onChange={(encadrement) => onChange({ encadrement })}
          />
        </div>

        <div className="hyp-group">
          <h3>Marché & fiscalité</h3>
          <PctSlider
            label="Appréciation nominale du bien (scénario)"
            value={inputs.appreciation}
            min={FRANCE.appreciationMin.value * 100}
            max={FRANCE.appreciationMax.value * 100}
            source={FRANCE.appreciationDefault}
            onChange={(appreciation) => onChange({ appreciation })}
          />
          <PctSlider
            label="Rendement des placements (net de frais)"
            value={inputs.investReturn}
            min={0}
            max={10}
            source={FRANCE.investReturnDefault}
            onChange={(investReturn) => onChange({ investReturn })}
          />
          <div className="field">
            <label>Préréglages du rendement</label>
            <span className="preset-chips">
              <button type="button" onClick={() => onChange({ investReturn: FRANCE.investReturnDefault.value })}>
                Actions monde ({fmtPct(FRANCE.investReturnDefault.value, 1)})
              </button>
              <button type="button" onClick={() => onChange({ investReturn: FRANCE.livretARate.value })}>
                Livret A ({fmtPct(FRANCE.livretARate.value, 1)})
              </button>
            </span>
          </div>
          <PctSlider
            label="Inflation (charges & assurances)"
            value={inputs.inflation}
            min={0}
            max={6}
            source={FRANCE.inflationDefault}
            onChange={(inflation) => onChange({ inflation })}
          />
          <Toggle
            label="PFU 30 % sur les gains du portefeuille à la sortie"
            checked={inputs.pfuEnabled}
            source={FRANCE.pfuRate}
            onChange={(pfuEnabled) => onChange({ pfuEnabled })}
          />
          <Toggle
            label="Afficher en euros constants (déflatés de l'inflation)"
            checked={realTerms}
            onChange={onRealTermsChange}
          />
          <p className="note">
            Plus-value à la revente : <strong>exonérée</strong> — résidence principale. L'appréciation et le
            rendement sont des axes de scénario, pas des prévisions.
          </p>
        </div>
      </div>
    </details>
  );
}
