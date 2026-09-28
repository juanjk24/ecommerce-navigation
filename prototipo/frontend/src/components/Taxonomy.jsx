/**
 * Taxonomia Composite. La SPA recibe el arbol ya construido y solo lo dibuja:
 * no recorre el catalogo ni decide el algoritmo de recorrido.
 */
export function Taxonomy({ tree, selected = '', onSelect, disabled }) {
    if (!tree) {
        return <aside className="taxonomy taxonomy--loading">Cargando taxonomia…</aside>;
    }

    const renderBranch = (node, depth) => {
        const branch = node.path.slice(1).join('/');
        const isActive = branch === selected;

        return (
            <li key={branch} className="taxonomy__item">
                <button
                    className={isActive ? 'taxonomy__link taxonomy__link--active' : 'taxonomy__link'}
                    style={{ paddingLeft: `${0.75 + depth * 0.85}rem` }}
                    type="button"
                    disabled={disabled}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => onSelect(branch)}
                >
                    {node.name}
                    <span className="taxonomy__count">{node.products}</span>
                </button>

                {node.children.some((child) => child.children?.length) && (
                    <ul className="taxonomy__list">
                        {node.children.map((child) => renderBranch(child, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <aside className="taxonomy">
            <h2 className="taxonomy__title">Taxonomia</h2>
            <p className="taxonomy__hint">Elige una rama para recortar el espacio de busqueda.</p>
            <ul className="taxonomy__list">{tree.children.map((child) => renderBranch(child, 0))}</ul>
        </aside>
    );
}
