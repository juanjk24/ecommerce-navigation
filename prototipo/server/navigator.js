import { performance } from 'node:perf_hooks';

import { buildCatalog, CATALOG_EXPECTED, normalizeText } from './catalog.js';
import {
    CatalogIterator,
    CommandHistory,
    EventBus,
    NavigationCommand,
    PAGE_SIZE,
    STRATEGIES,
    createStrategy
} from './patterns.js';

/**
 * Clics que exige una navegacion plana frente a una ruta guiada.
 * La ruta guiada cuesta un clic por nivel que hay que descender; el barrido
 * plano obliga a localizar la categoria, paginar y abrir la ficha.
 */
export const FLAT_CLICKS = 6;
const FLAT_STEPS = [
    'Abrir el catalogo completo',
    'Buscar la categoria en el listado',
    'Recorrer paginas hasta encontrarla',
    'Aplicar el filtro de texto',
    'Abrir la ficha del producto',
    'Volver al listado de resultados'
];

export function guidedClicks(breadcrumb) {
    return Math.max(0, breadcrumb.length - 1);
}

/** Escenarios de la Tabla 5 del informe. */
export const SCENARIOS = [
    { id: 'naive-portatiles', label: 'Naive, portátiles + pro', strategy: 'naive', category: 'portatiles', q: 'pro', hits: 15, scope: '2150 ítems' },
    { id: 'guided-portatiles', label: 'Guided, portátiles + pro', strategy: 'guided', category: 'portatiles', q: 'pro', hits: 15, scope: '4 nodos' },
    { id: 'bfs-audio', label: 'BFS, audio + sonyen', strategy: 'bfs', category: 'electronica/audio', q: 'sonyen', hits: 50, scope: 'rama Audio' },
    { id: 'dfs-moda', label: 'DFS, moda', strategy: 'dfs', category: 'moda', q: 'moda', hits: 300, scope: 'rama Moda' },
    { id: 'guided-tecnologia', label: 'Guided, libros tecnología', strategy: 'guided', category: 'libros/tecnologia', q: 'tecnología', hits: 150, scope: 'rama Tecnología' }
];

export class NavigationEngine {
    constructor({ root = buildCatalog(), pageSize = PAGE_SIZE } = {}) {
        this.root = root;
        this.pageSize = pageSize;
        this.events = new EventBus();
        this.history = new CommandHistory();
        this.traces = [];

        this.events.subscribe('trace', (trace) => {
            this.traces.push(trace);

            if (this.traces.length > 200) {
                this.traces.shift();
            }
        });
    }

    get catalogSummary() {
        return {
            products: this.root.products().length,
            taxonomyNodes: this.root.nodeCount,
            leaves: this.root.leafCount,
            families: this.root.children.length,
            expected: CATALOG_EXPECTED
        };
    }

    taxonomy() {
        return this.root.toJSON();
    }

    /**
     * Recorre el catalogo con la estrategia indicada, filtra por texto y pagina
     * con el Iterator. Publica `navigated` con el tiempo y los nodos visitados.
     */
    run({ category = '', q = '', strategy = 'guided', page = 0, record = true } = {}) {
        const target = category ? this.root.find(category) : null;
        const activeStrategy = createStrategy(strategy);
        const started = performance.now();

        const { items, visitedNodes, route } = activeStrategy.traverse({ root: this.root, target });
        const query = normalizeText(q);
        const matches = items.filter((item) => item.matches(query));
        const elapsedMs = performance.now() - started;

        const iterator = new CatalogIterator(matches, this.pageSize);
        const slice = iterator.page(Number(page) || 0);

        const result = {
            strategy: activeStrategy.name,
            category: category || null,
            q: q || null,
            route,
            breadcrumb: target ? target.path : [this.root.name],
            scanned: items.length,
            visitedNodes,
            visitedItems: items.length,
            hits: matches.length,
            elapsedMs: Number(elapsedMs.toFixed(4)),
            page: slice.index,
            pageSize: slice.pageSize,
            pages: slice.pages,
            items: slice.items.map((item) => item.toJSON()),
            clicks: {
                flat: FLAT_CLICKS,
                guided: guidedClicks(target ? target.path : [this.root.name]),
                flatSteps: FLAT_STEPS
            }
        };

        if (record) {
            this.history.push(new NavigationCommand({ category: category || 'inicio', q, strategy: activeStrategy.name }));
        }

        this.events.record('navigated', {
            strategy: result.strategy,
            category: result.category,
            q: result.q,
            hits: result.hits,
            visitedNodes: result.visitedNodes,
            visitedItems: result.visitedItems,
            elapsedMs: result.elapsedMs
        });
        this.events.emit('navigated', result);

        return result;
    }

    undo() {
        const command = this.history.undo();

        if (!command) {
            return null;
        }

        return this.#restore(command);
    }

    redo() {
        const command = this.history.redo();

        if (!command) {
            return null;
        }

        return this.#restore(command);
    }

    get historyView() {
        return {
            labels: this.history.labels,
            canUndo: this.history.canUndo,
            canRedo: this.history.canRedo
        };
    }

    /** Repite la suite de la Tabla 5 y devuelve los tiempos medidos. */
    benchmark() {
        return SCENARIOS.map((scenario) => {
            const result = this.run({ ...scenario, record: false });

            return {
                id: scenario.id,
                label: scenario.label,
                strategy: result.strategy,
                hits: result.hits,
                expectedHits: scenario.hits,
                elapsedMs: result.elapsedMs,
                scope: scenario.scope,
                visitedNodes: result.visitedNodes,
                visitedItems: result.visitedItems,
                route: result.route,
                breadcrumb: result.breadcrumb
            };
        });
    }

    /** Repite una medicion para obtener una razon estable entre estrategias. */
    measure({ strategy, category, q }, repetitions = 40) {
        for (let index = 0; index < 5; index += 1) {
            this.run({ strategy, category, q, record: false });
        }

        const samples = [];

        for (let index = 0; index < repetitions; index += 1) {
            samples.push(this.run({ strategy, category, q, record: false }).elapsedMs);
        }

        samples.sort((a, b) => a - b);

        return samples[Math.floor(samples.length / 2)];
    }

    #restore(command) {
        const result = this.run({ ...command.params, record: false });
        this.events.record('restored', { command: command.label });

        return { ...result, restored: command.label, history: this.historyView };
    }
}

export { STRATEGIES };
