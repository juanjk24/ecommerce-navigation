import { useCallback, useEffect, useState } from 'react';

import { BenchmarkPanel } from './components/BenchmarkPanel.jsx';
import { Breadcrumb } from './components/Breadcrumb.jsx';
import { HistoryControls } from './components/HistoryControls.jsx';
import { ProductGrid } from './components/ProductGrid.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { StrategySelector } from './components/StrategySelector.jsx';
import { Taxonomy } from './components/Taxonomy.jsx';
import { getBenchmark, getCatalog, navigate, redo, undo } from './services/api.js';

/**
 * MareaShop — SPA React 19.
 *
 * La interfaz elige la Strategy y pide JSON al motor. Nunca recorre el arbol
 * ni instancia una clase de estrategia: esa frontera es la que garantiza el
 * criterio de modificabilidad del proyecto.
 */
function App() {
    const [tree, setTree] = useState(null);
    const [result, setResult] = useState(null);
    const [benchmark, setBenchmark] = useState(null);
    const [category, setCategory] = useState('');
    const [query, setQuery] = useState('');
    const [strategy, setStrategy] = useState('guided');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const run = useCallback(async (params) => {
        setBusy(true);
        setError(null);

        try {
            setResult(await navigate(params));
        } catch (cause) {
            setError(cause.message);
        } finally {
            setBusy(false);
        }
    }, []);

    // Carga inicial: taxonomia y primera pagina en un solo viaje. El setState
    // ocurre despues del await, no de forma sincrona dentro del efecto.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const [taxonomy, initial] = await Promise.all([
                    getCatalog(),
                    navigate({ category: '', q: '', strategy: 'guided', page: 0 })
                ]);

                if (!cancelled) {
                    setTree(taxonomy);
                    setResult(initial);
                }
            } catch (cause) {
                if (!cancelled) {
                    setError(cause.message);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const onSearch = (text) => {
        setQuery(text);
        run({ category, q: text, strategy, page: 0 });
    };

    const onStrategy = (next) => {
        setStrategy(next);
        run({ category, q: query, strategy: next, page: 0 });
    };

    const onSelectCategory = (next) => {
        setCategory(next);
        run({ category: next, q: query, strategy, page: 0 });
    };

    const onPage = (next) => {
        run({ category, q: query, strategy, page: next });
    };

    const onHistory = async (action) => {
        setBusy(true);
        setError(null);

        try {
            const restored = await action();

            if (!restored) {
                return;
            }

            setResult(restored);
            setCategory(restored.category ?? '');
            setQuery(restored.q ?? '');
            setStrategy(restored.strategy);
        } catch (cause) {
            setError(cause.message);
        } finally {
            setBusy(false);
        }
    };

    const onBenchmark = async () => {
        setBusy(true);

        try {
            setBenchmark(await getBenchmark());
        } catch (cause) {
            setError(cause.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="app">
            <header className="app__header">
                <div>
                    <h1 className="app__title">MareaShop</h1>
                    <p className="app__subtitle">
                        Estrategias de navegacion sobre un catalogo Composite de {result ? result.scanned : '…'} items
                    </p>
                </div>
                <div className="app__controls">
                    <SearchBar value={query} onSearch={onSearch} disabled={busy} />
                    <StrategySelector value={strategy} onChange={onStrategy} disabled={busy} />
                </div>
            </header>

            {error && <p className="alert">{error}</p>}

            <div className="app__body">
                <div className="app__side">
                    <Taxonomy tree={tree} selected={category} onSelect={onSelectCategory} disabled={busy} />
                    <HistoryControls
                        history={result?.history}
                        onUndo={() => onHistory(undo)}
                        onRedo={() => onHistory(redo)}
                        disabled={busy}
                    />
                </div>

                <main className="app__main">
                    {result && (
                        <>
                            <Breadcrumb trail={result.breadcrumb} />
                            <dl className="metrics">
                                <div className="metrics__item">
                                    <dt>Coincidencias</dt>
                                    <dd>{result.hits}</dd>
                                </div>
                                <div className="metrics__item">
                                    <dt>Estrategia</dt>
                                    <dd>{result.strategy}</dd>
                                </div>
                                <div className="metrics__item">
                                    <dt>Tiempo</dt>
                                    <dd>{result.elapsedMs} ms</dd>
                                </div>
                                <div className="metrics__item">
                                    <dt>Nodos / items</dt>
                                    <dd>
                                        {result.visitedNodes} / {result.visitedItems}
                                    </dd>
                                </div>
                                <div className="metrics__item">
                                    <dt>Clics (guiada / plana)</dt>
                                    <dd>
                                        {result.clicks.guided} / {result.clicks.flat}
                                    </dd>
                                </div>
                            </dl>
                        </>
                    )}

                    <ProductGrid result={result} onPage={onPage} />
                    <BenchmarkPanel data={benchmark} onRefresh={onBenchmark} loading={busy} />
                </main>
            </div>
        </div>
    );
}

export default App;
