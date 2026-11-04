/**
 * @telecom/shared-ui — PrimeVue Theme (design system v2)
 *
 * One preset shared by website, company and admin apps. Every visual decision
 * (palette, surfaces, focus ring, component shape) lives here or in
 * assets/design-system/tokens.scss; pages must not hardcode brand colors.
 *
 * Shared palette: cyan #12B8D0, turquoise #12C8B8, technical blue #278DE8,
 * deep navy #173B63 and dark sidebar #142B46.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    // Brand-primary sky ramp. Keep the vivid #39BFE0 at the center; darker
    // steps are reserved for text, borders and hover states.
    primary: {
      50: '#e9f9fd',
      100: '#c9f1f8',
      200: '#9fe5f0',
      300: '#66d6e9',
      400: '#35c8e2',
      500: '#12b8d0',
      600: '#079fbd',
      700: '#087e9b',
      800: '#08677f',
      900: '#075468',
      950: '#073d50'
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
          color: '{primary.500}',
          contrastColor: '#f5fdff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}'
        },
        highlight: {
          background: '#e9f9fd',
          focusBackground: '#c9f1f8',
          color: '#075468',
          focusColor: '#073d50'
        },
        // Cool, blue-tinted neutral ramp. 200 = hairline border, 600 = secondary text.
        surface: {
          0: '#ffffff',
          50: '#f8fbfd',
          100: '#f0f6f9',
          200: '#dce8ee',
          300: '#bfd2dc',
          400: '#91adbc',
          500: '#6c8b9c',
          600: '#506f82',
          700: '#38596e',
          800: '#28475f',
          900: '#173b63',
          950: '#102b49'
        },
        text: {
          color: '#203247',
          hoverColor: '#102b49',
          mutedColor: '#526b7b',
          hoverMutedColor: '#38596e'
        },
        formField: {
          // 3:1 against white for the control boundary (WCAG 1.4.11).
          borderColor: '{surface.500}',
          placeholderColor: '{surface.600}'
        }
      },
      dark: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#063b3a',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}'
        },
        highlight: {
          background: 'rgba(57, 191, 224, 0.16)',
          focusBackground: 'rgba(57, 191, 224, 0.24)',
          color: '{primary.300}',
          focusColor: '{primary.200}'
        },
        // page #04202e (950), card #08293a (900), hover #0c3347 (800), border #16495f (700)
        surface: {
          0: '#ffffff',
          50: '#eaf3f8',
          100: '#d4e5ef',
          200: '#b4cfdf',
          300: '#8eb4cb',
          400: '#6697b5',
          500: '#477b9d',
          600: '#326385',
          700: '#244e70',
          800: '#1b3f60',
          900: '#142f4b',
          950: '#0b2036'
        },
        text: {
          color: '#eaf3f8',
          hoverColor: '#ffffff',
          mutedColor: '#a9c5d5',
          hoverMutedColor: '#d4e5ef'
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
        shadow: '0 1px 2px rgba(23, 59, 99, 0.06), 0 6px 16px rgba(23, 59, 99, 0.07)'
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
