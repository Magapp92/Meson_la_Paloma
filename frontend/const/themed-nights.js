
/* Noches temáticas del mesón, en las cenas de miércoles a sábado. Las usan la portada y la página Experiencias.
Cada noche tiene un id (su ancla), el día, el nombre, su cartel (todos miden 675 × 958) y su carta por secciones.
Cada sección puede llevar título y una descripción, y sus platos tienen la misma forma que los de la carta */
export const THEMED_NIGHTS = Object.freeze([
    {
        id: 'picoteo',
        day: 'Miércoles',
        name: 'Picoteo',
        poster: '/img/wednesday-tapas.webp',
        sections: [
            {
                dishes: [
                    { name: 'Nachos con guacamole', prices: [ 14 ] },
                    { name: 'Chistorra al infierno', prices: [ 10 ] },
                    { name: 'Chips vegetales con salsa chipotle', prices: [ 8 ] },
                    { name: 'Gambas al ajillo con champiñones', prices: [ 12 ] },
                    { name: 'Brochetas de tomate, mozzarella y orégano', note: '4 unidades', prices: [ 12 ] },
                    { name: 'Sándwich club + patatas fritas', note: 'Jamón, queso, lechuga y huevo', prices: [ 8 ] },
                    { name: 'Sándwich club vegetal + patatas fritas', note: 'Lechuga, tomate, aguacate y cebolla roja', prices: [ 6 ] }
                ]
            }
        ]
    },
    {
        id: 'mexicano',
        day: 'Jueves',
        name: 'Mexicano',
        poster: '/img/thursday-mexican.webp',
        sections: [
            {
                title: 'Burritos',
                description: 'Tortilla extra grande con base de lechuga, arroz, frijoles, pico de gallo, salsa agria, salsa picante y queso. Todos vienen con nachos.',
                dishes: [
                    { name: 'Carnitas', prices: [ 8 ] },
                    { name: 'Carne picada', prices: [ 8 ] },
                    { name: 'Pollo', prices: [ 8 ] },
                    { name: 'Extra de guacamole', prices: [ 1.5 ] }
                ]
            },
            {
                title: 'Tacos',
                description: 'Tortilla con base de cebolla, cilantro y rábano.',
                dishes: [
                    { name: 'Carnitas', prices: [ 1.5 ] },
                    { name: 'Carne picada', prices: [ 1.5 ] },
                    { name: 'Pollo', prices: [ 1.5 ] },
                    { name: '3 tacos iguales o combinados', prices: [ 4 ] }
                ]
            },
            {
                title: 'Quesadillas',
                dishes: [
                    { name: 'Queso', prices: [ 5 ] },
                    { name: 'Carne', prices: [ 6.5 ] },
                    { name: 'Jamón y queso', prices: [ 5.5 ] }
                ]
            },
            {
                title: 'Nachos',
                dishes: [
                    { name: 'Nachos', note: 'Pico de gallo, queso, guacamole y salsa agria', prices: [ 5 ] }
                ]
            }
        ]
    },
    {
        id: 'frances',
        day: 'Viernes',
        name: 'Francés',
        poster: '/img/friday-french.webp',
        sections: [
            {
                title: 'Crepes salados',
                dishes: [
                    { name: 'Salmón', note: 'Salmón ahumado, huevo frito, tomate, rúcula y aguacate', prices: [ 5.5 ] },
                    { name: 'Champiñones', note: 'Champiñones, bacon, lechuga y queso', prices: [ 5 ] },
                    { name: 'Pollo', note: 'Tiras de pollo, pimiento rojo y verde, cebolla dulce y mayonesa', prices: [ 5.5 ] },
                    { name: 'Jamón', note: 'Jamón york, queso y queso crema a las finas hierbas', prices: [ 5 ] }
                ]
            },
            {
                title: 'Crepes dulces',
                dishes: [
                    { name: 'Queso dulce', note: 'Crema de queso dulce con pasas y esencia de vainilla', prices: [ 4 ] },
                    { name: 'Nutella', note: 'Nutella, plátano y nata montada', prices: [ 4 ] },
                    { name: 'Manzana caramelizada', note: 'Manzana caramelizada y canela', prices: [ 4 ] },
                    { name: 'Dulce de leche o Nutella', note: 'Con nata montada', prices: [ 4 ] },
                    { name: 'Extra: bola de helado de vainilla', prices: [ 1 ] }
                ]
            }
        ]
    },
    {
        id: 'americano',
        day: 'Sábado',
        name: 'Americano',
        poster: '/img/saturday-american.webp',
        sections: [
            {
                title: 'Hamburguesas',
                dishes: [
                    { name: 'Hamburguesa de la casa', note: 'Bacon, jamón york, queso fundido, huevo frito, cebolla roja, cebolla caramelizada, tomate y lechuga', prices: [ 10 ] },
                    { name: 'Hamburguesa barbacoa', note: 'Queso fundido, cebolla caramelizada, tomate, lechuga, cebolla y salsa barbacoa', prices: [ 10 ] },
                    { name: 'Hamburguesa de pollo', note: 'Pollo o pollo al curry, cebolla caramelizada, tomate, lechuga y mayonesa', prices: [ 7 ] }
                ]
            },
            {
                title: 'Perritos',
                dishes: [
                    { name: 'Perrito especial', note: 'Salchicha, queso fundido, queso rallado, pepinillo, cebolla picada, tomate, mostaza y mayonesa', prices: [ 7 ] },
                    { name: 'Perrito normal', note: 'Salchicha, pepinillo, cebolla picada, cebolla frita, mostaza y kétchup', prices: [ 5 ] }
                ]
            },
            {
                title: 'Pepitos',
                dishes: [
                    { name: 'Pepito de ternera', note: 'Ternera con salsa de soja, queso rallado, pimiento rojo y verde, cebolla dulce y variedad de salsas', prices: [ 6 ] },
                    { name: 'Pepito de pollo', note: 'Tiras de pollo, queso rallado, pimiento rojo y verde, cebolla dulce, lechuga, tomate y variedad de salsas', prices: [ 5.5 ] },
                    { name: 'Pepito mixto', note: 'Ternera, tiras de pollo, queso rallado, pimiento rojo y verde, cebolla y variedad de salsas', prices: [ 7 ] }
                ]
            },
            {
                title: 'Sándwich',
                dishes: [
                    { name: 'Sándwich de pastrami', note: 'Pastrami ahumado, queso fundido y salsa especial de la casa', prices: [ 10 ] }
                ]
            }
        ]
    }
])
