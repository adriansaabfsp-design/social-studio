import React,{useState} from 'react';
import {ArrowLeft,ArrowRight,Briefcase,Check,Dumbbell,GraduationCap,Home,ImagePlus,Plus,ShoppingBag,Sparkles,Stethoscope,Store,Trash2,UtensilsCrossed,Wand2,X} from 'lucide-react';
import {api,TEMPLATES,TEMPLATE_KEYS,PALETTE,initials,themeVars} from './lib';
import {Field,Modal,PageTitle,Spinner} from './components';

const ICONS={UtensilsCrossed,Stethoscope,Home,ShoppingBag,Dumbbell,Sparkles,Briefcase,GraduationCap,Store};
export const ZONES=(()=>{try{return Intl.supportedValuesOf('timeZone');}catch{return ['UTC'];}})();
const LANGS=['English','Arabic','French','Spanish','German','Italian','Portuguese','Turkish'];

export function WorkspaceMark({ws,size=33}){return <span className="ws-mark" style={{width:size,height:size,background:ws?.logo?'#fff':ws?.accent,fontSize:Math.round(size*.38)}}>{ws?.logo?<img src={ws.logo} alt=""/>:initials(ws?.name)}</span>;}

/* Shared fields for the wizard and the brand kit. */
export function Pillars({value,onChange}){const[draft,setDraft]=useState('');const add=()=>{const v=draft.trim();if(v&&!value.includes(v)&&value.length<8)onChange([...value,v]);setDraft('');};
 return <div className="pillar-editor">{value.map(p=><span key={p} className="pillar-chip">{p}<button type="button" aria-label={`Remove ${p}`} onClick={()=>onChange(value.filter(x=>x!==p))}><X size={12}/></button></span>)}{value.length<8&&<span className="pillar-add"><input value={draft} maxLength={60} placeholder="Add a pillar" onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/><button type="button" aria-label="Add pillar" onClick={add}><Plus size={13}/></button></span>}</div>;}
export function Colors({v,set}){return <div className="color-pickers">{[['accent','Main color'],['ink','Text & dark']].map(([k,label])=><div key={k} className="field"><span>{label}</span><div className="swatches">{(k==='accent'?PALETTE:['#123b36','#0b2f45','#1f2937','#3b1d0e','#2a1550','#000000']).map(c=><button type="button" key={c} aria-label={c} className={v[k]===c?'active':''} style={{background:c}} onClick={()=>set(k,c)}/>)}<label className="swatch-custom" title="Custom color"><input type="color" value={v[k]} onChange={e=>set(k,e.target.value)}/></label></div></div>)}</div>;}
export function Languages({value,onChange}){return <div className="channel-options">{LANGS.map(l=><label key={l} className={value.includes(l)?'selected':''}><input type="checkbox" checked={value.includes(l)} onChange={()=>onChange(value.includes(l)?value.filter(x=>x!==l):[...value,l])}/>{l}</label>)}</div>;}
const fromTemplate=key=>{const t=TEMPLATES[key];return {industry:key,pillars:[...t.pillars],voice:t.voice,audience:t.audience,compliance:t.compliance,accent:t.accent,ink:t.ink};};

export async function draftWithAI(v,set,notify,setBusy){setBusy(true);try{const d=await api('/api/workspaces/draft',{method:'POST',body:{name:v.name,industry:TEMPLATES[v.industry]?.label,location:v.location,description:v.description}});set(x=>({...x,industry:d.industry||x.industry,tagline:d.tagline||x.tagline,audience:d.audience||x.audience,voice:d.voice||x.voice,dos:d.dos||x.dos,donts:d.donts||x.donts,pillars:d.pillars?.length?d.pillars.slice(0,8):x.pillars}));notify('AI drafted your brand kit. Review and edit it.');}catch(e){notify(e.message,'error');}finally{setBusy(false);}}

