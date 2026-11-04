<template>
  <section class="tm-mail-layout">
    <aside v-if="$slots.sidebar" class="tm-mail-layout__sidebar"><slot name="sidebar" /></aside>
    <div class="tm-mail-layout__list"><slot name="list" /></div>
    <section v-if="$slots.reader" class="tm-mail-layout__reader"><slot name="reader" /></section>
  </section>
</template>

<style scoped>
.tm-mail-layout{display:grid;grid-template-columns:minmax(180px,230px) minmax(300px,1fr) minmax(340px,1.2fr);gap:12px;min-height:560px;min-width:0}
.tm-mail-layout__sidebar,.tm-mail-layout__list,.tm-mail-layout__reader{min-width:0;overflow:hidden;border:1px solid var(--tm-line);border-radius:var(--tm-radius-lg);background:var(--tm-surface)}
@media(max-width:1100px){.tm-mail-layout{grid-template-columns:190px minmax(0,1fr)}.tm-mail-layout__reader{grid-column:1/-1;min-height:360px}}
@media(max-width:700px){.tm-mail-layout{grid-template-columns:minmax(0,1fr)}.tm-mail-layout__sidebar{order:0}.tm-mail-layout__list{order:1}.tm-mail-layout__reader{order:2;grid-column:auto}}
</style>