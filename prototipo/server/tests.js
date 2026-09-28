/**
 * MareaShop — Pruebas del prototipo.
 *
 * `npm test` ejecuta estas seis aserciones sobre el mismo codigo que atiende
 * GET /api/navigate y escribe prototipo/results.json con la evidencia.
 *
 * Las aserciones comprueban invariantes y razones, no milisegundos absolutos:
 * los tiempos dependen de la maquina, la relacion entre recortar la rama y
 * barrer el universo es el argumento de diseño que sí se sostiene.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATALOG_EXPECTED } from './catalog.js';
import { STRATEGIES } from './patterns.js';
import { FLAT_CLICKS, NavigationEngine, SCENARIOS, guidedClicks } from './navigator.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(HERE, '..', 'results.json');
const MIN_SPEEDUP = 5;

const engine = new NavigationEngine();
const assertions = [];

function assert(id, name, expectations) {
    const failures = expectations.filter((expectation) => !expectation.pass);

    assertions.push({
        id,
        name,
        pass: failures.length === 0,
        checks: expectations.map(({ label, expected, actual, pass }) => ({ label, expected, actual, pass }))
    });

    return failures.length === 0;
}

const eq = (label, actual, expected) => ({ label, actual, expected, pass: Object.is(actual, expected) });
const atLeast = (label, actual, minimum) => ({ label, actual, expected: `>= ${minimum}`, pass: actual >= minimum });

/* 1. Catalogo: forma del Composite. */
const summary = engine.catalogSummary;
assert('catalogo', 'El catalogo tiene la forma que exige la actividad', [
    eq('productos', summary.products, CATALOG_EXPECTED.products),
    eq('nodos de taxonomia', summary.taxonomyNodes, CATALOG_EXPECTED.taxonomyNodes),
    eq('hojas terminales', summary.leaves, CATALOG_EXPECTED.leaves),
    eq('familias', summary.families, CATALOG_EXPECTED.families)
]);

/* 2. Aceleracion: Guided recorta la rama frente al barrido lineal. */
const naiveMs = engine.measure({ strategy: 'naive', category: 'portatiles', q: 'pro' });
const guidedMs = engine.measure({ strategy: 'guided', category: 'portatiles', q: 'pro' });
const speedup = Number((naiveMs / guidedMs).toFixed(2));
assert('aceleracion', 'Guided es varias veces mas rapido que el barrido lineal', [
    atLeast('razon naive/guided', speedup, MIN_SPEEDUP)
]);

/* 3. Nodos: la ruta guiada visita cuatro nodos, el barrido los 2.150 items. */
const guidedRun = engine.run({ strategy: 'guided', category: 'portatiles', q: 'pro', record: false });
const naiveRun = engine.run({ strategy: 'naive', category: 'portatiles', q: 'pro', record: false });
assert('nodos', 'La ruta guiada visita menos nodos que el inventario completo', [
    eq('nodos visitados (guided)', guidedRun.visitedNodes, 4),
    eq('items barridos (naive)', naiveRun.visitedItems, CATALOG_EXPECTED.products),
    eq('items en la rama guiada', guidedRun.visitedItems, 250)
]);

/* 4. Hits: los cinco escenarios de la Tabla 5. */
const rows = SCENARIOS.map((scenario) => {
    const result = engine.run({ ...scenario, record: false });

    return { label: scenario.label, actual: result.hits, expected: scenario.hits };
});
assert('hits', 'Cada escenario devuelve los hits de la Tabla 5', rows.map((row) => eq(row.label, row.actual, row.expected)));

/* 5. Clics: la ruta guiada reduce los clics de la navegacion plana. */
const guidedClicksUsed = guidedClicks(guidedRun.breadcrumb);
const clickReduction = Math.round((1 - guidedClicksUsed / FLAT_CLICKS) * 100);
assert('clics', 'La ruta guiada reduce a la mitad los clics de la navegacion plana', [
    eq('clics guiados', guidedClicksUsed, 3),
    eq('reduccion', `${clickReduction} %`, '50 %')
]);

/* 6. Undo: el historial restaura el comando anterior. */
const undoEngine = new NavigationEngine();
undoEngine.run({ strategy: 'guided', category: 'electronica' });
undoEngine.run({ strategy: 'guided', category: 'portatiles' });
const restored = undoEngine.undo();
const undone = undoEngine.history.labels.at(-1);
assert('undo', 'POST /api/undo restaura el comando navigate · electronica', [
    eq('etiqueta restaurada', undone, 'navigate · electronica'),
    eq('categoria restaurada', restored?.category, 'electronica')
]);

/* ------------------------------------------------------------------ Reporte */

const scenarios = engine.benchmark();
const passed = assertions.filter((entry) => entry.pass).length;

const report = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    catalog: engine.catalogSummary,
    speedup: { naiveMs, guidedMs, ratio: speedup, minimum: MIN_SPEEDUP },
    clickReduction: { guided: guidedClicksUsed, flat: FLAT_CLICKS, percent: clickReduction },
    scenarios,
    assertions,
    summary: { total: assertions.length, passed, failed: assertions.length - passed }
};

await writeFile(RESULTS_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('MareaShop — resultados de la prueba\n');
console.log(`  Catalogo   ${summary.products} productos · ${summary.taxonomyNodes} nodos · ${summary.leaves} hojas · ${summary.families} familias`);
console.log(`  Guided     ${guidedMs.toFixed(4)} ms sobre ${guidedRun.visitedItems} items (${guidedRun.visitedNodes} nodos)`);
console.log(`  Naive      ${naiveMs.toFixed(4)} ms sobre ${naiveRun.visitedItems} items`);
console.log(`  Aceleracion ${speedup}x (minimo exigido ${MIN_SPEEDUP}x)\n`);

console.log('  Escenario                      Hits    Tiempo      Recorrido');
for (const row of scenarios) {
    const route = row.strategy === STRATEGIES.naive ? 'barrido completo' : row.breadcrumb.join(' > ');

    console.log(
        `  ${row.label.padEnd(30)} ${String(row.hits).padStart(4)}  ${row.elapsedMs.toFixed(4).padStart(8)} ms  ${route}`
    );
}

console.log('\n  Aserciones');
for (const entry of assertions) {
    console.log(`  ${entry.pass ? 'PASS' : 'FALLA'}  ${entry.id.padEnd(12)} ${entry.name}`);

    for (const check of entry.checks) {
        console.log(`          ${check.pass ? 'ok  ' : 'x   '} ${check.label}: ${check.actual} (esperado ${check.expected})`);
    }
}

console.log(`\n  ${passed} de ${assertions.length} aserciones PASS`);
console.log(`  Evidencia escrita en ${RESULTS_PATH}\n`);

process.exitCode = passed === assertions.length ? 0 : 1;
