import Papa from 'papaparse';
export {TEMPLATES,TEMPLATE_KEYS,PALETTE} from '../shared/templates.js';
// Theme tokens derived from a workspace's accent and ink colors.
const mix=(hex,to,amount)=>{const a=parseInt(hex.slice(1),16),b=parseInt(to.slice(1),16);const ch=s=>[(s>>16)&255,(s>>8)&255,s&255];const [r1,g1,b1]=ch(a),[r2,g2,b2]=ch(b);const m=(x,y)=>Math.round(x+(y-x)*amount).toString(16).padStart(2,'0');return '#'+m(r1,r2)+m(g1,g2)+m(b1,b2);};
export function themeVars(ws){const accent=ws?.accent||'#0b6e4f',ink=ws?.ink||'#123b36';return {'--accent':accent,'--accent-dark':mix(accent,'#000000',.18),'--ink':ink,'--wash':mix(accent,'#ffffff',.9),'--line':mix(accent,'#e6ebe5',.9),'--hero':mix(accent,'#ffffff',.84),'--muted':mix(ink,'#9aa5a0',.6)};}
export const initials=name=>(name||'?').split(/\s+/).filter(w=>!/^(dr|the|&)\.?$/i.test(w)).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
let TZ=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
let OWNER='';export const setOwner=n=>{OWNER=n||'';};export const owner=()=>OWNER;
export const setTimeZone=tz=>{if(tz)TZ=tz;};export const timeZone=()=>TZ;
export const tzLabel=()=>TZ.split('/').pop().replace(/_/g,' ');
export const CHANNELS=['Instagram','TikTok','Facebook','YouTube','LinkedIn'];
export const STATUSES=['Draft','To film','In review','Approved','Published'];
export const METRICS=['reach','views','likes','comments','shares','saves','followers','followerTotal'];
export const metricLabel={reach:'Accounts reached',views:'Views',likes:'Likes',comments:'Comments',shares:'Shares',saves:'Saves',followers:'New followers',followerTotal:'Total account followers'};
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function addDays(date,amount){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+amount);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function weekStart(date){const d=new Date(date+'T12:00:00');return addDays(date,-((d.getDay()+6)%7));}
export function dateLabel(date,options={month:'short',day:'numeric'}){return new Date(date+'T12:00:00').toLocaleDateString('en-US',options);}
export const format=n=>n==null?'—':Intl.NumberFormat('en',{notation:n>=10000?'compact':'standard',maximumFractionDigits:1}).format(n);
export const words=text=>(text||'').trim().split(/\s+/).filter(Boolean).length;
export async function api(url,options={}){const r=await fetch(url,{...options,headers:options.body instanceof FormData?options.headers:{'Content-Type':'application/json',...options.headers},body:options.body&&!(options.body instanceof FormData)?JSON.stringify(options.body):options.body});let d;try{d=await r.json();}catch{throw new Error('The app could not read the response. Please reload.');}if(r.status===401&&!url.startsWith('/api/auth/'))window.dispatchEvent(new Event('studio-signed-out'));if(!r.ok)throw new Error(d.error||'Something went wrong.');return d;}
export function latestMetrics(metrics){const latest=new Map();for(const m of metrics){const key=`${m.scope||'post'}:${m.postId}:${m.platform}`;if(!latest.has(key)||m.date>latest.get(key).date||(m.date===latest.get(key).date&&m.updated>latest.get(key).updated))latest.set(key,m);}return [...latest.values()];}
export function totals(metrics){return {...Object.fromEntries(METRICS.map(k=>[k,metrics.some(m=>m[k]!=null)?metrics.reduce((s,m)=>s+(m[k]||0),0):null])),_incomplete:metrics.some(m=>['reach','likes','comments','shares','saves'].some(k=>m[k]==null))};}
export function rate(m){if(m._incomplete||!m.reach||['likes','comments','shares','saves'].some(k=>m[k]==null))return null;return ((m.likes+m.comments+m.shares+m.saves)/m.reach*100).toFixed(1);}
export function download(name,content,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function exportCSV(rows,name){download(name,Papa.unparse(rows),'text/csv;charset=utf-8');}
export function exportCalendar(posts){const escape=s=>(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Social Studio//Content Calendar//EN','CALSCALE:GREGORIAN',...posts.flatMap(p=>['BEGIN:VEVENT',`UID:${p.id}@social-studio.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART;TZID=${TZ}:${p.date.replaceAll('-','')}T${p.time.replace(':','')}00`,`SUMMARY:${escape(p.title)}`,`DESCRIPTION:${escape(p.channels.join(', ')+' · '+p.status+'\n'+p.brief)}`,'END:VEVENT']),'END:VCALENDAR'];download('content-calendar.ics',lines.join('\r\n'),'text/calendar');}
