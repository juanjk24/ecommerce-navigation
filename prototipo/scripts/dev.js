/**
 * Arranque conjunto de la SPA y la API sin dependencias externas: en vez de
 * `concurrently`, este script lanza los dos procesos hijos y propaga las
 * senales. El prototipo se sostiene solo con Node.js, Express, React y Vite.
 */

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
    { name: 'api', color: '\u001b[36m', cwd: resolve(ROOT, 'server'), args: ['run', 'dev'] },
    { name: 'web', color: '\u001b[35m', cwd: resolve(ROOT, 'frontend'), args: ['run', 'dev'] }
];

const RESET = '\u001b[0m';
const children = targets.map(({ name, color, cwd, args }) => {
    // `detached` crea un grupo de procesos propio: al apagar el prototipo hay
    // que matar al grupo completo, porque `npm` envuelve a su vez a Vite y a la
    // API y no propaga la senal a los nietos.
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    const prefix = `${color}[${name}]${RESET} `;
    const pipe = (stream, out) => {
        stream.setEncoding('utf8');
        stream.on('data', (chunk) => out.write(chunk.split('\n').map((line) => (line ? prefix + line : line)).join('\n')));
    };

    pipe(child.stdout, process.stdout);
    pipe(child.stderr, process.stderr);
    child.on('exit', (code) => {
        process.stdout.write(`${prefix}terminado con codigo ${code}\n`);
        shutdown(code ?? 0);
    });

    return child;
});

let closing = false;

function shutdown(code) {
    if (closing) {
        return;
    }

    closing = true;

    for (const child of children) {
        try {
            process.kill(-child.pid, 'SIGTERM');
        } catch {
            if (!child.killed) {
                child.kill('SIGTERM');
            }
        }
    }

    process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Vite escucha en `localhost` (IPv6 ::1 en macOS); la API acepta todas las
// interfaces. Se anuncia `localhost` porque 127.0.0.1 no responde en el puerto
// de la SPA.
console.log('MareaShop — SPA en http://localhost:5173 y API en http://localhost:5050');
