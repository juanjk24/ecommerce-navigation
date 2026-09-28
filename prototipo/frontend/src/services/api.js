/**
 * Cliente de la API de MareaShop.
 *
 * La SPA no conoce el catalogo ni las clases de estrategia: solo consume JSON
 * con breadcrumb, hits, elapsedMs, visitedNodes e historial. Vite proxifica
 * /api hacia el puerto 5050, de modo que el navegador no enfrenta un problema
 * de origen cruzado durante la demostracion.
 */

const API_URL = '/api';

async function request(path, options) {
    const response = await fetch(`${API_URL}${path}`, options);

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? `Error en ${path} (${response.status})`);
    }

    return response.json();
}

export function getCatalog() {
    return request('/catalog');
}

export function navigate({ category = '', q = '', strategy = 'guided', page = 0 }) {
    const params = new URLSearchParams({ category, q, strategy, page: String(page) });

    return request(`/navigate?${params}`);
}

export function undo() {
    return request('/undo', { method: 'POST' });
}

export function redo() {
    return request('/redo', { method: 'POST' });
}

export function getBenchmark() {
    return request('/benchmark');
}

export const STRATEGY_OPTIONS = [
    { value: 'guided', label: 'Ruta guiada' },
    { value: 'bfs', label: 'BFS (por niveles)' },
    { value: 'dfs', label: 'DFS (en profundidad)' },
    { value: 'naive', label: 'Barrido lineal' }
];
