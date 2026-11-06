/* Tiny SVG chart helpers (no dependencies). All return SVG strings. */
window.Charts={
 smooth(pts){let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=1;i<pts.length;i++){const[x0,y0]=pts[i-1],[x1,y1]=pts[i],mx=(x0+x1)/2;d+=` C${mx},${y0} ${mx},${y1} ${x1},${y1}`}return d},
 line(series,{w=400,h=160,fill=true,pad=8,bars}={}){const all=series.flatMap(s=>s.v),mx=Math.max(...all),mn=Math.min(...all)*.9;
  const xy=v=>v.map((y,i)=>[pad+i*(w-2*pad)/(v.length-1),h-pad-(y-mn)/(mx-mn||1)*(h-2*pad)]);
  let o=`<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="none" style="display:block;direction:ltr">`;
  if(bars)bars.forEach((b,i)=>{const bw=(w-2*pad)/bars.length;o+=`<rect x="${pad+i*bw+bw*.2}" y="${h-b*h*.3}" width="${bw*.5}" height="${b*h*.3}" rx="2" fill="#8c7bf7" opacity=".12"/>`});
  series.forEach(s=>{const p=xy(s.v),d=this.smooth(p);if(fill)o+=`<path d="${d} L${p.at(-1)[0]},${h} L${p[0][0]},${h}Z" fill="${s.c}" opacity=".1"/>`;o+=`<path d="${d}" fill="none" stroke="${s.c}" stroke-width="2" vector-effect="non-scaling-stroke"/>`});
  return o+'</svg>'},
 steps(v,c,{w=300,h=70}={}){const mx=Math.max(...v),bw=w/v.length;let d='',y=i=>h-4-(v[i]/mx)*(h-14);v.forEach((_,i)=>{d+=(i?`L${i*bw},${y(i)}`:`M0,${y(0)}`)+`L${(i+1)*bw},${y(i)}`});
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block;direction:ltr"><path d="${d}L${w},${h}L0,${h}Z" fill="${c}" opacity=".08"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`},
 bars(labels,series,{w=760,h=260,ymax=120}={}){const L=34,B=26,T=8,iw=w-L-10,ih=h-B-T,gw=iw/labels.length,bw=gw*.2;
  let o=`<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;direction:ltr">`;
  for(let g=0;g<=6;g++){const y=T+ih-g*ih/6;o+=`<line x1="${L}" x2="${w}" y1="${y}" y2="${y}" stroke="#eceff5" stroke-dasharray="3 3"/><text x="${L-8}" y="${y+3}" font-size="10" fill="#8c97b2" text-anchor="end">${g*ymax/6}</text>`}
  labels.forEach((lb,i)=>{o+=`<text x="${L+i*gw+gw/2}" y="${h-8}" font-size="10" fill="#8c97b2" text-anchor="middle">${lb}</text>`;series.forEach((s,k)=>{const bh=s.v[i]/ymax*ih;o+=`<rect x="${L+i*gw+gw/2-bw-1+k*(bw+2)}" y="${T+ih-bh}" width="${bw}" height="${bh}" rx="3" fill="${s.c}"/>`})});return o+'</svg>'},
 stacked(labels,series,{w=560,h=260}={}){const L=30,B=24,T=8,iw=w-L,ih=h-B-T,gw=iw/labels.length,bw=gw*.5,mx=Math.max(...labels.map((_,i)=>series.reduce((s,x)=>s+x.v[i],0)));
  let o=`<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;direction:ltr">`;
  labels.forEach((lb,i)=>{let y=T+ih;o+=`<text x="${L+i*gw+gw/2}" y="${h-8}" font-size="10" fill="#8c97b2" text-anchor="middle">${lb}</text>`;series.forEach(s=>{const bh=s.v[i]/mx*ih;y-=bh;o+=`<rect x="${L+i*gw+(gw-bw)/2}" y="${y}" width="${bw}" height="${Math.max(bh-2,1)}" rx="${bw/2}" fill="${s.c}"/>`})});return o+'</svg>'},
 donut(parts,{size=210,th=22,label='',value='',gap=2}={}){const r=(size-th)/2,c=2*Math.PI*r,tot=parts.reduce((s,p)=>s+p.v,0);let off=0,o=`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="max-width:100%"><g transform="rotate(-90 ${size/2} ${size/2})">`;
  parts.forEach(p=>{const l=p.v/tot*c;o+=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${p.c}" stroke-width="${th}" stroke-dasharray="${Math.max(l-gap,0)} ${c}" stroke-dashoffset="${-off}"/>`;off+=l});
  return o+`</g><text x="50%" y="${size/2-4}" text-anchor="middle" font-size="12" fill="#8c97b2">${label}</text><text x="50%" y="${size/2+18}" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${value}</text></svg>`},
 ring(pct,c,{size=170,th=16,label=''}={}){return this.donut([{v:pct,c},{v:100-pct,c:'#eceff5'}],{size,th,label,value:fa(pct)+'٪',gap:0})},
 hbars(rows,{max}={}){const m=max||Math.max(...rows.map(r=>r.v));return rows.map(r=>`<div class="d-flex ai-c gap-2 mb-1" style="margin-bottom:12px"><span class="muted fs-12" style="width:70px;text-align:end">${r.n}</span><div class="progress grow" style="height:14px;background:transparent;--c:${r.c}"><i style="width:${r.v/m*100}%;border-radius:2px"></i></div></div>`).join('')}
};
