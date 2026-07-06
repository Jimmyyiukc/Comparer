import type { ReactNode } from 'react';
import type { SourcedConstant } from '../config/france';

/** Annotation de source (nom + date) tirée de la config, jamais codée en dur. */
export function SourceBadge({ constant }: { constant: SourcedConstant<unknown> }) {
  const year = constant.asOf.slice(0, 4);
  const text = `${constant.sourceName} · ${year}`;
  if (!constant.sourceUrl) {
    return (
      <span className="source-badge" title={`${constant.sourceName} — donnée au ${constant.asOf}`}>
        {text}
      </span>
    );
  }
  return (
    <a
      className="source-badge"
      href={constant.sourceUrl}
      target="_blank"
      rel="noreferrer"
      title={`${constant.sourceName} — donnée au ${constant.asOf}`}
    >
      {text}
    </a>
  );
}

interface SliderFieldProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  source?: SourcedConstant<unknown>;
  /** largeur du champ numérique (les € larges vs les %) */
  inputWidth?: number;
}

/** Curseur + champ numérique synchronisés. */
export function SliderField({ label, value, min, max, step, unit, onChange, source, inputWidth }: SliderFieldProps) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        {source && <SourceBadge constant={source} />}
      </label>
      <div className="field-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={typeof label === 'string' ? label : undefined}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          style={inputWidth ? { width: inputWidth } : undefined}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: ReactNode;
  value: number;
  step?: number;
  min?: number;
  unit: string;
  onChange: (v: number) => void;
  source?: SourcedConstant<unknown>;
}

export function NumberField({ label, value, step = 1, min = 0, unit, onChange, source }: NumberFieldProps) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        {source && <SourceBadge constant={source} />}
      </label>
      <div className="field-row">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  source?: SourcedConstant<unknown>;
}

export function Toggle({ label, checked, onChange, source }: ToggleProps) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">
        <span>{label}</span>
        {source && <SourceBadge constant={source} />}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: ReactNode;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  source?: SourcedConstant<unknown>;
}

export function Segmented<T extends string>({ label, value, options, onChange, source }: SegmentedProps<T>) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">
        <span>{label}</span>
        {source && <SourceBadge constant={source} />}
      </span>
      <span className="seg" role="group">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}
