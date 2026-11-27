
const mongoose = require( 'mongoose' )
const { FIELD_LIMITS } = require( '../services/booking-rules' )

/* Schema de cada plato: nombre, nota opcional y sus precios.
prices es una lista: un precio o, si la categoría tiene priceLabels, uno por columna (Normal / Montado…).
_id false: los platos van dentro de su categoría y no necesitan id propio */
const dishSchema = new mongoose.Schema(
    {
        name: { type: mongoose.Schema.Types.String, required: true },
        note: { type: mongoose.Schema.Types.String },
        prices: { type: [ mongoose.Schema.Types.Number ], required: true }
    },
    {
        _id: false
    }
)

/* Schema de cada categoría de la carta, con sus platos dentro.
slug es el nombre corto de la categoría (bocadillos, pescado-y-marisco…): el ancla de su enlace en el índice.
order dice en qué posición sale en la carta */
const menuCategorySchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        slug: { type: mongoose.Schema.Types.String, required: true, unique: true },
        title: { type: mongoose.Schema.Types.String, required: true },
        order: { type: mongoose.Schema.Types.Number, required: true },
        priceLabels: { type: [ mongoose.Schema.Types.String ], default: undefined },
        note: { type: mongoose.Schema.Types.String },
        dishes: { type: [ dishSchema ], required: true }
    },
    {
        collection: 'menu',
        collation: {
            locale: 'es',
            strength: 2
        },
        versionKey: false
    }
)

/* Schema de cada mesa del comedor: su número y cuántas personas caben.
active permite retirar una mesa (por obras, por ejemplo) sin borrarla */
const tableSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        number: { type: mongoose.Schema.Types.Number, required: true, unique: true },
        seats: { type: mongoose.Schema.Types.Number, required: true, min: 2 },
        active: { type: mongoose.Schema.Types.Boolean, default: true }
    },
    {
        collection: 'tables',
        versionKey: false
    }
)

/* Schema de cada reserva.
date va como texto AAAA-MM-DD y time como HH:MM, en hora de Madrid: así una reserva del día 5
es siempre del día 5, esté donde esté el servidor.
table es el número de la mesa asignada. token es el código secreto del enlace para modificar o cancelar.
Los maxlength repiten los máximos de la validación (FIELD_LIMITS): por si algún día se guarda una reserva sin pasar por ella.
emailFailedAt (opcional) es cuándo falló el último correo de la reserva: así el mesón puede ver a quién no le ha llegado y avisarle.
expiresAt es cuándo se borra la reserva: al empezar en Madrid el día siguiente a date (services/madrid-time.js).
Lo pone la API al crear y lo recalcula al modificar; al cancelar no cambia, así que las canceladas se borran igual.
privacyAcceptedAt y privacyPolicyVersion son cuándo aceptó el cliente la política de privacidad y qué versión:
la ley pide poder demostrarlo. Los pone la API al crear la reserva y no cambian al modificarla.
timestamps añade createdAt y updatedAt solos */
const reservationSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        date: { type: mongoose.Schema.Types.String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        time: { type: mongoose.Schema.Types.String, required: true, match: /^\d{2}:\d{2}$/ },
        partySize: { type: mongoose.Schema.Types.Number, required: true, min: 2, max: 6 },
        name: { type: mongoose.Schema.Types.String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
        phone: { type: mongoose.Schema.Types.String, required: true, trim: true, maxlength: FIELD_LIMITS.phone },
        email: { type: mongoose.Schema.Types.String, required: true, trim: true, lowercase: true, maxlength: FIELD_LIMITS.email, match: /^\S+@\S+\.\S+$/ },
        notes: { type: mongoose.Schema.Types.String, trim: true, maxlength: FIELD_LIMITS.notes, default: '' },
        table: { type: mongoose.Schema.Types.Number, required: true },
        status: { type: mongoose.Schema.Types.String, enum: [ 'confirmed', 'cancelled' ], default: 'confirmed' },
        token: { type: mongoose.Schema.Types.String, required: true, unique: true },
        reminderSent: { type: mongoose.Schema.Types.Boolean, default: false },
        emailFailedAt: { type: mongoose.Schema.Types.Date },
        expiresAt: { type: mongoose.Schema.Types.Date, required: true },
        privacyAcceptedAt: { type: mongoose.Schema.Types.Date, required: true },
        privacyPolicyVersion: { type: mongoose.Schema.Types.String, required: true }
    },
    {
        collection: 'reservations',
        timestamps: true,
        versionKey: false
    }
)

/* Índice para buscar rápido las reservas de un día (lo que más se consulta al calcular los huecos) */
reservationSchema.index({ date: 1, status: 1 })

/* Índice TTL: borra cada reserva cuando llega su expiresAt (expireAfterSeconds 0: justo en ese momento, sin esperar más).
MongoDB revisa los TTL cada unos 60 segundos y borra los documentos vencidos él solo, sin tareas programadas nuestras.
El recordatorio no se ve afectado: se envía antes de la reserva, y la reserva no se borra hasta que acaba su día */
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = {
    menuCategorySchema,
    tableSchema,
    reservationSchema
}
