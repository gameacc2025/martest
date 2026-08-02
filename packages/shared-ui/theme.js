/**
 * @telecom/shared-ui — PrimeVue Theme
 *
 * Telecom Market brand preset for all apps.
 * All three apps import this to share the same visual identity.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#eafcff',
      100: '#c9f6fb',
      200: '#a2eef6',
      300: '#6fe4f2',
      400: '#48d9f0',
      500: '#0dafbe',
      600: '#01bec2',
      700: '#0a8a99',
      800: '#0a6a78',
      900: '#004d6f',
      950: '#003a54'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#01bec2',
          contrastColor: '#ffffff',
          hoverColor: '#0dafbe',
          activeColor: '#0a8a99'
        },
        surface: {
          0: '#ffffff',
          50: '#f7fbfe',
          100: '#def5fb',
          200: '#c9edf6',
          300: '#a9dfec',
          400: '#7cc6d8',
          500: '#52798a',
          600: '#3f6675',
          700: '#2f505c',
          800: '#1f3944',
          900: '#12262e',
          950: '#0a181e'
        }
      }
    }
  }
})

export default TelecomPreset
