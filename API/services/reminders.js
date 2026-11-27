
/* Recordatorios por correo: unas 24 horas antes de cada reserva confirmada, un correo "Te esperamos mañana".
Aquí solo está la función que los envía; quien la llama cada cierto tiempo va aparte */
const { Reservation } = require( '../models' )
const { getMadridNow } = require( './madrid-time' )
const { sendEmailSafely } = require( './notifications' )
const { buildReminderMessage } = require( '../emails/reservation-emails' )

const DAY_MS = 24 * 60 * 60 * 1000

/* Un instante en hora de Madrid como un solo texto: 'AAAA-MM-DD HH:MM'.
Así se pueden comparar dos momentos como texto (con < y >): las dos partes van de mayor a menor
(año, mes, día, hora, minuto) y siempre con dos cifras, así que el orden del texto es el orden en el tiempo.
Es correcto porque todo lo que comparamos va en hora de Madrid */
const toMadridKey = instant => {
    const { date, time } = getMadridNow( instant )

    return `${ date } ${ time }`
}

/* El inicio de una reserva con el mismo formato: date y time ya se guardan en hora de Madrid */
const toReservationKey = reservation => `${ reservation.date } ${ reservation.time }`

/* ¿Se hizo o se modificó la reserva con menos de 24 horas de antelación?
updatedAt es la última vez que el cliente la guardó (al crearla o al modificarla): si desde ese momento
hasta su hora de inicio había menos de 24 horas, acaba de recibir el correo de confirmación o de modificación
y no le mandamos otro. Nuestras propias escrituras de reminderSent no cambian updatedAt (timestamps: false) */
const wasBookedLate = reservation =>
    toReservationKey( reservation ) < toMadridKey( new Date( reservation.updatedAt.getTime() + DAY_MS ) )

/* Envía los recordatorios que tocan ahora. now (opcional) es el instante "ahora": en los tests se pasa uno fijo.
Devuelve cuántos se han enviado (sent), cuántos se han dado por hechos sin enviar (skipped) y cuántos han fallado (failed) */
const sendDueReminders = async ( now = new Date() ) => {
    const result = { sent: 0, skipped: 0, failed: 0 }

    /* "Ahora" y "dentro de 24 horas", los dos en hora de Madrid. Sumamos las 24 horas al instante real
    y después lo pasamos a Madrid: así también sale bien el día del cambio de hora */
    const nowKey = toMadridKey( now )
    const limit = getMadridNow( new Date( now.getTime() + DAY_MS ) )
    const limitKey = `${ limit.date } ${ limit.time }`
    const today = getMadridNow( now ).date

    /* Pedimos a la base las confirmadas sin recordatorio de hoy y de mañana (en Madrid): las únicas que pueden
    empezar en las próximas 24 horas. Si hoy y mañana son el mismo día (no pasa, pero por si acaso), solo una vez */
    const dates = [ ...new Set([ today, limit.date ]) ]
    const candidates = await Reservation.find({
        status: 'confirmed',
        reminderSent: false,
        date: { $in: dates }
    }).lean()

    /* Y aquí, en memoria, nos quedamos con las que empiezan después de ahora y como mucho dentro de 24 horas */
    const due = candidates.filter( reservation => {
        const start = toReservationKey( reservation )

        return start > nowKey && start <= limitKey
    })

    for ( const reservation of due ) {
        /* Para los mensajes de la consola: solo _id, fecha y hora, nunca los datos personales */
        const { _id, date, time } = reservation

        try {
            /* Reserva hecha o modificada con menos de 24 horas: no se avisa. La marcamos como avisada para no volver a mirarla.
            Solo si sigue igual (confirmada, sin aviso, mismo día y hora): si entre tanto la han cambiado, no la tocamos */
            if ( wasBookedLate( reservation ) ) {
                await Reservation.updateOne(
                    { _id, status: 'confirmed', reminderSent: false, date, time },
                    { reminderSent: true },
                    { timestamps: false }
                )
                result.skipped++
                continue
            }

            /* "Reclamamos" la reserva antes de enviar: findOneAndUpdate busca y marca en una sola operación atómica,
            así que si dos ejecuciones van a la vez solo una la consigue y nunca salen dos avisos.
            Si no devuelve nada, otra ejecución ya la cogió, o la han cancelado o cambiado de día u hora entre tanto: la saltamos.
            timestamps: false para no tocar updatedAt, que guarda cuándo la guardó el cliente (lo usa wasBookedLate) */
            const claimed = await Reservation.findOneAndUpdate(
                { _id, status: 'confirmed', reminderSent: false, date, time },
                { reminderSent: true },
                { returnDocument: 'after', timestamps: false }
            ).lean()
            if ( !claimed ) continue

            /* Si la reserva es de hoy (el aviso se retrasó), el correo dice "hoy" en vez de "mañana" */
            const isToday = claimed.date === today
            const sent = await sendEmailSafely( () => buildReminderMessage( claimed, { isToday } ), 'recordatorio', { _id, date, time } )
            if ( sent ) {
                result.sent++
                continue
            }

            /* El envío ha fallado: devolvemos reminderSent a false para que se reintente en la siguiente ejecución
            (si para entonces la reserva ya ha empezado, no se reintenta: deja de estar en las próximas 24 horas) */
            await Reservation.updateOne( { _id }, { reminderSent: false }, { timestamps: false } )
            result.failed++
        } catch ( error ) {
            /* Un fallo de la base con una reserva no para las demás: se apunta en la consola y seguimos */
            console.error( `No se ha podido procesar el recordatorio (reserva ${ _id }, ${ date } ${ time }):`, error.message )
            result.failed++
        }
    }

    return result
}

/* Exportamos la función para quien la ejecute cada cierto tiempo */
module.exports = {
    sendDueReminders
}
