/**
 * MareaShop — Strategy, Iterator, Observer y Command.
 *
 * NavigationStrategy aisla el algoritmo de recorrido: el motor invoca
 * `traverse()` y el algoritmo cambia desde el selector de la SPA sin que
 *NavigationEngine ni el catalogo sepan que clase concreta se esta usando.
 */

import { familyOf } from './catalog.js';

export const PAGE_SIZE = 12;

export const STRATEGIES = {
    guided: 'GuidedStrategy',
    bfs: 'BreadthFirstStrategy',
    dfs: 'DepthFirstStrategy',
    naive: 'NaiveScanStrategy'
};

/* ------------------------------------------------------------------ Strategy */

export class NavigationStrategy {
    get name() {
        throw new Error('name() debe ser implementado');
    }

    /**
     * Recorre el catalogo y devuelve el subarbol de trabajo.
     * @returns {{items: object[], visitedNodes: number, visitedItems: number, route: string}}
     */
    traverse() {
        throw new Error('traverse() debe ser implementado');
    }
}

/** Linea base: barre el inventario completo sin contexto de rama. */
export class NaiveScanStrategy extends NavigationStrategy {
    get name() {
        return STRATEGIES.naive;
    }

    traverse({ root }) {
        return {
            items: root.products(),
            visitedNodes: 0,
            route: 'barrido completo'
        };
    }
}

/** Recorta el espacio de busqueda a la rama del objetivo. */
export class GuidedStrategy extends NavigationStrategy {
    get name() {
        return STRATEGIES.guided;
    }

    traverse({ root, target }) {
        if (!target) {
            return new NaiveScanStrategy().traverse({ root });
        }

        return {
            items: target.products(),
            visitedNodes: target.path.length,
            route: target.path.join(' > ')
        };
    }
}

/** Explora el arbol por niveles desde la familia que contiene el objetivo. */
export class BreadthFirstStrategy extends NavigationStrategy {
    get name() {
        return STRATEGIES.bfs;
    }

    traverse({ root, target }) {
        if (!target) {
            return new NaiveScanStrategy().traverse({ root });
        }

        const start = familyOf(target);
        const items = [];
        const queue = [start];
        let visitedNodes = 0;

        while (queue.length > 0) {
            const node = queue.shift();
            visitedNodes += 1;

            for (const child of node.children) {
                if (child.isTaxonomyNode) {
                    queue.push(child);
                    continue;
                }

                items.push(child);
            }
        }

        return { items, visitedNodes, route: start.path.join(' > ') };
    }
}

/** Agota una rama en profundidad desde la familia que contiene el objetivo. */
export class DepthFirstStrategy extends NavigationStrategy {
    get name() {
        return STRATEGIES.dfs;
    }

    traverse({ root, target }) {
        if (!target) {
            return new NaiveScanStrategy().traverse({ root });
        }

        const start = familyOf(target);
        const items = [];
        let visitedNodes = 0;

        const descend = (node) => {
            visitedNodes += 1;

            for (const child of node.children) {
                if (child.isTaxonomyNode) {
                    descend(child);
                    continue;
                }

                items.push(child);
            }
        };

        descend(start);

        return { items, visitedNodes, route: start.path.join(' > ') };
    }
}

/** Alias aceptado -> clase. Permite pedir `bfs`, `BFS` o `BreadthFirstStrategy`. */
const STRATEGY_ALIASES = {
    guided: GuidedStrategy,
    breadth: BreadthFirstStrategy,
    breadthfirst: BreadthFirstStrategy,
    bfs: BreadthFirstStrategy,
    depth: DepthFirstStrategy,
    depthfirst: DepthFirstStrategy,
    dfs: DepthFirstStrategy,
    naive: NaiveScanStrategy,
    naivescan: NaiveScanStrategy,
    linearscan: NaiveScanStrategy
};

export function resolveStrategy(key) {
    const wanted = String(key ?? '')
        .toLowerCase()
        .replace('strategy', '')
        .replace(/[^a-z]/g, '');

    return STRATEGY_ALIASES[wanted] ?? GuidedStrategy;
}

export function createStrategy(key) {
    return new (resolveStrategy(key))();
}

/* ------------------------------------------------------------------ Iterator */

/**
 * Entrega paginas de doce items. Evita que la SPA materialize 2.150 tarjetas
 * en el DOM: el recorrido completo vive en el motor, no en el cliente.
 */
export class CatalogIterator {
    constructor(items, pageSize = PAGE_SIZE) {
        this.items = items;
        this.pageSize = pageSize;
        this.cursor = 0;
    }

    get total() {
        return this.items.length;
    }

    get pages() {
        return Math.max(1, Math.ceil(this.items.length / this.pageSize));
    }

    hasNext() {
        return this.cursor + 1 < this.pages;
    }

    nextPage() {
        const page = this.page(this.cursor);
        this.cursor = this.hasNext() ? this.cursor + 1 : this.cursor;

        return page;
    }

    page(index) {
        const safeIndex = Math.min(Math.max(index, 0), this.pages - 1);
        const start = safeIndex * this.pageSize;

        return {
            index: safeIndex,
            pageSize: this.pageSize,
            pages: this.pages,
            total: this.total,
            items: this.items.slice(start, start + this.pageSize)
        };
    }

    *[Symbol.iterator]() {
        for (let index = 0; index < this.pages; index += 1) {
            yield this.page(index);
        }
    }
}

/* ------------------------------------------------------------------ Observer */

/**
 * Bus de eventos. El motor publica cada salto; la analitica, el benchmark y la
 * SPA se suscriben. Ningun suscriptor conoce al motor.
 */
export class EventBus {
    #listeners = new Map();

    subscribe(event, listener) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }

        this.#listeners.get(event).add(listener);

        return () => this.#listeners.get(event)?.delete(listener);
    }

    emit(event, payload) {
        for (const listener of this.#listeners.get(event) ?? []) {
            listener(payload);
        }

        return payload;
    }

    /** Bitacora observable que alimenta GET /api/benchmark. */
    record(event, payload) {
        const trace = { event, at: new Date().toISOString(), ...payload };
        this.#listeners.get('trace')?.forEach((listener) => listener(trace));

        return trace;
    }
}

/* ------------------------------------------------------------------ Command */

export const NAVIGATE = 'navigate';

/**
 * Cada salto es un objeto deshacible: guarda los parametros del recorrido y la
 * etiqueta que ve la persona. La pila decide que comando queda en cima.
 */
export class NavigationCommand {
    constructor({ category, q, strategy }) {
        this.label = `${NAVIGATE} · ${category}`;
        this.params = { category, q, strategy };
    }
}

/** Pila de comandos con soporte de deshacer y rehacer. */
export class CommandHistory {
    #undoStack = [];
    #redoStack = [];

    get labels() {
        return this.#undoStack.map((command) => command.label);
    }

    get canUndo() {
        return this.#undoStack.length > 1;
    }

    get canRedo() {
        return this.#redoStack.length > 0;
    }

    get top() {
        return this.#undoStack[this.#undoStack.length - 1] ?? null;
    }

    push(command) {
        this.#undoStack.push(command);
        this.#redoStack = [];
    }

    undo() {
        if (!this.canUndo) {
            return null;
        }

        this.#redoStack.push(this.#undoStack.pop());

        return this.top;
    }

    redo() {
        if (!this.canRedo) {
            return null;
        }

        this.#undoStack.push(this.#redoStack.pop());

        return this.top;
    }
}
