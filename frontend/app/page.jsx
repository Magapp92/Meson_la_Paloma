import { Button } from '@components/button/button.jsx'
import './home.css'

/* Portada: lo que se ve en la ruta / */
export default function Home() {
    return (
        /* En el main agrupamos todo el contenido principal de la página */
        <main>
            {/* Hero: el nombre del mesón en grande y a dos tonos, y los botones para reservar y ver la carta */}
            <section className="Hero">
                <h1 className="Hero-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla,
                    aunque en pantalla cada parte vaya en su propia línea */}
                    Mesón{' '}
                    <span className="Hero-titleAccent">La Paloma</span>
                </h1>
                <div className="Hero-actions">
                    <Button href="/reservar" title="Ir a reservar mesa">Reservar mesa</Button>
                    <Button href="/carta" variant="ghost" title="Ir a la carta">Ver la carta</Button>
                </div>
            </section>
        </main>
    )
}
