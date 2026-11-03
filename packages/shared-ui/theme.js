/**
 * @telecom/shared-ui — PrimeVue Theme (design system v2)
 *
 * One preset shared by website, company and admin apps. Every visual decision
 * (palette, surfaces, focus ring, component shape) lives here or in
 * assets/design-system/tokens.scss; pages must not hardcode brand colors.
 *
 * Brand palette
 *   Primary (brand)  #01bec2  logo, icons, indicators, focus ring in dark mode
 *   Secondary (deep) #003a54  hero/sidebar surfaces, headings in light mode
 *   Petrol           #004d6f  pressed states, footer
 *   Text on teal     #0a6a78  links / text that sits on light surfaces
 *
 * ACCESSIBILITY RULE (WCAG 2.1 AA, verified numerically):
 *   white on #01bec2 is only 2.30:1 and FAILS. Therefore the light-theme
 *   *action* color (buttons, links, checked states) is the deeper shade
 *   {primary.700} #00797f (white 5.20:1, 4.90:1 on the #f4f9fb page).
 *   In the dark theme the bright brand teal is used with deep-blue text
 *   (#003a54 on #01bec2 = 5.28:1; #01bec2 on #08293a = 6.59:1).
 *   To change the action color later, edit ONLY the two `primary` blocks below
 *   and re-check contrast.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    // Accessible action ramp anchored in the turquoise brand.
    primary: {
      50: '#e8f8f6',
      100: '#c9eee9',
      200: '#9ce0d7',
      300: '#66cfc2',
      400: '#35c1b1',
      500: '#12b8a6',
      600: '#0b9d91',
      700: '#087f78',
      800: '#086660',
      900: '#0b5551',
      950: '#063b3a'
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
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}'
        },
        highlight: {
          background: '#dff6f3',
          focusBackground: '#c8eee9',
          color: '#086660',
          focusColor: '#063b3a'
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
          background: 'rgba(18, 184, 166, 0.16)',
          focusBackground: 'rgba(18, 184, 166, 0.24)',
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