/* Editable brand kit for the current workspace */
export function BrandKitView({workspace,reloadWorkspaces,notify,data}){
 const[v,setV]=useState(()=>({...workspace,handlesText:(workspace.handles||[]).join(', ')})),[busy,setBusy]=useState(''),[ai,setAi]=useState(false),[confirm,setConfirm]=useState('');
 const set=(k,val)=>setV(x=>({...x,[k]:val})); const fields=['name','industry','tagline','description','location','website','audience','voice','dos','donts','compliance','languages','pillars','accent','ink','logo','hero','timezone'];
 const dirty=fields.some(k=>JSON.stringify(v[k])!==JSON.stringify(workspace[k]))||v.handlesText!==(workspace.handles||[]).join(', ');
 async function save(){setBusy('save');try{const body=Object.fromEntries(fields.map(k=>[k,v[k]]));body.handles=(v.handlesText||'').split(/[\s,]+/).filter(Boolean);await api(`/api/workspaces/${workspace.id}`,{method:'PUT',body});await reloadWorkspaces();notify('Brand kit saved');}catch(e){notify(e.message,'error');}finally{setBusy('');}}
 async function upload(path,file,label){if(!file)return;setBusy(label);try{const form=new FormData();form.append('file',file);const ws=await api(path,{method:'POST',body:form});setV(x=>({...x,logo:ws.logo,hero:ws.hero,assets:ws.assets}));await reloadWorkspaces();}catch(e){notify(e.message,'error');}finally{setBusy('');}}
 async function removeAsset(i){try{const ws=await api(`/api/workspaces/${workspace.id}/assets/${i}`,{method:'DELETE'});setV(x=>({...x,assets:ws.assets}));await reloadWorkspaces();}catch(e){notify(e.message,'error');}}
 async function destroy(){try{await api(`/api/workspaces/${workspace.id}`,{method:'DELETE',body:{confirm}});notify(`${workspace.name} was deleted`);await reloadWorkspaces();}catch(e){notify(e.message,'error');}}
 const counts=['content','tasks','ideas','team','metrics'].map(k=>[k,data[k]?.length||0]);
 return <><PageTitle eyebrow="WHAT EVERY POST AND AI DRAFT FOLLOWS" title="Brand kit." description={`Who ${workspace.name} is, how it sounds and what it posts about. AI reads this before every suggestion.`}><button className="button primary" disabled={!dirty||busy==='save'} onClick={save}>{busy==='save'?<Spinner text="Saving…"/>:<><Check size={16}/>{dirty?'Save changes':'Saved'}</>}</button></PageTitle>
  <div className="kit-grid">
   <section className="panel kit-identity"><h2>Identity</h2>
    <div className="kit-images"><label className="upload-tile"><input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>upload(`/api/workspaces/${workspace.id}/image/logo`,e.target.files[0],'logo')}/>{busy==='logo'?<Spinner text=""/>:v.logo?<img src={v.logo} alt="Logo"/>:<ImagePlus size={22}/>}<span>Logo</span></label><label className="upload-tile wide"><input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>upload(`/api/workspaces/${workspace.id}/image/hero`,e.target.files[0],'hero')}/>{busy==='hero'?<Spinner text=""/>:v.hero?<img src={v.hero} alt="Cover"/>:<ImagePlus size={22}/>}<span>Cover photo</span></label></div>
    <div className="field-row"><Field label="Name"><input value={v.name} maxLength={80} onChange={e=>set('name',e.target.value)}/></Field><Field label="Industry"><select value={v.industry} onChange={e=>set('industry',e.target.value)}>{TEMPLATE_KEYS.map(k=><option key={k} value={k}>{TEMPLATES[k].label}</option>)}</select></Field></div>
    <Field label="Tagline"><input value={v.tagline} maxLength={160} onChange={e=>set('tagline',e.target.value)}/></Field>
    <div className="field-row"><Field label="Location"><input value={v.location} maxLength={120} onChange={e=>set('location',e.target.value)}/></Field><Field label="Time zone"><select value={v.timezone} onChange={e=>set('timezone',e.target.value)}>{ZONES.map(z=><option key={z}>{z}</option>)}</select></Field></div>
    <div className="field-row"><Field label="Website"><input value={v.website} maxLength={300} onChange={e=>set('website',e.target.value)} placeholder="https://"/></Field><Field label="Your social handles"><input value={v.handlesText} onChange={e=>set('handlesText',e.target.value)} placeholder="@yourbrand"/></Field></div>
    <Colors v={v} set={set}/>
   </section>
   <section className="panel kit-voice"><div className="kit-head"><h2>Voice & audience</h2><button className="button secondary" disabled={ai||!v.description?.trim()} onClick={()=>draftWithAI(v,setV,notify,setAi)}>{ai?<Spinner text="Drafting…"/>:<><Wand2 size={15}/>Redraft with AI</>}</button></div>
    <div className="kit-about"><span>About the business</span><p>{v.description?v.description.slice(0,220)+(v.description.length>220?'…':''):'Not written yet.'}</p><small>Edit it in Business files, with photos and documents.</small></div>
    <Field label="Audience"><textarea rows={2} value={v.audience} onChange={e=>set('audience',e.target.value)}/></Field>
    <Field label="Brand voice"><textarea rows={2} value={v.voice} onChange={e=>set('voice',e.target.value)}/></Field>
    <div className="field-row"><Field label="Always"><textarea rows={3} value={v.dos} onChange={e=>set('dos',e.target.value)} placeholder="e.g. Show real people; end with one clear next step"/></Field><Field label="Never"><textarea rows={3} value={v.donts} onChange={e=>set('donts',e.target.value)} placeholder="e.g. Stock photos; slang; price promises"/></Field></div>
    <Field label="Review rule" hint="AI flags anything that needs this review."><textarea rows={2} value={v.compliance} onChange={e=>set('compliance',e.target.value)}/></Field>
    <div className="field"><span>Content pillars</span><Pillars value={v.pillars} onChange={x=>set('pillars',x)}/></div>
    <div className="field"><span>Languages</span><Languages value={v.languages} onChange={x=>set('languages',x)}/></div>
   </section>
  </div>
  <div className="section-heading"><div><h2>Media library <span className="count-bubble">{v.assets?.length||0}</span></h2><p>Photos you can use as post covers across the studio.</p></div><label className="button secondary"><input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>upload(`/api/workspaces/${workspace.id}/assets`,e.target.files[0],'asset')}/>{busy==='asset'?<Spinner text="Uploading…"/>:<><ImagePlus size={15}/>Add photo</>}</label></div>
  <div className="media-grid">{(v.assets||[]).map((a,i)=><figure key={a.url+i}><img src={a.url} alt={a.name}/><figcaption><span>{a.name}</span><button aria-label={`Remove ${a.name}`} onClick={()=>removeAsset(i)}><X size={13}/></button></figcaption></figure>)}{!v.assets?.length&&<p className="muted">No photos yet. Add your best shots so anyone on the team can use them.</p>}</div>
  <section className="panel danger-zone"><div><h2>Delete this workspace</h2><p>Removes {workspace.name} and everything in it: {counts.map(([k,n])=>`${n} ${k}`).join(', ')}. This cannot be undone. Export it from Settings first if you might need it.</p></div><div className="danger-actions"><input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder={`Type ${workspace.name} to confirm`}/><button className="button danger" disabled={confirm!==workspace.name} onClick={destroy}><Trash2 size={15}/>Delete workspace</button></div></section>
 </>;}

