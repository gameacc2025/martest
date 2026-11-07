/**
 * Telecom Market — approved shared PrimeVue preset.
 * Brand primitives stay constant; primary actions and surfaces adapt by theme.
 */
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const TelecomPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50:'#CFFAFE',100:'#A5F3FC',200:'#67E8F9',300:'#22D3EE',400:'#06B6D4',500:'#0891B2',
      600:'#0891B2',700:'#0E7490',800:'#155E75',900:'#164E63',950:'#083344',
    },
    formField:{borderRadius:'8px'},
    content:{borderRadius:'12px'},
    focusRing:{width:'2px',style:'solid',color:'{primary.500}',offset:'2px'},
    colorScheme:{
      light:{
        primary:{color:'#0891B2',contrastColor:'#FFFFFF',hoverColor:'#0E7490',activeColor:'#0891B2'},
        highlight:{background:'#CFFAFE',focusBackground:'#A5F3FC',color:'#0E7490',focusColor:'#083344'},
        surface:{0:'#FFFFFF',50:'#F0F7FA',100:'#F1F5F9',200:'#DCE8EF',300:'#C5D5E0',400:'#94A3B8',500:'#627D98',600:'#486581',700:'#334E68',800:'#243B53',900:'#102A43',950:'#0A1625'},
        text:{color:'#102A43',hoverColor:'#0A1625',mutedColor:'#627D98',hoverMutedColor:'#486581'},
        formField:{background:'#FFFFFF',borderColor:'#DCE8EF',placeholderColor:'#94A3B8'},
        content:{background:'#FFFFFF',borderColor:'#DCE8EF'},
      },
      dark:{
        primary:{color:'#22D3EE',contrastColor:'#083344',hoverColor:'#67E8F9',activeColor:'#0891B2'},
        highlight:{background:'#164E63',focusBackground:'#155E75',color:'#67E8F9',focusColor:'#A5F3FC'},
        surface:{0:'#F0F9FF',50:'#DCE8EF',100:'#24394D',200:'#193149',300:'#172B40',400:'#9FB3C8',500:'#71869B',600:'#627D98',700:'#24394D',800:'#193149',900:'#122438',950:'#0A1625'},
        text:{color:'#F0F9FF',hoverColor:'#FFFFFF',mutedColor:'#9FB3C8',hoverMutedColor:'#C7D7E6'},
        formField:{background:'#122438',borderColor:'#24394D',placeholderColor:'#71869B'},
        content:{background:'#122438',borderColor:'#24394D'},
      },
    },
  },
  components:{
    button:{root:{borderRadius:'8px',paddingX:'1rem',paddingY:'0.5rem',label:{fontWeight:'600'}}},
    card:{root:{borderRadius:'12px',shadow:'0 2px 6px rgba(16,42,67,.06)'},colorScheme:{light:{root:{background:'#FFFFFF'}},dark:{root:{background:'#122438'}}}},
    tag:{root:{fontSize:'0.75rem',fontWeight:'600',borderRadius:'6px'}},
    datatable:{colorScheme:{
      light:{header:{background:'#F1F5F9'},headerCell:{background:'#F1F5F9',hoverBackground:'#F0FDFF',color:'#627D98'},row:{stripedBackground:'#FFFFFF'}},
      dark:{header:{background:'#172B40'},headerCell:{background:'#172B40',hoverBackground:'#193149',color:'#9FB3C8'},row:{stripedBackground:'#122438'}},
    }},
  },
})
export default TelecomPreset
