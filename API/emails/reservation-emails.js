
/* Los correos de las reservas, listos para sendEmail: destinatario, asunto, cuerpo y la invitación de calendario.
Juntan los textos (confirmation.js y cancellation.js) con la invitación (calendar-event.js) */
const { BOOKING_RULES } = require( '../services/booking-rules' )
const { buildConfirmationEmail } = require( './confirmation' )
const { buildCalendarEvent } = require( './calendar-event' )
const { buildCancellationEmail } = require( './cancellation' )

/* La versión del evento de calendario: los segundos de updatedAt de la reserva. Siempre crecen,
así cada correo lleva un número mayor que el anterior y, con el mismo UID, el calendario actualiza
el evento que ya tenía en vez de duplicarlo */
const getSequence = reservation => Math.floor( reservation.updatedAt.getTime() / 1000 )

/* La invitación de calendario de la reserva, lista para adjuntar al correo. La usan los tres correos:
confirmar y modificar la añaden o la mueven (REQUEST) y cancelar la quita (CANCEL).
Siempre con el mismo UID, el _id de la reserva, para que el calendario sepa que es el mismo evento.
Usamos el _id y no el código secreto: el UID se queda guardado en el calendario (y en calendarios compartidos
lo pueden ver otras personas), y con el código cualquiera podría modificar o cancelar la reserva.
El _id no cambia nunca y no sirve para nada fuera de la base de datos.
- method: 'REQUEST' o 'CANCEL'.
- sequence: versión del evento; tiene que ser mayor en cada correo para que el calendario lo tenga en cuenta.
Se llama invite.ics porque es el nombre que los programas de correo reconocen como invitación */
const buildInviteAttachment = ( reservation, { method = 'REQUEST', sequence } = {} ) => ({
    name: 'invite.ics',
    content: buildCalendarEvent({
        uid: `${ reservation._id }@mesonlapaloma.com`,
        title: `Mesa en Mesón La Paloma (${ reservation.partySize } personas)`,
        date: reservation.date,
        time: reservation.time,
        durationMinutes: BOOKING_RULES.durationMinutes,
        timeZone: 'Europe/Madrid',
        location: 'C/ Artajona, 9, 28039 Madrid',
        sequence,
        method,
        /* El mesón organiza, con el mismo remitente que el correo; el cliente es el asistente */
        organizer: { name: process.env.MAIL_FROM_NAME || 'Mesón La Paloma', email: process.env.MAIL_FROM },
        attendee: { name: reservation.name, email: reservation.email }
    })
})

/* El correo de la reserva (confirmación o modificación), con la invitación de calendario adjunta.
- isUpdate: true en la modificación, cambia el asunto y el título del correo.
- sequence: versión del evento de calendario; en la creación no se pasa (0) */
const buildReservationEmail = ( reservation, { isUpdate = false, sequence } = {} ) => {
    const manageUrl = `${ process.env.SITE_URL }/mi-reserva?codigo=${ reservation.token }`
    const { subject, html, text } = buildConfirmationEmail({
        name: reservation.name,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        notes: reservation.notes,
        manageUrl,
        isUpdate
    })

    return {
        to: { email: reservation.email, name: reservation.name },
        subject, html, text,
        /* Invitación de calendario: el programa de correo la añade al calendario, o mueve el evento si ya estaba */
        attachments: [ buildInviteAttachment( reservation, { sequence } ) ]
    }
}

/* El correo de cancelación, con el enlace para reservar otra vez y la invitación de anulación (CANCEL),
que quita el evento del calendario. reservation es la reserva ya cancelada: su updatedAt da un sequence
mayor que el de cualquier correo anterior */
const buildCancellationMessage = reservation => {
    const { subject, html, text } = buildCancellationEmail({
        name: reservation.name,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        bookingUrl: `${ process.env.SITE_URL }/reservar`
    })

    return {
        to: { email: reservation.email, name: reservation.name },
        subject, html, text,
        attachments: [ buildInviteAttachment( reservation, { method: 'CANCEL', sequence: getSequence( reservation ) } ) ]
    }
}

/* Exportamos los correos para el controller de reservas */
module.exports = {
    getSequence,
    buildInviteAttachment,
    buildReservationEmail,
    buildCancellationMessage
}
