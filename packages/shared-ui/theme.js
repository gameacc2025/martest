/**
 * Shared Telecom Market PrimeVue preset.
 * Palette is sampled from the approved mockup and tuned so primary controls,
 * links and semantic text retain WCAG AA contrast in both color schemes.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#e8f5fc',
      100: '#d1ebf8',
      200: '#a4d7f1',
      300: '#77c3e9',
      400: '#3eaddf',
      500: '#0790de',
      600: '#0679bd',
      700: '#075f96',
      800: '#084b76',
      900: '#073a5c',
      950: '#062a43',
    },
    formField: { borderRadius: '8px' },
    content: { borderRadius: '8px' },
    focusRing: { width: '2px', style: 'solid', color: '#0679bd', offset: '2px' },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '#e3f1fd',
          focusBackground: '#cbe5f7',
          color: '#084b76',
          focusColor: '#073a5c',
        },
        surface: {
          0: '#ffffff',
          50: '#f7f9fd',
          100: '#eaeef9',
          200: '#d8e1ef',
          300: '#c0ccdf',
          400: '#95a7c2',
          500: '#657b99',
          600: '#52678a',
          700: '#3e536f',
          800: '#263e59',
          900: '#142f4a',
          950: '#092643',
        },
        text: {
          color: '#0f2d4d',
          hoverColor: '#092643',
          mutedColor: '#52678a',
          hoverMutedColor: '#3e536f',
        },
        formField: {
          borderColor: '#c0ccdf',
          placeholderColor: '#52678a',
        },
        content: { background: '#ffffff', borderColor: '#d8e1ef' },
      },
      dark: {
        primary: {
          color: '#27d3ee',
          contrastColor: '#05213f',
          hoverColor: '#4cd1f3',
          activeColor: '#7fe8f7',
        },
        highlight: {
          background: 'rgba(39, 211, 238, 0.14)',
          focusBackground: 'rgba(39, 211, 238, 0.22)',
          color: '#a4f0fa',
          focusColor: '#d0f8fc',
        },
        surface: {
          0: '#ffffff',
          50: '#eaf3fc',
          100: '#d8e7f5',
          200: '#b7cbe0',
          300: '#8ea9c5',
          400: '#6e89a6',
          500: '#4e6a89',
          600: '#39536f',
          700: '#273e5a',
          800: '#162f4b',
          900: '#0d2038',
          950: '#071429',
        },
        text: {
          color: '#eef3fb',
          hoverColor: '#ffffff',
          mutedColor: '#a9b8d6',
          hoverMutedColor: '#dbe5f4',
        },
        formField: {
          borderColor: '#39536f',
          placeholderColor: '#a9b8d6',
        },
        content: { background: '#0d2038', borderColor: '#273e5a' },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '8px',
        paddingX: '1rem',
        paddingY: '0.625rem',
        label: { fontWeight: '600' },
      },
    },
    card: {
      root: {
        borderRadius: '12px',
        shadow: '0 1px 2px rgba(9, 38, 67, 0.06)',
      },
    },
    tag: {
      root: { fontSize: '0.8125rem', fontWeight: '600', borderRadius: '999px' },
    },
    datatable: {
      colorScheme: {
        light: {
          header: { background: '#f7f9fd' },
          headerCell: { background: '#f7f9fd', hoverBackground: '#eaeef9', color: '#52678a' },
          row: { stripedBackground: '#f7f9fd' },
        },
      },
    },
  },
})

export default TelecomPreset
