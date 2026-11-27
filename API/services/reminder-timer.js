
/* El temporizador de los recordatorios: mientras la API está encendida, busca cada hora los avisos que toca enviar.
La primera búsqueda es al arrancar, así salen enseguida los que quedaron pendientes si la API estuvo apagada */
const { connect } = require( '../config/db' )
const { sendDueReminders } = require( './reminders' )

const HOUR_MS = 60 * 60 * 1000

/* Arranca el temporizador. Las opciones solo se cambian en los tests:
- run: la función que envía los avisos (por defecto, conectar con Mongo y sendDueReminders).
- intervalMs: cada cuánto se ejecuta (por defecto, una hora).
Devuelve una función para pararlo */
const startReminderTimer = ({ run = runReminders, intervalMs = HOUR_MS } = {}) => {
    /* ¿Hay una ejecución en marcha? Si la anterior aún no ha terminado (Mongo va lento, por ejemplo),
    no empezamos otra encima: esperamos a la siguiente hora */
    let running = false

    const tick = async () => {
        if ( running ) return
        running = true

        try {
            await run()
        } catch ( error ) {
            /* Un fallo (sin conexión con Mongo, por ejemplo) no para el temporizador: se reintenta en la siguiente hora */
            console.error( 'No se han podido revisar los recordatorios:', error.message )
        } finally {
            running = false
        }
    }

    tick()
    const timer = setInterval( tick, intervalMs )

    return () => clearInterval( timer )
}

/* Una ejecución normal: conecta (o reutiliza la conexión abierta) y envía los avisos que tocan.
En la consola solo apuntamos cuántos, nunca los datos de los clientes */
const runReminders = async () => {
    await connect()
    const { sent, skipped, failed } = await sendDueReminders()

    if ( sent || skipped || failed ) {
        console.log( `Recordatorios: ${ sent } enviados, ${ skipped } sin enviar por reserva tardía, ${ failed } fallidos` )
    }
}

/* Exportamos el temporizador para index.js */
module.exports = {
    startReminderTimer
}
