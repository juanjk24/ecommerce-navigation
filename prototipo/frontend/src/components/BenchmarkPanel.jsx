/**
 * Panel de benchmark: evidencia del patron Observer. Muestra la comparacion
 * que el motor mide en vivo, servida por GET /api/benchmark.
 */
export function BenchmarkPanel({ data, onRefresh, loading }) {
    if (!data) {
        return (
            <section className="benchmark">
                <h2 className="benchmark__title">Benchmark de estrategias</h2>
                <button className="button" type="button" onClick={onRefresh} disabled={loading}>
                    {loading ? 'Midiendo…' : 'Ejecutar comparacion'}
                </button>
            </section>
        );
    }

    return (
        <section className="benchmark">
            <div className="benchmark__head">
                <h2 className="benchmark__title">Benchmark de estrategias</h2>
                <button className="button" type="button" onClick={onRefresh} disabled={loading}>
                    Volver a medir
                </button>
            </div>

            <p className="benchmark__summary">
                Aceleracion de <strong>{data.speedup}x</strong> frente al barrido lineal · reduccion de clics{' '}
                <strong>{data.clickReduction}</strong> · catalogo de {data.catalog.products} productos
            </p>

            <table className="benchmark__table">
                <thead>
                    <tr>
                        <th>Escenario</th>
                        <th>Hits</th>
                        <th>Tiempo</th>
                        <th>Recorrido</th>
                    </tr>
                </thead>
                <tbody>
                    {data.scenarios.map((row) => (
                        <tr key={row.id}>
                            <td>{row.label}</td>
                            <td className="benchmark__hits">{row.hits}</td>
                            <td>{row.elapsedMs.toFixed(4)} ms</td>
                            <td className="benchmark__route">
                                {row.strategy === 'NaiveScanStrategy' ? 'barrido completo' : row.breadcrumb.join(' › ')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {data.traces.length > 0 && (
                <>
                    <h3 className="benchmark__subtitle">Ultimos eventos observados</h3>
                    <ul className="benchmark__traces">
                        {data.traces.slice(-5).map((trace, index) => (
                            <li key={`${trace.at}-${index}`}>
                                <code>{trace.event}</code> {trace.strategy} · {trace.hits} hits · {trace.elapsedMs} ms
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}
