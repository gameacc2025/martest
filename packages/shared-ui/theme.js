/**
 * @telecom/shared-ui — PrimeVue Theme (design system v2)
 *
 * One preset shared by website, company and admin apps. Every visual decision
 * (palette, surfaces, focus ring, component shape) lives here or in
 * assets/design-system/tokens.scss; pages must not hardcode brand colors.
 *
 * Shared palette: turquoise #09d3d1, sky #0790de, technical blue #0b7bc9,
 * deep navy #0f2d4d and dark sidebar #092643.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    // Brand-primary sky ramp. Keep the vivid #0790de at the center; darker
    // steps are reserved for text, borders and hover states.
    primary: {
      50: '#e8f5fd',
      100: '#d2ecfb',
      200: '#a9d9f6',
      300: '#6fbff0',
      400: '#34a4e8',
      500: '#0790de',
      600: '#0679bd',
      700: '#0a5f98',
      800: '#0a4d7c',
      900: '#083a60',
      950: '#062f4f'
    },
    // Slightly softer corners than the stock Lara template: calmer, more "enterprise".
    formField: { borderRadius: '10px' },
    content: { borderRadius: '10px' },
    // Lara ships an invisible focus ring (width 0). A visible ring is mandatory
    // for keyboard users (WCAG 2.4.7).
    focusRing: { width: '2px', style: 'solid', color: '{primary.color}', offset: '2px' },
    colorScheme: {
      light: {
        primary: {
          // 600 keeps white button text above 4.5:1; 500 (#0790de) is the brand accent for tabs/charts.
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}'
        },
        highlight: {
          background: '#e8f5fd',
          focusBackground: '#d2ecfb',
          color: '#0a4d7c',
          focusColor: '#083a60'
        },
        // Cool, blue-tinted neutral ramp. 200 = hairline border, 600 = secondary text.
        surface: {
          0: '#ffffff',
          50: '#f7fafc',
          100: '#eef2fb',
          200: '#e2e8f4',
          300: '#cdd6e8',
          400: '#9aaccb',
          500: '#6a7fa0',
          600: '#52678a',
          700: '#3a4f72',
          800: '#1f3a5c',
          900: '#0f2d4d',
          950: '#092643'
        },
        text: {
          color: '#0f2d4d',
          hoverColor: '#092643',
          mutedColor: '#52678a',
          hoverMutedColor: '#3a4f72'
        },
        formField: {
          // 3:1 against white for the control boundary (WCAG 1.4.11).
          borderColor: '{surface.500}',
          placeholderColor: '{surface.600}'
        }
      },
      dark: {
        primary: {
          color: '#27d3ee',
          contrastColor: '#062f4f',
          hoverColor: '#4cd1f3',
          activeColor: '#7fe0f7'
        },
        highlight: {
          background: 'rgba(39, 211, 238, 0.14)',
          focusBackground: 'rgba(39, 211, 238, 0.22)',
          color: '{primary.300}',
          focusColor: '{primary.200}'
        },
        // page #04202e (950), card #08293a (900), hover #0c3347 (800), border #16495f (700)
        surface: {
          0: '#ffffff',
          50: '#eaeef9',
          100: '#d6dff0',
          200: '#b4c2de',
          300: '#8ea2c8',
          400: '#6b81ac',
          500: '#4e6591',
          600: '#37507a',
          700: '#243d62',
          800: '#16304f',
          900: '#0d2845',
          950: '#071d36'
        },
        text: {
          color: '#eaeef9',
          hoverColor: '#ffffff',
          mutedColor: '#a9c5d5',
          hoverMutedColor: '#d6dff0'
        }
      }
    }
  },
  components: {
    button: {
      root: {
        borderRadius: '10px',
        paddingX: '1.1rem',
        label: { fontWeight: '600' }
      }
    },
    card: {
      root: {
        borderRadius: '14px',
        // Navy-tinted elevation instead of neutral black: reads as one family with the brand.
        shadow: '0 1px 2px rgba(9, 38, 67, 0.06), 0 6px 16px rgba(9, 38, 67, 0.07)'
      }
    },
    tag: {
      root: { fontSize: '0.8125rem', fontWeight: '600' }
    },
    datatable: {
      colorScheme: {
        light: {
          header: { background: '{surface.100}' },
          headerCell: { background: '{surface.100}', hoverBackground: '{surface.200}', color: '{text.muted.color}' },
          row: { stripedBackground: '{surface.50}' }
        }
      }
    }
  }
})

export default TelecomPreset
