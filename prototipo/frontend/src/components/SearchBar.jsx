import { useState } from 'react';

/** Buscador. El texto viaja al motor; el filtrado ocurre en Node.js. */
export function SearchBar({ value, onSearch, disabled }) {
    const [draft, setDraft] = useState(value);

    return (
        <form
            className="search"
            onSubmit={(event) => {
                event.preventDefault();
                onSearch(draft);
            }}
        >
            <input
                className="search__input"
                type="search"
                value={draft}
                placeholder="Buscar en el catalogo (por ejemplo: pro, sonyen, moda)"
                aria-label="Buscar productos"
                disabled={disabled}
                onChange={(event) => setDraft(event.target.value)}
            />
            <button className="button button--primary" type="submit" disabled={disabled}>
                Buscar
            </button>
        </form>
    );
}
