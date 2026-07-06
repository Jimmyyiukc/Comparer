import { FRANCE } from '../config/france';
import type { SimulationInputs } from '../engine/types';
import type { Copy } from '../i18n';
import { SliderField } from './fields';

interface Props {
  inputs: SimulationInputs;
  onChange: (patch: Partial<SimulationInputs>) => void;
  t: Copy['primary'];
}

/** Les entrées principales, toujours visibles au-dessus de la ligne de flottaison. */
export function PrimaryInputs({ inputs, onChange, t }: Props) {
  const apportRate = inputs.price > 0 ? inputs.apport / inputs.price : 0;
  const propertyTaxRate = inputs.price > 0 ? inputs.taxeFonciere / inputs.price : 0;

  return (
    <section className="card">
      <div className="primary-inputs">
        <SliderField
          label={t.price}
          value={inputs.price}
          min={50_000}
          max={1_500_000}
          step={5_000}
          unit="€"
          onChange={(price) =>
            onChange({
              price,
              apport: Math.round(price * apportRate),
              taxeFonciere: price * propertyTaxRate,
            })
          }
        />
        <SliderField
          label={t.rent}
          value={inputs.monthlyRent}
          min={300}
          max={5_000}
          step={10}
          unit={t.monthlyUnit}
          onChange={(monthlyRent) => onChange({ monthlyRent })}
        />
        <SliderField
          label={t.horizon}
          value={inputs.holdingYears}
          min={FRANCE.holdingYearsMin.value}
          max={FRANCE.holdingYearsMax.value}
          step={1}
          unit={t.yearsUnit}
          inputWidth={70}
          onChange={(holdingYears) => onChange({ holdingYears })}
        />
        <SliderField
          label={t.investReturn}
          value={Number((inputs.investReturn * 100).toFixed(4))}
          min={0}
          max={10}
          step={0.1}
          unit="%"
          inputWidth={78}
          source={FRANCE.investReturnDefault}
          onChange={(investReturn) => onChange({ investReturn: investReturn / 100 })}
        />
      </div>
    </section>
  );
}