export function ProfileSettings({notify,onSaved}){const[name,setName]=useState(null);React.useEffect(()=>{api('/api/profile').then(p=>setName(p.name)).catch(()=>setName(''));},[]);
 async function save(){try{const p=await api('/api/profile',{method:'PUT',body:{name}});onSaved?.(p);notify('Profile saved');}catch(e){notify(e.message,'error');}}
 if(name===null)return null;
 return <section className="panel settings-panel"><div className="panel-heading"><div><h2>Your profile</h2><p>Your name appears on your profile and is the default owner of new posts and tasks, in every workspace.</p></div></div><div className="voice-connect"><input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="Your name"/><button className="button primary" onClick={save}>Save</button></div></section>;}

export function PeopleSettings({notify}){const[list,setList]=useState(null),[name,setName]=useState(''),[email,setEmail]=useState(''),[busy,setBusy]=useState(false);
 const load=()=>api('/api/invites').then(d=>setList(d.invites)).catch(()=>setList([]));React.useEffect(()=>{load();},[]);
 async function add(e){e.preventDefault();setBusy(true);try{const d=await api('/api/invites',{method:'POST',body:{people:[{name,email}]}});setList(d.invites);setName('');setEmail('');notify('Added. Tell your local AI to send the invitation.');}catch(err){notify(err.message,'error');}finally{setBusy(false);}}
 async function remove(id){try{await api(`/api/invites/${id}`,{method:'DELETE'});load();}catch(err){notify(err.message,'error');}}
 if(!list)return null;const label={pending:'Waiting for your AI',sent:'Invited',joined:'Joined'};
 return <section className="panel settings-panel"><div className="panel-heading"><div><h2>People with access</h2><p>Everyone you share Social Studio with. Your local AI sets up their access and sends the invitations.</p></div></div>
  {list.length>0?<div className="people-list">{list.map(i=><div className="people-row" key={i.id}><span><strong>{i.name||i.email.split('@')[0]}</strong></span><span><small>{i.email}</small></span><span className={`invite-status ${i.status}`} title={i.note||undefined}>{label[i.status]}</span>{i.status!=='joined'?<button aria-label={`Remove ${i.email}`} onClick={()=>remove(i.id)}><Trash2 size={14}/></button>:<span/>}</div>)}</div>:<p className="muted">Just you for now.</p>}
  <form className="voice-connect" onSubmit={add}><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" style={{maxWidth:180}}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><button className="button primary" disabled={busy}>Add person</button></form>
 </section>;}
