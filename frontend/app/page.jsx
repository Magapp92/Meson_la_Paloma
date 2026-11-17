import './inicio.css'

/* Portada: lo que se ve en la ruta / */
export default function Inicio() {
    return (
        <h1 className="Inicio-titulo">
            {/* El espacio separa las dos palabras para los lectores de pantalla,
            aunque en pantalla cada parte vaya en su propia línea */}
            Mesón{' '}
            <span className="Inicio-tituloAcento">La Paloma</span>
        </h1>
    )
}
