/**
 * @telecom/shared-ui — PrimeVue Theme
 *
 * One preset shared by the website, company and admin apps. It encodes the
 * unified "tem" visual language: deep navy structure, a blue primary action,
 * a cyan accent and cool blue-gray surfaces. All visual decisions belong
 * here or in assets/design-system/tem.scss — pages must not hardcode brand
 * hex values.
 *
 * Palette:
 *   navy       #0a1c3f / #08142e
 *   blue       #1a73e8 (accent) · #1565cf (button base) · #1155b0 (hover)
 *   cyan       #2ed3ee / #16b8e8
 *   green      #18c8a0
 *   canvas     #eef3fb
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#e8f1fe',
      100: '#d3e4fd',
      200: '#a9cbfa',
      300: '#77aef6',
      400: '#4792f0',
      500: '#1a73e8',
      600: '#1565cf',
      700: '#1155b0',
      800: '#0e468f',
      900: '#0b3570',
      950: '#082550'
    },
    formField: { borderRadius: '8px' },
    content: { borderRadius: '8px' },
    // A visible keyboard ring is mandatory (WCAG 2.4.7).
    focusRing: { width: '2px', style: 'solid', color: '#16b8e8', offset: '2px' },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}'
        },
        highlight: {
          background: '#e8f1fe',
          focusBackground: '#d3e4fd',
          color: '#1155b0',
          focusColor: '#0e468f'
        },
        // Cool blue-tinted neutral ramp. 200 = hairline border, 500/600 = muted text.
        surface: {
          0: '#ffffff',
          50: '#f7f9fd',
          100: '#f2f6fc',
          200: '#e3e9f4',
          300: '#d3dced',
          400: '#a3b1ca',
          500: '#6b7a99',
          600: '#576685',
          700: '#3d4d6b',
          800: '#25374f',
          900: '#14233f',
          950: '#0a1c3f'
        },
        text: {
          color: '#14233f',
          hoverColor: '#0a1c3f',
          mutedColor: '#6b7a99',
          hoverMutedColor: '#576685'
        },
        formField: {
          // 3:1 against white for the control boundary (WCAG 1.4.11).
          borderColor: '{surface.300}',
          placeholderColor: '{surface.500}'
        },
        content: { background: '#ffffff', borderColor: '#e3e9f4' }
      },
      dark: {
        primary: {
          color: '#2ed3ee',
          contrastColor: '#05213f',
          hoverColor: '#55e0f4',
          activeColor: '#7fe8f7'
        },
        highlight: {
          background: 'rgba(46, 211, 238, 0.14)',
          focusBackground: 'rgba(46, 211, 238, 0.22)',
          color: '{primary.300}',
          focusColor: '{primary.200}'
        },
        surface: {
          0: '#ffffff',
          50: '#eef3fb',
          100: '#dbe5f4',
          200: '#bccbe3',
          300: '#94a8c6',
          400: '#7188a8',
          500: '#526987',
          600: '#3a5170',
          700: '#263c59',
          800: '#16294a',
          900: '#0d1e3a',
          950: '#071429'
        },
        text: {
          color: '#eef3fb',
          hoverColor: '#ffffff',
          mutedColor: '#a3b1ca',
          hoverMutedColor: '#dbe5f4'
        }
      }
    }
  },
  components: {
    button: {
      root: {
        borderRadius: '8px',
        paddingX: '1rem',
        label: { fontWeight: '600' }
      }
    },
    card: {
      root: {
        borderRadius: '12px',
        shadow: '0 1px 2px rgba(16, 42, 74, 0.05)'
      }
    },
    tag: {
      root: { fontSize: '0.75rem', fontWeight: '600', borderRadius: '999px' }
    },
    datatable: {
      colorScheme: {
        light: {
          header: { background: '#f7f9fd' },
          headerCell: { background: '#f7f9fd', hoverBackground: '#f2f6fc', color: '#6b7a99' },
          row: { stripedBackground: '#f7f9fd' }
        }
      }
    }
  }
})

export default TelecomPreset