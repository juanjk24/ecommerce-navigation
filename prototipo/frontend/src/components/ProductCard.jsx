const currency = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

/** Ficha de producto. Solo muestra la pagina que entrega el Iterator. */
export function ProductCard({ product }) {
    return (
        <article className="card">
            <header className="card__head">
                <h3 className="card__name">{product.name}</h3>
                <span className="card__brand">{product.brand}</span>
            </header>
            <p className="card__description">{product.description}</p>
            <footer className="card__foot">
                <span className="card__price">{currency.format(product.price)}</span>
                <span className={product.stock > 0 ? 'card__stock' : 'card__stock card__stock--out'}>
                    {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                </span>
            </footer>
        </article>
    );
}
