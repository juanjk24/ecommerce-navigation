/**
 * MareaShop — Catalogo como patron Composite.
 *
 * CatalogComponent es la abstraccion comun; CategoryNode agrupa hijos y
 * ProductLeaf representa el item vendible. `products()` y `find()` recorren el
 * arbol con la misma API, tanto para una familia como para una hoja.
 */

const ROOT_NAME = 'Inicio';

export const CATALOG_EXPECTED = {
    products: 2150,
    taxonomyNodes: 18,
    leaves: 12,
    families: 5,
    seed: 20260928
};

export function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

export class CatalogComponent {
    constructor(name) {
        this.name = name;
        this.parent = null;
    }

    get key() {
        return normalizeText(this.name);
    }

    /** Ruta desde Inicio hasta este nodo, inclusiva. */
    get path() {
        const names = [];
        let node = this;

        while (node) {
            names.unshift(node.name);
            node = node.parent;
        }

        return names;
    }

    get depth() {
        return this.path.length - 1;
    }

    get isLeaf() {
        return false;
    }

    get children() {
        return [];
    }

    /** Nodos de taxonomia que cuelgan de este nodo, sin contarse a si mismo. */
    get nodeCount() {
        return 0;
    }

    /** Hojas terminales de la taxonomia que cuelgan de este nodo. */
    get leafCount() {
        return 0;
    }

    /** Un producto vendible no es un nodo de taxonomia. */
    get isTaxonomyNode() {
        return false;
    }

    /** Texto por el que se filtra un producto. */
    get haystack() {
        return this.name;
    }

    matches(query) {
        if (!query) {
            return true;
        }

        return normalizeText(this.haystack).includes(normalizeText(query));
    }

    add() {
        throw new Error('add() debe ser implementado por las subclases');
    }

    products() {
        throw new Error('products() debe ser implementado por las subclases');
    }

    find() {
        throw new Error('find() debe ser implementado por las subclases');
    }
}

export class ProductLeaf extends CatalogComponent {
    constructor(name, { description = '', brand = '', price = 0, stock = 0, id = 0 } = {}) {
        super(name);
        this.id = id;
        this.description = description;
        this.brand = brand;
        this.price = price;
        this.stock = stock;
    }

    get isLeaf() {
        return true;
    }

    get haystack() {
        return `${this.name} ${this.brand} ${this.description}`;
    }

    products() {
        return [this];
    }

    find(query) {
        return this.#search(normalizeText(query)) ?? null;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            brand: this.brand,
            description: this.description,
            price: this.price,
            stock: this.stock
        };
    }

    #search(key) {
        if (key.length === 0 || this.key === key) {
            return this;
        }

        for (const child of this.children) {
            const found = child.find(key);

            if (found) {
                return found;
            }
        }

        return null;
    }
}

export class CategoryNode extends CatalogComponent {
    constructor(name) {
        super(name);
        this._children = [];
    }

    get children() {
        return this._children;
    }

    add(child) {
        child.parent = this;
        this._children.push(child);

        return this;
    }

    products() {
        const items = [];

        for (const child of this._children) {
            items.push(...child.products());
        }

        return items;
    }

    /**
     * Busca por nombre en todo el subarbol, o desciende por ruta cuando la
     * consulta trae segmentos separados por `/` (por ejemplo `libros/tecnologia`).
     */
    find(query) {
        const path = String(query ?? '')
            .split('/')
            .map(normalizeText)
            .filter(Boolean);

        if (path[0] === normalizeText(ROOT_NAME)) {
            path.shift();
        }

        if (path.length === 0) {
            return this;
        }

        return path.length === 1 ? this.#search(path[0]) : this.#descend(path);
    }

    get isTaxonomyNode() {
        return true;
    }

    /** Nodo terminal: todos sus hijos son productos, no categorias. */
    get isTerminal() {
        return this._children.length > 0 && this._children.every((child) => child.isLeaf);
    }

    /** Nodos de taxonomia que cuelgan de este nodo, sin contarse a si mismo. */
    get nodeCount() {
        return this._children.reduce(
            (total, child) => total + (child.isTaxonomyNode ? 1 : 0) + child.nodeCount,
            0
        );
    }

    get leafCount() {
        if (this.isTerminal) {
            return 1;
        }

        return this._children.reduce((total, child) => total + child.leafCount, 0);
    }

    toJSON() {
        return {
            name: this.name,
            path: this.path,
            products: this.products().length,
            children: this._children.map((child) => child.toJSON())
        };
    }

    #search(key) {
        if (this.key === key) {
            return this;
        }

        for (const child of this._children) {
            const found = child.find(key);

            if (found) {
                return found;
            }
        }

