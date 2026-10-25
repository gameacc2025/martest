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
    // Brand ramp built around #01bec2 (500). 700 is the light-theme action shade.
    primary: {
      50: '#e8fafb',
      100: '#c6f3f5',
      200: '#93e8eb',
      300: '#55dbdf',
      400: '#1ecbd0',
      500: '#01bec2',
      600: '#00a3a8',
      700: '#00797f',
      800: '#0a6a78',
      900: '#004d6f',
      950: '#003a54'
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
          background: '#def5fb',
          focusBackground: '#c6edf6',
          color: '#0a6a78',
          focusColor: '#004d6f'
        },
        // Cool, blue-tinted neutral ramp. 200 = hairline border, 600 = secondary text.
        surface: {
          0: '#ffffff',
          50: '#f9fcfd',
          100: '#f4f9fb',
          200: '#d5e6ed',
          300: '#b9d3de',
          400: '#8fb0bf',
          500: '#6b8c9b',
          600: '#476a79',
          700: '#2c5062',
          800: '#16435a',
          900: '#003a54',
          950: '#022a3d'
        },
        text: {
          color: '#003a54',
          hoverColor: '#022a3d',
          mutedColor: '#476a79',
          hoverMutedColor: '#2c5062'
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
          contrastColor: '#003a54',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}'
        },
        highlight: {
          background: 'rgba(1, 190, 194, 0.16)',
          focusBackground: 'rgba(1, 190, 194, 0.24)',
          color: '{primary.300}',
          focusColor: '{primary.200}'
        },
        // page #04202e (950), card #08293a (900), hover #0c3347 (800), border #16495f (700)
        surface: {
          0: '#ffffff',
          50: '#e8f4f8',
          100: '#cfe6ee',
          200: '#b0d0dc',
          300: '#8fb5c5',
          400: '#6d98ac',
          500: '#4f7f95',
          600: '#2f5f77',
          700: '#16495f',
          800: '#0c3347',
          900: '#08293a',
          950: '#04202e'
        },
        text: {
          color: '#e8f4f8',
          hoverColor: '#ffffff',
          mutedColor: '#9fc3d1',
          hoverMutedColor: '#cfe6ee'
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
        shadow: '0 1px 2px rgba(0, 58, 84, 0.06), 0 6px 16px rgba(0, 58, 84, 0.07)'
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
