/** Historial de comandos: deshacer y rehacer el ultimo salto. */
export function HistoryControls({ history, onUndo, onRedo, disabled }) {
    const canUndo = history?.canUndo ?? false;
    const canRedo = history?.canRedo ?? false;
    const labels = history?.labels ?? [];

    return (
        <div className="history">
            <div className="history__buttons">
                <button className="button" type="button" onClick={onUndo} disabled={disabled || !canUndo}>
                    Deshacer
                </button>
                <button className="button" type="button" onClick={onRedo} disabled={disabled || !canRedo}>
                    Rehacer
                </button>
            </div>

            <ol className="history__list">
                {labels.length === 0 && <li className="history__empty">Sin saltos todavia</li>}
                {labels.map((label, index) => (
                    <li
                        key={`${label}-${index}`}
                        className={index === labels.length - 1 ? 'history__item history__item--current' : 'history__item'}
                    >
                        {label}
                    </li>
                ))}
            </ol>
        </div>
    );
}
