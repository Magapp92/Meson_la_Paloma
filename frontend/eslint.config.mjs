
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import stylistic from '@stylistic/eslint-plugin'

/* Configuración de ESLint: revisa el código y avisa de errores y de lo que se sale del estilo de la casa.
Se pasa con npm run lint */
const eslintConfig = defineConfig([

    /* Reglas recomendadas por Next: las suyas, las de React y las de los hooks.
    core-web-vitals convierte en errores las que afectan a la velocidad de la web */
    ...nextVitals,

    /* Reglas de estilo de la casa, con el plugin @stylistic (donde ESLint guarda ahora las reglas de formato).
    La sangría no se revisa: choca con cómo escribimos las props en varias líneas */
    {
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            '@stylistic/semi': ['error', 'never'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/no-trailing-spaces': 'error'
        }
    },

    /* Carpetas que no se revisan: las que genera Next solo */
    globalIgnores([
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts'
    ])
])

export default eslintConfig
