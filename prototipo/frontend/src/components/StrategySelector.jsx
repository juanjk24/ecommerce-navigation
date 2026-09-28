/** Selector de Strategy: cambiar el algoritmo sin recargar el catalogo. */
import { STRATEGY_OPTIONS } from '../services/api.js';

export function StrategySelector({ value, onChange, disabled }) {
    return (
        <label className="field">
            <span className="field__label">Ordenar por</span>
            <select
                className="field__control"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            >
                {STRATEGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
