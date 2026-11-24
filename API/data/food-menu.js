
/* Carta completa del mesón, por categorías y en el mismo orden que la carta de papel.
Son los datos que el script seed.js guarda en MongoDB (colección menu).
Cada categoría tiene su slug (el ancla de su enlace en el índice), su título y sus platos.
Cada plato lleva sus precios en una lista: uno o, si la categoría tiene priceLabels, uno por columna.
Los precios van como números; el formato "6,50 €" se lo da el frontend */
const FOOD_MENU = [
    {
        slug: 'desayunos',
        title: 'Desayuno y merienda',
        dishes: [
            { name: 'Café + tostada con tomate (andaluza)', prices: [ 2.5 ] },
            { name: 'Café + tostada con tomate y jamón', prices: [ 3 ] },
            { name: 'Café + churros', prices: [ 2.5 ] },
            { name: 'Café + tostada con jamón + zumo', prices: [ 4.2 ] },
            { name: 'Café + huevos con bacon + zumo', prices: [ 5 ] }
        ]
    },
    {
        slug: 'ofertas',
        title: 'Ofertas de la casa',
        dishes: [
            { name: 'Pintxo individual', note: 'Según disponibilidad', prices: [ 1.5 ] },
            { name: 'Tortilla de patatas entera', prices: [ 12 ] },
            { name: 'Pintxo de tortilla de patatas', prices: [ 2.5 ] },
            { name: 'Tortilla rellena', prices: [ 15 ] },
            { name: 'Pintxo de tortilla rellena', prices: [ 3 ] }
        ]
    },
    {
        slug: 'tostas',
        title: 'Tostas variadas',
        dishes: [
            { name: 'Salmón con queso crema y eneldo', prices: [ 5 ] },
            { name: 'Matrimonio (boquerones y anchoas)', prices: [ 5 ] },
            { name: 'Aguacate, tomate, queso y orégano', prices: [ 5.3 ] },
            { name: 'Queso de cabra y anchoa', prices: [ 5 ] },
            { name: 'Jamón ibérico', prices: [ 6 ] },
            { name: 'Jamón serrano', prices: [ 4.8 ] }
        ]
    },
    {
        slug: 'bocadillos',
        title: 'Bocadillos',
        priceLabels: [ 'Normal', 'Montado' ],
        note: 'Suplemento: + 1,00 €',
        dishes: [
            { name: 'Jamón ibérico', prices: [ 6, 4 ] },
            { name: 'Jamón serrano', prices: [ 5, 3.5 ] },
            { name: 'Queso manchego', prices: [ 5, 3 ] },
            { name: 'Embutidos', prices: [ 5.5, 3.5 ] },
            { name: 'Bacon con queso', prices: [ 5, 3 ] },
            { name: 'Cinta de lomo con queso', prices: [ 5, 3 ] },
            { name: 'Calamares', prices: [ 5, 3 ] },
            { name: 'Bonito con pimiento', prices: [ 5, 3.5 ] },
            { name: 'Morcilla', prices: [ 5, 3.2 ] },
            { name: 'Pechuga de pollo', prices: [ 6, 4 ] },
            { name: 'Tortilla de patatas', prices: [ 4.2, 3 ] }
        ]
    },
    {
        slug: 'sandwiches',
        title: 'Sándwiches',
        dishes: [
            { name: 'Mixto', prices: [ 3 ] },
            { name: 'Mixto con huevo', prices: [ 5 ] },
            { name: 'Mixto vegetal', prices: [ 5.5 ] },
            { name: 'Especial "La Paloma"', prices: [ 6.5 ] },
            { name: 'De pollo + refresco', prices: [ 8 ] },
            { name: 'Pastrami + refresco', prices: [ 10 ] }
        ]
    },
    {
        slug: 'hamburguesas',
        title: 'Hamburguesas',
        note: 'Todas las hamburguesas llevan patatas fritas.',
        dishes: [
            { name: 'Hamburguesa especial de la casa', prices: [ 10 ] },
            { name: 'Hamburguesa clásica', prices: [ 6 ] },
            { name: 'Hamburguesa barbacoa', prices: [ 10 ] },
            { name: 'Hamburguesa con huevo', prices: [ 7 ] },
            { name: 'Hamburguesa de pollo al curry', prices: [ 7 ] }
        ]
    },
    {
        slug: 'perritos',
        title: 'Perritos calientes',
        dishes: [
            { name: 'Perrito normal', prices: [ 5 ] },
            { name: 'Perrito especial', prices: [ 7 ] }
        ]
    },
    {
        slug: 'pollos',
        title: 'Pollos asados',
        dishes: [
            { name: 'Pollo asado + patatas + 2 refrescos', prices: [ 15 ] },
            { name: 'Medio pollo asado + patatas + 2 refrescos', prices: [ 7.5 ] },
            { name: 'Pollo asado + patatas, sin bebida', prices: [ 10 ] }
        ]
    },
    {
        slug: 'combinados',
        title: 'Platos combinados',
        dishes: [
            { name: 'Lomo + huevo + patatas', prices: [ 7.5 ] },
            { name: 'Filete de pollo empanado', prices: [ 7.5 ] },
            { name: 'Huevos con morcilla + patatas', prices: [ 7 ] },
            { name: 'Huevos rotos con jamón', prices: [ 7.5 ] },
            { name: 'Filete de ternera con ensalada', prices: [ 7.5 ] },
            { name: 'Tortilla francesa al gusto', prices: [ 6 ] }
        ]
    },
    {
        slug: 'infantiles',
        title: 'Platos combinados infantiles',
        dishes: [
            { name: 'Salchichas + huevo + patatas', prices: [ 5 ] },
            { name: 'Filete de pollo + huevo + patatas', prices: [ 6.5 ] },
            { name: 'Tortilla francesa con queso', prices: [ 5 ] },
            { name: 'Filete de ternera + patatas', prices: [ 6 ] },
            { name: 'Croquetas de pollo + patatas', prices: [ 5.5 ] }
        ]
    },
    {
        slug: 'especiales',
        title: 'Platos especiales',
        dishes: [
            { name: 'Entrecot con patatas', prices: [ 14 ] },
            { name: 'T-bone', prices: [ 25 ] },
            { name: 'Costillas asadas barbacoa + refresco', prices: [ 15 ] },
            { name: 'Chuletón', prices: [ 20 ] },
            { name: 'Tomahawk steak', note: 'Con patata americana y mazorca', prices: [ 35 ] }
        ]
    },
    {
        slug: 'pescado-y-marisco',
        title: 'Pescado y marisco',
        priceLabels: [ 'Ración', 'Media' ],
        dishes: [
            { name: 'Gambas a la plancha', prices: [ 14, 8 ] },
            { name: 'Gambas al ajillo', prices: [ 8, 5 ] },
            { name: 'Chopitos', prices: [ 9, 5.25 ] },
            { name: 'Calamares', prices: [ 8, 5 ] },
            { name: 'Pulpo a la gallega', prices: [ 18, 13 ] },
            { name: 'Pulpo con patata cocida', prices: [ 16, 11 ] },
            { name: 'Boquerones fritos', prices: [ 8, 5 ] },
            { name: 'Fritura de pescado', prices: [ 12, 7 ] },
            { name: 'Cazón adobado', prices: [ 9, 5 ] },
            { name: 'Sepia con ensalada', prices: [ 11, 6 ] },
            { name: 'Anchoas y boquerones', prices: [ 9, 6 ] }
        ]
    },
    {
        slug: 'tablas-y-cazuelillas',
        title: 'Tablas y cazuelillas',
        priceLabels: [ 'Ración', 'Media' ],
        dishes: [
            { name: 'Variedad ibérica', prices: [ 12, 7 ] },
            { name: 'Queso manchego', prices: [ 9, 5.5 ] },
            { name: 'Lacón a la gallega', prices: [ 9, 5.25 ] },
            { name: 'Chorizo frito', prices: [ 7, 4.5 ] },
            { name: 'Oreja a la plancha', prices: [ 9, 5.5 ] },
            { name: 'Jamón ibérico', prices: [ 14, 8 ] },
            { name: 'Jamón serrano', prices: [ 9, 5.5 ] },
            { name: 'Alitas fritas', prices: [ 8.5, 5 ] },
            { name: 'Chuletillas de lechal', prices: [ 14, 8 ] }
        ]
    },
    {
        slug: 'variados',
        title: 'Variados',
        priceLabels: [ 'Ración', 'Media' ],
        dishes: [
            { name: 'Patatas bravas', prices: [ 5, 3.5 ] },
            { name: 'Patatas alioli', prices: [ 5, 3.5 ] },
            { name: 'Patatas americanas', prices: [ 4, 3 ] },
            { name: 'Huevos rotos con jamón', prices: [ 9, 5.5 ] },
            { name: 'Huevos rotos con gulas', prices: [ 8, 5 ] },
            { name: 'Croquetas de jamón', prices: [ 8, 5 ] },
            { name: 'Croquetas de pollo', prices: [ 7, 4.5 ] },
            { name: 'Morcilla de Burgos frita', prices: [ 7, 4.5 ] }
        ]
    }
]

module.exports = {
    FOOD_MENU
}
