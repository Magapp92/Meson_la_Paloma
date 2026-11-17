import './inicio.css'

/* Portada: lo que se ve en la ruta / */
export default function Inicio() {
    return (
        /* En el main agrupamos todo el contenido principal de la página */
        <main>
            {/* Hero: el nombre del mesón en grande y a dos tonos */}
            <section className="Hero">
                <h1 className="Hero-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla,
                    aunque en pantalla cada parte vaya en su propia línea */}
                    Mesón{' '}
                    <span className="Hero-titleAccent">La Paloma</span>
                </h1>
            </section>
        </main>
    )
}
