
const mongoose = require( 'mongoose' )

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

module.exports = {
    menuCategorySchema
}