        return null;
    }

    #descend(path) {
        const [head, ...rest] = path;
        const next = this._children.find((child) => child.key === head);

        if (!next) {
            return null;
        }

        return rest.length === 0 ? next : next.find(rest.join('/'));
    }
}

const BRANDS = ['Aurora', 'Delta', 'Norte', 'Vega', 'Cima', 'Rumbo', 'Trigo', 'Onda'];

/**
 * Vocabulario por hoja. El contenido se controla de forma deliberada para que
 * las consultas de la Tabla 5 devuelvan conteos reproducibles:
 *   - "pro"       -> 15 coincidencias, todas en Portatiles.
 *   - "sonyen"    -> 50 coincidencias, todas en Audio.
 *   - "tecnologia"-> 150 coincidencias, todas en Tecnologia.
 *   - "moda"      -> 300 coincidencias, todas en la familia Moda.
 * Ninguna palabra del resto del catalogo contiene la secuencia "pro".
 */
const LEAVES = {
    Portatiles: {
        size: 250,
        nouns: ['Portátil', 'Notebook', 'Ultrabook', 'Portable'],
        adjectives: ['Liviano', 'Ligero', 'Empresarial', 'Estudiantil', 'Compacto', 'Avanzado'],
        description: (noun, index) =>
            `${noun} con pantalla de 15.6 pulgadas, memoria de 16 GB y batería de larga duración. Serie ${index}.`,
        series: (index) => (index < 15 ? 'Pro' : null)
    },
    Escritorio: {
        size: 150,
        nouns: ['Monitor', 'Torre', 'Silla', 'Escritorio', 'Lámpara'],
        adjectives: ['Ergonómico', 'Familiar', 'Mate', 'Compacto', 'Silencioso'],
        description: (noun) => `Elemento para espacio de trabajo con material resistente y acabado mate.`
    },
    Audio: {
        size: 200,
        nouns: ['Auriculares', 'Bocina', 'Micrófono', 'Amplificador', 'Parlante', 'Soundbar'],
        adjectives: ['Portátil', 'De Mesa', 'Inalámbrico', 'De Estudio', 'Compacto'],
        description: (noun) => `${noun} para audio de sala con conexión y control de volumen.`,
        every: 4,
        brand: 'Sonyen'
    },
    Celulares: {
        size: 200,
        nouns: ['Celular', 'Smartphone', 'Tablet', 'Smartwatch'],
        adjectives: ['Compacto', 'Básico', 'Avanzado', 'Familiar', 'Ligero'],
        description: (noun) => `${noun} con pantalla táctil, cámara de 48 megapíxeles y batería de día completo.`
    },
    Cocina: {
        size: 200,
        nouns: ['Olla', 'Sartén', 'Licuadora', 'Horno', 'Nevera', 'Freidora', 'Microondas', 'Batidora'],
        adjectives: ['Inox', 'Digital', 'Clásico', 'Compacto', 'Familiar'],
        description: (noun) => `Electrodoméstico de cocina con capacidad media y control de temperatura.`
    },
    Limpieza: {
        size: 150,
        nouns: ['Aspiradora', 'Lavadora', 'Plancha', 'Escoba', 'Detergente', 'Mopa'],
        adjectives: ['Silenciosa', 'Ergonómica', 'Ecológica', 'Compacta', 'Familiar'],
        description: (noun) => `Artículo de limpieza del hogar con bajo consumo y diseño compacto.`
    },
    Fitness: {
        size: 200,
        nouns: ['Bicicleta', 'Cinta', 'Pesa', 'Esterilla', 'Kit', 'Bola'],
        adjectives: ['Plegable', 'Ajustable', 'Digital', 'Liviano', 'Resistente'],
        description: (noun) => `Implemento de ejercicio para rutina diaria en casa.`
    },
    Ciclismo: {
        size: 150,
        nouns: ['Casco', 'Guantes', 'Lámpara', 'Candado', 'Bidón', 'Pedales'],
        adjectives: ['Ligero', 'Impermeable', 'Reflectante', 'Ajustable', 'Resistente'],
        description: (noun) => `Accesorio de ciclismo para rutas largas y clima variable.`
    },
    Ropa: {
        size: 150,
        nouns: ['Blusa', 'Camisa', 'Pantalón', 'Vestido', 'Sudadera', 'Falda'],
        adjectives: ['Urbana', 'Esencial', 'Veraniega', 'Formal'],
        description: (noun) => `Prenda de moda urbana en algodón con corte ajustado y costuras reforzadas.`
    },
    Calzado: {
        size: 150,
        nouns: ['Zapatos', 'Tenis', 'Botas', 'Sandalias', 'Zapatillas', 'Mocasines'],
        adjectives: ['Urbano', 'Esencial', 'Deportivo', 'Formal'],
        description: (noun) => `Calzado de moda para uso diario con suela cómoda y forro transpirable.`
    },
    Tecnologia: {
        size: 150,
        titles: [
            'Redes', 'Datos', 'Web', 'Sistemas', 'Interfaces', 'Bases de Datos',
            'Bases Relacionales', 'Algoritmos', 'Compiladores', 'Código', 'Servidores',
            'Auditoría', 'Cálculo', 'Estadísticas', 'Señales', 'Ópticas', 'Termodinámica',
            'Circuitos', 'Microelectrónica', 'Antenas', 'Fibras', 'Sistemas Embebidos',
            'Jerarquías de Memoria', 'Lógica', 'Conjuntos', 'Ecuaciones', 'Ciberseguridad',
            'Nube', 'Móvil', 'Accesibilidad'
        ],
        description: (title, volume) => `Manual de ${title.toLowerCase()} con ${volume} tomos y ejercicios de aplicación.`
    },
    Literatura: {
        size: 200,
        nouns: ['Novela', 'Ensayo', 'Cuento', 'Poesía', 'Crónica'],
        adjectives: ['Breve', 'Contemporánea', 'Clásica', 'De Autor'],
        description: (noun) => `Obra de ficción y ensayo con capítulos breves sobre la vida cotidiana.`
    }
};

