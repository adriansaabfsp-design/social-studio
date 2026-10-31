// Workspaces are data: any business can be added, each with its own brand kit, team and records.
import { z } from 'zod';
import { TEMPLATES, TEMPLATE_KEYS } from '../shared/templates.js';
export const SYSTEM='_system';
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/,'Use a hex color like #0b6e4f');
const asset=z.string().max(500).refine(v=>!v||/^\/(assets|media)\/[a-zA-Z0-9_.\/-]+$/.test(v),'Use an uploaded image').default('');
const text=z.string().max(4000).default('');
export const PLATFORMS=['Instagram','TikTok','Facebook','YouTube','LinkedIn','X','Snapchat','Pinterest','Website','Other'];
const link=z.string().trim().max(500).refine(v=>/^https?:\/\/\S+$/i.test(v),'Use a full link starting with https://');
export const STAGES=['social','competitors','team','done'];
export const workspaceSchema=z.object({
 name:z.string().trim().min(1).max(80),
 industry:z.enum(TEMPLATE_KEYS).default('other'),
 tagline:z.string().max(160).default(''),
 description:z.string().max(20000).default(''),
 location:z.string().max(120).default(''),
 website:z.string().max(300).default(''),
 handles:z.array(z.string().trim().regex(/^@?[a-zA-Z0-9_.]{1,40}$/,'Use social handles like @yourbrand')).max(8).default([]),
 audience:text, voice:text, dos:text, donts:text, compliance:text,
 languages:z.array(z.string().max(30)).max(6).default(['English']),
 pillars:z.array(z.string().trim().min(1).max(60)).min(1).max(8),
 accent:hex.default('#0b6e4f'), ink:hex.default('#123b36'),
 logo:asset, hero:asset,
 socials:z.array(z.object({platform:z.enum(PLATFORMS),url:link})).max(20).default([]),
 competitors:z.array(z.object({name:z.string().trim().min(1).max(120),links:z.array(link).max(10).default([]),notes:z.string().max(2000).default('')})).max(30).default([]),
 journey:z.object({stage:z.enum(STAGES),socialStartedAt:z.string().max(40).optional(),competitorsStartedAt:z.string().max(40).optional()}).optional(),
 timezone:z.string().max(60).refine(tz=>{try{new Intl.DateTimeFormat('en',{timeZone:tz});return true;}catch{return false;}},'Choose a valid time zone').default('UTC'),
});
export const slugify=name=>String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)||'workspace';

export const listWorkspaces=store=>store.list(SYSTEM,'workspaces').sort((a,b)=>a.created.localeCompare(b.created));
export const getWorkspace=(store,id)=>store.get(SYSTEM,'workspaces',id);

export function createWorkspace(store,input){
 const value=workspaceSchema.parse(input);let id=slugify(value.name),n=2;
 while(getWorkspace(store,id)||id===SYSTEM)id=`${slugify(value.name).slice(0,28)}-${n++}`;
 return store.save(SYSTEM,'workspaces',{...value,assets:[],files:[]},id);
}
// Updates merge into the saved workspace, so a screen can send only the fields it owns.
export function updateWorkspace(store,id,input){const existing=getWorkspace(store,id);if(!existing)return null;return store.save(SYSTEM,'workspaces',{...existing,...workspaceSchema.parse({...existing,...input})},id);}
/* The post-onboarding journey: social overview, then competitors, then team. Reports written by the user's AI move it forward. */
export function advanceJourney(store,id,event){const ws=getWorkspace(store,id);const stage=ws?.journey?.stage;if(!stage)return;
 const next={social:{report_social:'competitors'},competitors:{report_competitors:'team'},team:{team_added:'done'}}[stage]?.[event];
 if(next)store.save(SYSTEM,'workspaces',{...ws,journey:{...ws.journey,stage:next}},id);}
export function deleteWorkspace(store,id){store.db.prepare('DELETE FROM records WHERE brand=?').run(id);return store.remove(SYSTEM,'workspaces',id);}

/* A short, data-only description of the business for every AI prompt. */
export function brandBrief(ws){
 if(!ws)return 'a small business';
 const t=TEMPLATES[ws.industry]?.label;
 return [`${ws.name}${t&&ws.industry!=='other'?` (${t.toLowerCase()})`:''}${ws.location?`, based in ${ws.location}`:''}.`,
  ws.tagline&&`Tagline: ${ws.tagline}.`, ws.description&&`About: ${ws.description.slice(0,2500)}`,
  ws.audience&&`Audience: ${ws.audience}`, ws.voice&&`Brand voice: ${ws.voice}`,
  ws.dos&&`Always: ${ws.dos}`, ws.donts&&`Never: ${ws.donts}`,
  ws.pillars?.length&&`Content pillars: ${ws.pillars.join(', ')}.`,
  ws.languages?.length&&`Languages: ${ws.languages.join(', ')}.`,
  ws.competitors?.length&&`Competitors: ${ws.competitors.map(c=>c.name).join(', ')}.`,
  ws.compliance&&`Review rule: ${ws.compliance} Flag anything that needs this review; never invent claims or outcomes.`].filter(Boolean).join(' ');
}

/* Optional starter plan so a new workspace is not empty. Marked as samples so they can be cleared in one click. */
export function addStarter(store,id){
 const ws=getWorkspace(store,id);const tpl=TEMPLATES[ws.industry]||TEMPLATES.other;
 const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
 tpl.posts.forEach((title,i)=>store.save(id,'content',{title,date:day(i*2+1),time:'18:00',channels:['Instagram'],format:i===1?'Carousel':'Reel',status:'Draft',pillar:ws.pillars[i%ws.pillars.length],owner:'',brief:`Starter idea for ${ws.name}. Make it yours: who is it for, and what should they remember?`,caption:'',script:'',shotList:'Opening shot\nThe key detail\nA human moment\nCall to action',image:'',notes:'',sourceUrl:'',evidence:'',consent:false,speakers:[],sample:true}));
 [['Add your logo, colors and voice in Brand kit','High'],['Add the people who appear on camera in Team','Medium'],['Plan the next two weeks in the calendar','Medium']].forEach(([title,priority],i)=>store.save(id,'tasks',{title,status:'To do',priority,date:day(i+1),owner:'',notes:'',contentId:'',sample:true}));
}
