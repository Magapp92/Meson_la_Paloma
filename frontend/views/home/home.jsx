
import { Button } from '@components/button/button.jsx'
import './home.css'

/* Portada de la web: lo que se ve en la ruta / */
export const Home = () => {

    return (
        <main>
            {/* En la sección hero agrupamos el nombre del mesón en grande y a dos tonos
            y los botones para reservar y ver la carta */}
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
