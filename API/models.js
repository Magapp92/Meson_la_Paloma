
const mongoose = require( 'mongoose' )

const { menuCategorySchema } = require( './schemas' )

/* Modelo de las categorías de la carta (colección menu) */
const MenuCategory = mongoose.model( 'MenuCategory', menuCategorySchema )

module.exports = {
    MenuCategory
}
