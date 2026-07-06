import { FRANCE } from '../config/france';
import type { SimulationInputs } from '../engine/types';
import { SliderField } from './fields';

interface Props {
  inputs: SimulationInputs;
  onChange: (patch: Partial<SimulationInputs>) => void;
}

/** Les trois entrées principales, toujours visibles au-dessus de la ligne de flottaison. */
export function PrimaryInputs({ inputs, onChange }: Props) {
  return (
    <section className="card">
      <div className="primary-inputs">
        <SliderField
          label="Prix du bien"
          value={inputs.price}
          min={50_000}
          max={1_500_000}
          step={5_000}
          unit="€"
          onChange={(price) => onChange({ price })}
        />
        <SliderField
          label="Loyer mensuel équivalent"
          value={inputs.monthlyRent}
          min={300}
          max={5_000}
          step={10}
          unit="€/mois"
          onChange={(monthlyRent) => onChange({ monthlyRent })}
        />
        <SliderField
          label="Durée de détention"
          value={inputs.holdingYears}
          min={FRANCE.holdingYearsMin.value}
          max={FRANCE.holdingYearsMax.value}
          step={1}
          unit="ans"
          inputWidth={70}
          onChange={(holdingYears) => onChange({ holdingYears })}
        />
      </div>
    </section>
  );
}