const TREE = {
    Electronica: {
        Computadores: ['Portatiles', 'Escritorio'],
        Audio: null,
        Celulares: null
    },
    Hogar: { Cocina: null, Limpieza: null },
    Deportes: { Fitness: null, Ciclismo: null },
    Moda: { Ropa: null, Calzado: null },
    Libros: { Tecnologia: null, Literatura: null }
};

function createRandom(seed) {
    let state = seed >>> 0;

    return function random() {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Nombres visibles de la taxonomia. La busqueda ignora acentos, asi que la clave interna sigue en ASCII. */
const DISPLAY_NAMES = {
    Electronica: 'Electrónica',
    Portatiles: 'Portátiles',
    Tecnologia: 'Tecnología'
};

function buildLeaf(name, spec, context) {
    const { random, nextId } = context;
    const node = new CategoryNode(DISPLAY_NAMES[name] ?? name);

    for (let index = 0; index < spec.size; index += 1) {
        const model = `M-${String(index + 1).padStart(4, '0')}`;
        const brand = spec.every && index % spec.every === 0 ? spec.brand : BRANDS[index % BRANDS.length];

        if (spec.titles) {
            const title = spec.titles[index % spec.titles.length];
            const volume = Math.floor(index / spec.titles.length) + 1;

            node.add(
                new ProductLeaf(`Tecnología ${title} Vol. ${volume}`, {
                    id: nextId(),
                    brand,
                    description: spec.description(title, volume)
                })
            );
            continue;
        }

        const noun = spec.nouns[index % spec.nouns.length];
        const adjective = spec.adjectives[Math.floor(index / spec.nouns.length) % spec.adjectives.length];
        const series = spec.series ? spec.series(index) : null;
        const label = series
            ? `${noun} ${series} ${model}`
            : `${noun} ${adjective} ${model}`;

        node.add(
            new ProductLeaf(label, {
                id: nextId(),
                brand,
                description: spec.description(noun, index + 1),
                price: Math.round((80_000 + random() * 4_200_000) / 1000) * 1000,
                stock: 1 + Math.floor(random() * 40)
            })
        );
    }

    return node;
}

function buildBranch(name, children, context) {
    const node = new CategoryNode(DISPLAY_NAMES[name] ?? name);

    for (const [childName, grandchildren] of Object.entries(children)) {
        if (grandchildren) {
            const branch = new CategoryNode(childName);
            const leaves = Array.isArray(grandchildren) ? grandchildren : Object.keys(grandchildren);

            for (const leafName of leaves) {
                branch.add(buildLeaf(leafName, LEAVES[leafName], context));
            }

            node.add(branch);
            continue;
        }

        node.add(buildLeaf(childName, LEAVES[childName], context));
    }

    return node;
}

/** Construye el catalogo completo: 5 familias, 18 nodos de taxonomia, 12 hojas, 2.150 productos. */
export function buildCatalog({ seed = CATALOG_EXPECTED.seed } = {}) {
    const context = {
        random: createRandom(seed),
        nextId: (() => {
            let id = 0;
            return () => (id += 1);
        })()
    };

    const root = new CategoryNode(ROOT_NAME);

    for (const [familyName, children] of Object.entries(TREE)) {
        root.add(buildBranch(familyName, children, context));
    }

    return root;
}

/** Familia de primer nivel que contiene al nodo indicado. */
export function familyOf(node) {
    let current = node;

    while (current.parent && current.parent.parent) {
        current = current.parent;
    }

    return current;
}
