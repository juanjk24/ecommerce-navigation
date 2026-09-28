import { ProductCard } from './ProductCard.jsx';

/**
 * Grilla paginada. El Iterator del motor entrega doce fichas por pagina, de
 * modo que la SPA nunca materializa 2.150 tarjetas en el DOM.
 */
export function ProductGrid({ result, onPage }) {
    if (!result) {
        return null;
    }

    if (result.items.length === 0) {
        return <p className="empty">Sin resultados para esta combinacion de categoria, texto y estrategia.</p>;
    }

    return (
        <div className="results">
            <div className="grid">
                {result.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            <nav className="pager" aria-label="Paginas de resultados">
                <button
                    className="button"
                    type="button"
                    onClick={() => onPage(result.page - 1)}
                    disabled={result.page === 0}
                >
                    Anterior
                </button>
                <span className="pager__label">
                    Pagina {result.page + 1} de {result.pages} · {result.hits} coincidencias
                </span>
                <button
                    className="button"
                    type="button"
                    onClick={() => onPage(result.page + 1)}
                    disabled={result.page + 1 >= result.pages}
                >
                    Siguiente
                </button>
            </nav>
        </div>
    );
}
