/** Migas de pan derivadas del Composite que devuelve el motor. */
export function Breadcrumb({ trail = [] }) {
    return (
        <nav className="breadcrumb" aria-label="Ruta de navegacion">
            {trail.map((step, index) => (
                <span key={step} className="breadcrumb__step">
                    {index > 0 && <span className="breadcrumb__sep" aria-hidden="true">›</span>}
                    <span className={index === trail.length - 1 ? 'breadcrumb__current' : undefined}>{step}</span>
                </span>
            ))}
        </nav>
    );
}
