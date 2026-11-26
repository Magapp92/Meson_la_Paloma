
const mongoose = require( 'mongoose' )

const { menuCategorySchema, tableSchema, reservationSchema } = require( './schemas' )

/* Modelo de las categorías de la carta (colección menu) */
const MenuCategory = mongoose.model( 'MenuCategory', menuCategorySchema )

/* Modelo de las mesas del comedor (colección tables) */
const Table = mongoose.model( 'Table', tableSchema )

/* Modelo de las reservas (colección reservations) */
const Reservation = mongoose.model( 'Reservation', reservationSchema )

module.exports = {
    MenuCategory,
    Table,
    Reservation
}
