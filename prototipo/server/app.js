/**
 * MareaShop — API Express en el puerto 5050.
 *
 * Es un adaptador puro: traduce HTTP a llamadas del NavigationEngine. No
 * recorre el arbol, no filtra y no pagina. Todo eso vive en el motor, que es
 * lo que permite anadir una cuarta estrategia sin desplegar la SPA.
 */

import express from 'express';
import cors from 'cors';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATALOG_EXPECTED } from './catalog.js';
import { STRATEGIES } from './patterns.js';
import { FLAT_CLICKS, NavigationEngine, SCENARIOS } from './navigator.js';

export function createApp() {
    const app = express();
    const engine = new NavigationEngine();

    app.use(cors());
    app.use(express.json());

    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', service: 'MareaShop API', patterns: ['Composite', 'Strategy', 'Iterator', 'Observer', 'Command'] });
    });

    app.get('/api/catalog', (_req, res) => {
        res.json(engine.taxonomy());
    });

    app.get('/api/navigate', (req, res) => {
        const { category, q, strategy, page } = req.query;

        const result = engine.run({
            category: category ?? '',
            q: q ?? '',
            strategy: strategy ?? 'guided',
            page: Number(page) || 0
        });

        res.json({ ...result, history: engine.historyView });
    });

    app.post('/api/undo', (_req, res) => {
        const result = engine.undo();

        if (!result) {
            return res.status(409).json({ message: 'No hay un salto que deshacer' });
        }

        return res.json(result);
    });

    app.post('/api/redo', (_req, res) => {
        const result = engine.redo();

        if (!result) {
            return res.status(409).json({ message: 'No hay un salto que rehacer' });
        }

        return res.json(result);
    });

    /** Resumen de la comparacion de estrategias; evidencia del patron Observer. */
    app.get('/api/benchmark', (_req, res) => {
        const scenarios = engine.benchmark();
        const naive = scenarios.find((row) => row.strategy === STRATEGIES.naive);
        const guided = scenarios.find((row) => row.id === 'guided-portatiles');

        res.json({
            scenarios,
            speedup: naive && guided ? Number((naive.elapsedMs / guided.elapsedMs).toFixed(2)) : null,
            clickReduction: `${Math.round((1 - (guidedClicksFor(scenarios) / FLAT_CLICKS)) * 100)} %`,
            flatClicks: FLAT_CLICKS,
            expected: CATALOG_EXPECTED,
            catalog: engine.catalogSummary,
            traces: engine.traces.slice(-20)
        });
    });

    return { app, engine };
}

function guidedClicksFor(scenarios) {
    const guidedRow = scenarios.find((row) => row.id === 'guided-portatiles');

    return guidedRow ? Math.max(0, guidedRow.breadcrumb.length - 1) : 0;
}

export const PORT = 5050;

export { SCENARIOS };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const { app } = createApp();

    app.listen(PORT, () => {
        console.log(`MareaShop API en http://127.0.0.1:${PORT}`);
    });
}
