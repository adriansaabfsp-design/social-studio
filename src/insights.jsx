import React,{useState} from 'react';
import {ArrowRight,Bot,CalendarPlus,Eye,Table2,Check,CircleDashed,Globe,LogIn,Plus,Sparkles,Swords,Trash2,Users,X} from 'lucide-react';
import {api,dateLabel,today,addDays,format} from './lib';
import {EXAMPLE_REPORT} from './example-report';
import {PageTitle,Empty,Field,Modal,Spinner,Platform} from './components';
import {StoryField,FilesPanel,SocialLinks,cleanSocials,handleFrom,normalizeLink,Markdown} from './knowledge';

const stageOf=ws=>ws?.journey?.stage||'done';
const reportsOf=(data,kind)=>(data.reports||[]).filter(r=>r.kind===kind).sort((a,b)=>b.created.localeCompare(a.created));

/* ---------- Everything the AI saw, grouped ---------- */
const GROUPS=[['format','Format'],['topic','Topic'],['platform','Platform'],['month','Month']];
const groupKey=(p,by)=>by==='month'?(p.date?new Date(p.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}):'No date'):(p[by]||'Other');
const mean=xs=>{xs=xs.filter(x=>x!=null);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;};
const num=n=>n==null?'—':format(Math.round(n));
const reach=p=>p.likes??(p.views!=null?p.views/40:null); // rank video-only posts by views when likes aren't visible
function PostLink({p}){const text=p.caption||'Untitled post';return p.url?<a href={p.url} target="_blank" rel="noreferrer">{text}</a>:<span>{text}</span>;}
export function PostsTable({posts}){
 const[by,setBy]=useState('format'),[open,setOpen]=useState(false);
 const groups=Object.values(posts.reduce((g,p)=>{const k=groupKey(p,by);(g[k]||=({key:k,posts:[]})).posts.push(p);return g;},{})).map(g=>({...g,likes:mean(g.posts.map(p=>p.likes)),comments:mean(g.posts.map(p=>p.comments)),views:mean(g.posts.map(p=>p.views)),best:[...g.posts].sort((a,b)=>(reach(b)??-1)-(reach(a)??-1))[0]}))
  .sort((a,b)=>by==='month'?b.posts[0].date.localeCompare(a.posts[0].date):(b.likes??-1)-(a.likes??-1)||b.posts.length-a.posts.length);
 const top=Math.max(1,...groups.map(g=>g.likes||0));const label=GROUPS.find(g=>g[0]===by)[1];
 return <section className="posts-table"><div className="posts-head"><h3><Table2 size={15}/>Everything your AI saw <span className="count-bubble">{posts.length} posts</span></h3><div className="filter-tabs">{GROUPS.map(([k,l])=><button key={k} className={by===k?'active':''} onClick={()=>setBy(k)}>By {l.toLowerCase()}</button>)}</div></div>
  <div className="md-table"><table><thead><tr><th>{label}</th><th>Posts</th><th>Avg likes</th><th>Avg comments</th><th>Avg views</th><th>Best post</th></tr></thead><tbody>{groups.map(g=><tr key={g.key}><td><strong>{g.key}</strong></td><td>{g.posts.length}</td><td><span className="bar-cell">{g.likes!=null&&<i style={{width:`${g.likes/top*90}px`}}/>}{num(g.likes)}</span></td><td>{num(g.comments)}</td><td>{num(g.views)}</td><td className="best-cell"><PostLink p={g.best}/></td></tr>)}</tbody></table></div>
  <button className="text-link" onClick={()=>setOpen(!open)}>{open?'Hide':'Show'} all {posts.length} posts by {label.toLowerCase()}</button>
  {open&&<div className="md-table posts-detail"><table><thead><tr><th>Date</th><th>Post</th>{by!=='platform'&&<th>Platform</th>}{by!=='format'&&<th>Format</th>}{by!=='topic'&&<th>Topic</th>}<th>Likes</th><th>Comments</th><th>Views</th><th>Note</th></tr></thead>
   {groups.map(g=><tbody key={g.key}><tr className="group-row"><td colSpan={9}>{g.key} <small>{g.posts.length} posts · avg {num(g.likes)} likes</small></td></tr>{[...g.posts].sort((a,b)=>b.date.localeCompare(a.date)).map((p,i)=><tr key={i}><td>{p.date?dateLabel(p.date):'—'}</td><td className="caption-cell"><PostLink p={p}/></td>{by!=='platform'&&<td><span className="platform-cell"><Platform name={p.platform} small/>{p.platform}</span></td>}{by!=='format'&&<td>{p.format||'—'}</td>}{by!=='topic'&&<td>{p.topic||'—'}</td>}<td>{num(p.likes)}</td><td>{num(p.comments)}</td><td>{num(p.views)}</td><td className="note-cell">{p.note}</td></tr>)}</tbody>)}</table></div>}
 </section>;}

/* ---------- A report written by the owner's AI ---------- */
export function Report({report}){
 return <article className="panel report">
  <header><span className="eyebrow"><Bot size={12}/>{report.author?.toUpperCase()||'YOUR AI'} · {dateLabel(report.created.slice(0,10),{month:'short',day:'numeric',year:'numeric'})}{report.platform?` · ${report.platform}`:''}</span><h2>{report.title}</h2>{report.period&&<small>{report.period}</small>}{report.summary&&<p className="report-summary">{report.summary}</p>}</header>
  {report.stats?.length>0&&<div className="report-stats">{report.stats.map((s,i)=><div key={i}><strong>{s.value}</strong><span>{s.label}</span></div>)}</div>}
  {report.posts?.length>0&&<PostsTable posts={report.posts}/>}
  {(report.strengths?.length||report.weaknesses?.length||report.opportunities?.length)>0&&<div className="report-columns">{[['strengths','Strong points','good'],['weaknesses','Weak points','bad'],['opportunities','Opportunities','idea']].map(([k,label,tone])=>report[k]?.length>0&&<section key={k} className={`report-col ${tone}`}><h3>{label}</h3><ul>{report[k].map((x,i)=><li key={i}>{x}</li>)}</ul></section>)}</div>}
  {report.audience&&<section className="report-audience"><h3><Users size={15}/>Your audience</h3><p>{report.audience}</p></section>}
  {report.body&&<details className="report-body" open><summary>Full details</summary><Markdown text={report.body}/></details>}
  {report.sources?.length>0&&<footer className="report-sources">{report.sources.slice(0,12).map(s=><a key={s} href={s} target="_blank" rel="noreferrer"><Globe size={12}/>{s.replace(/^https?:\/\/(www\.)?/,'').slice(0,48)}</a>)}</footer>}
 </article>;}

function History({list,active,setActive}){if(list.length<2)return null;return <div className="filter-tabs report-history">{list.map(r=><button key={r.id} className={active===r.id?'active':''} onClick={()=>setActive(r.id)}>{dateLabel(r.created.slice(0,10))}</button>)}</div>;}

/* ---------- AI overview page: a timeline of overviews, grouped by date ---------- */
const longDate=d=>dateLabel(d,{month:'short',day:'numeric',year:'numeric'});
const monthOf=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
const periodOf=x=>x.from&&x.to?`${dateLabel(x.from,{month:'short',day:'numeric'})} – ${longDate(x.to)}`:x.period||'';
function RequestModal({onClose,onSubmit}){
 const t=today(),first=t.slice(0,8)+'01',prevEnd=addDays(first,-1),prevStart=prevEnd.slice(0,8)+'01';
 const presets=[['30','Last 30 days',addDays(t,-29),t],['90','Last 90 days',addDays(t,-89),t],['month','This month',first,t],['last','Last month',prevStart,prevEnd],['custom','Custom dates']];
 const[pick,setPick]=useState('30'),[from,setFrom]=useState(addDays(t,-29)),[to,setTo]=useState(t),[notes,setNotes]=useState(''),[busy,setBusy]=useState(false);
 const choose=p=>{setPick(p[0]);if(p[2]){setFrom(p[2]);setTo(p[3]);}};
 return <Modal title="Request a new overview" subtitle="Choose which dates your AI should look at. It will add the overview to your timeline." onClose={onClose}><div className="modal-body">
  <div className="period-presets">{presets.map(p=><button type="button" key={p[0]} className={pick===p[0]?'active':''} onClick={()=>choose(p)}>{p[1]}</button>)}</div>
  <div className="field-row"><Field label="From"><input type="date" value={from} max={to} onChange={e=>{setFrom(e.target.value);setPick('custom');}}/></Field><Field label="To"><input type="date" value={to} min={from} max={t} onChange={e=>{setTo(e.target.value);setPick('custom');}}/></Field></div>
  <Field label="Anything to focus on? (optional)"><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. how the summer offer posts did, or compare with last month"/></Field>
 </div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy||!from||!to||to<from} onClick={async()=>{setBusy(true);try{await onSubmit({kind:'social',from,to,notes});}finally{setBusy(false);}}}><CalendarPlus size={16}/>Request overview</button></div></Modal>;}

export function AIOverviewView({data,workspace,navigate,save,remove,notify}){
 const reports=reportsOf(data,'social');const pending=(data.requests||[]).filter(r=>r.kind==='social'&&r.status==='pending');
 const[active,setActive]=useState(null),[asking,setAsking]=useState(false),[example,setExample]=useState(false);
 const requestFor=r=>(data.requests||[]).find(q=>q.id===r.requestId);
 // Group by the dates each overview covers; fall back to the day it was made.
 const covered=r=>{const q=requestFor(r)||{};return {from:r.from||q.from||'',to:r.to||q.to||''};};
 const items=[...pending.map(r=>({...r,type:'request',day:r.to})),...reports.map(r=>({...r,...covered(r),type:'report',day:covered(r).to||r.created.slice(0,10)}))].sort((a,b)=>b.day.localeCompare(a.day)||b.created.localeCompare(a.created));

 const groups=[];for(const it of items){const m=monthOf(it.day);if(groups.at(-1)?.month!==m)groups.push({month:m,items:[]});groups.at(-1).items.push(it);}
 const selected=items.find(x=>x.id===active)||items.find(x=>x.type==='report')||items[0];
 async function submit(body){const r=await save('requests',body);setAsking(false);setActive(r.id);notify('Requested. Ask your AI to do it.');}
 return <><PageTitle eyebrow="WHAT YOUR AI SAW" title="AI overview." description="Your AI’s look at your social media over time: what you post, how it performs, your audience, strong and weak points."><button className="button secondary" onClick={()=>setExample(!example)}><Eye size={16}/>{example?'Close example':'See an example'}</button><button className="button primary" onClick={()=>setAsking(true)}><CalendarPlus size={16}/>Request a new overview</button></PageTitle>
  {example?<><div className="example-banner"><Eye size={16}/><span><strong>Example.</strong> This is what a finished overview looks like. It’s a made-up café, not your data.</span><button className="text-link" onClick={()=>setExample(false)}>Close example</button></div><Report report={EXAMPLE_REPORT}/></>:<>
  {!items.length?<div className="panel waiting"><span className="waiting-icon"><CircleDashed size={26} className="spin-slow"/></span><h2>Waiting for your AI’s overview</h2><p>Open the browser your AI uses, log in to your social accounts there, and ask your AI to look at your social media. Its report appears here automatically.</p>{!(workspace.socials||[]).length&&<button className="text-link" onClick={()=>navigate('business')}>Add your social links first<ArrowRight size={13}/></button>}<button className="text-link" onClick={()=>setExample(true)}><Eye size={13}/>See an example of a finished overview</button></div>
  :<div className="overview-layout"><aside className="timeline panel">{groups.map(g=><div key={g.month} className="timeline-group"><h3>{g.month}</h3>{g.items.map(it=>{const d=new Date(it.day+'T12:00:00');return <button key={it.id} className={`timeline-item ${selected?.id===it.id?'active':''} ${it.type}`} onClick={()=>setActive(it.id)}><span className="timeline-date"><strong>{d.getDate()}</strong><small>{d.toLocaleDateString('en-US',{weekday:'short'})}</small></span><span className="timeline-body"><strong>{it.type==='request'?'Overview requested':it.title}</strong><small>{periodOf(it)||'—'}</small><small className="timeline-made">{it.type==='request'?'Requested':'Made'} {dateLabel(it.created.slice(0,10))}</small>{it.type==='request'&&<em>Waiting for your AI</em>}</span></button>;})}</div>)}</aside>
   <div className="overview-main">{selected?.type==='request'?<div className="panel request-panel"><span className="waiting-icon"><CircleDashed size={24} className="spin-slow"/></span><h2>Overview of {periodOf(selected)}</h2><p>Requested on {longDate(selected.created.slice(0,10))}.{selected.notes?` Focus: ${selected.notes}`:''}</p><p className="muted">Ask your AI to do the overviews you’ve requested. It knows what to do, and the report appears here when it’s done.</p><button className="text-link danger" onClick={async()=>{await remove('requests',selected.id);setActive(null);}}>Cancel this request</button></div>
    :selected&&<Report report={{...selected,period:selected.period||periodOf(selected)}}/>}</div></div>}
  </>}
  {asking&&<RequestModal onClose={()=>setAsking(false)} onSubmit={submit}/>}
 </>;}

/* ---------- Competitors ---------- */
export function CompetitorEditor({value,onChange}){
 const set=(i,p)=>onChange(value.map((c,j)=>j===i?{...c,...p}:c));
 return <div className="competitor-list">{value.map((c,i)=><div className="competitor-row" key={i}><input value={c.name} placeholder="Competitor name" onChange={e=>set(i,{name:e.target.value})}/><input value={c.links.join(' ')} placeholder="Instagram, TikTok or website links (space between)" onChange={e=>set(i,{links:e.target.value.split(/\s+/)})} onBlur={e=>set(i,{links:e.target.value.split(/[\s,]+/).filter(Boolean).map(l=>normalizeLink(l,'Instagram'))})}/><button type="button" aria-label="Remove competitor" onClick={()=>onChange(value.filter((_,j)=>j!==i))}><Trash2 size={14}/></button></div>)}
  <button type="button" className="text-link" onClick={()=>onChange([...value,{name:'',links:[],notes:''}])}><Plus size={13}/>Add a competitor</button></div>;}
export const cleanCompetitors=list=>list.filter(c=>c.name.trim()).map(c=>({name:c.name.trim(),notes:c.notes||'',links:c.links.filter(Boolean).map(l=>normalizeLink(l,'Instagram'))}));

export function CompetitorsView({data,workspace,reloadWorkspaces,notify}){
 const[list,setList]=useState(workspace.competitors?.length?workspace.competitors:[{name:'',links:[],notes:''}]),[busy,setBusy]=useState(false);
 const reports=reportsOf(data,'competitors');const[active,setActive]=useState(null);const report=reports.find(r=>r.id===active)||reports[0];
 async function save(){setBusy(true);try{await api(`/api/workspaces/${workspace.id}`,{method:'PATCH',body:{competitors:cleanCompetitors(list)}});await reloadWorkspaces();notify('Competitors saved');}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 return <><PageTitle eyebrow="WHERE YOU STAND" title="Competitors." description="Who you’re up against, and your AI’s side-by-side comparison of their content and yours."/>
  <section className="panel"><div className="kit-head"><h2>Your competitors</h2><button className="button primary" disabled={busy} onClick={save}>{busy?<Spinner text="Saving…"/>:<><Check size={15}/>Save</>}</button></div><CompetitorEditor value={list} onChange={setList}/></section>
  {report?<><div className="section-heading"><h2>Your AI’s comparison</h2></div><History list={reports} active={report.id} setActive={setActive}/><Report report={report}/></>:null}
  <p className="rerun-note">{report?'Ask your AI to compare again whenever your list changes.':'Save your list, then ask your AI to compare you with your competitors. Its comparison appears here.'}</p>
 </>;}

/* ---------- Personal and business files ---------- */
export function PersonalFilesView({profile,setProfile,notify}){
 const[about,setAbout]=useState(profile.about||''),[busy,setBusy]=useState(false);
 async function save(){setBusy(true);try{const p=await api('/api/profile',{method:'PUT',body:{about}});setProfile(x=>({...x,...p}));notify('Saved');}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 return <><PageTitle eyebrow="ONLY YOU AND YOUR AI" title="Personal files." description="Everything about you: who you are, what you like, how you work. Add to it whenever something changes."><button className="button primary" disabled={busy||about===(profile.about||'')} onClick={save}>{busy?<Spinner text="Saving…"/>:<><Check size={16}/>{about===(profile.about||'')?'Saved':'Save'}</>}</button></PageTitle>
  <section className="panel"><h2 className="panel-title">About you</h2><StoryField value={about} onChange={setAbout} notify={notify} rows={12} placeholder="Who you are, your age, your story, your taste, how you like to be spoken to…" onAudio={async f=>{const form=new FormData();form.append('file',f);try{const p=await api('/api/profile/files',{method:'POST',body:form});setProfile(x=>({...x,files:p.files}));notify('Voice note attached');}catch(e){notify(e.message,'error');}}}/></section>
  <section className="panel"><h2 className="panel-title">Your files</h2><FilesPanel files={profile.files||[]} uploadUrl="/api/profile/files" removeUrl={i=>`/api/profile/files/${i}`} onChanged={p=>setProfile(x=>({...x,files:p.files}))} notify={notify} empty="CV, photos of you, interviews, voice notes, anything that helps."/></section>
 </>;}

export function BusinessFilesView({workspace,reloadWorkspaces,notify,navigate}){
 const[about,setAbout]=useState(workspace.description||''),[socials,setSocials]=useState(workspace.socials||[]),[busy,setBusy]=useState(false);
 const dirty=about!==(workspace.description||'')||JSON.stringify(cleanSocials(socials))!==JSON.stringify(workspace.socials||[]);
 async function save(){setBusy(true);try{const s=cleanSocials(socials);await api(`/api/workspaces/${workspace.id}`,{method:'PATCH',body:{description:about,socials:s,handles:[...new Set(s.map(handleFrom).filter(Boolean))].slice(0,8)}});setSocials(s);await reloadWorkspaces();notify('Business files saved');}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 const upload=async f=>{const form=new FormData();form.append('file',f);try{await api(`/api/workspaces/${workspace.id}/files`,{method:'POST',body:form});await reloadWorkspaces();notify('Voice note attached');}catch(e){notify(e.message,'error');}};
 return <><PageTitle eyebrow="EVERYTHING YOUR AI SHOULD KNOW" title="Business files." description={`What ${workspace.name} is, in your words, plus photos, documents and your social accounts. Keep adding to it.`}><button className="button primary" disabled={busy||!dirty} onClick={save}>{busy?<Spinner text="Saving…"/>:<><Check size={16}/>{dirty?'Save':'Saved'}</>}</button></PageTitle>
  <section className="panel"><h2 className="panel-title">About the business</h2><StoryField value={about} onChange={setAbout} notify={notify} rows={12} onAudio={upload} placeholder="What you sell, who comes to you, your story, prices, what makes you different…"/></section>
  <section className="panel"><h2 className="panel-title">Social accounts</h2><SocialLinks value={socials} onChange={setSocials}/></section>
  <section className="panel"><h2 className="panel-title">Photos & documents</h2><FilesPanel files={workspace.files||[]} uploadUrl={`/api/workspaces/${workspace.id}/files`} removeUrl={i=>`/api/workspaces/${workspace.id}/files/${i}`} onChanged={()=>reloadWorkspaces()} notify={notify} empty="Menus, brochures, price lists, photos of the place, products and team."/><p className="form-note">Photos also appear in the Brand kit media library, ready to use as post covers.</p></section>
 </>;}

/* ---------- After onboarding: social → competitors → team ---------- */
export function JourneyModal({workspace,data,reloadWorkspaces,notify,navigate,openTeam,onClose}){
 const stage=stageOf(workspace);const[comp,setComp]=useState(workspace.competitors?.length?workspace.competitors:[{name:'',links:[],notes:''},{name:'',links:[],notes:''}]);const[savedComp,setSavedComp]=useState(false),[busy,setBusy]=useState(false);
 const patch=async body=>{await api(`/api/workspaces/${workspace.id}`,{method:'PATCH',body});await reloadWorkspaces();};
 const journey=extra=>({journey:{...workspace.journey,...extra}});
 const accounts=(workspace.socials||[]).filter(s=>s.platform!=='Website');
 if(stage==='social')return <Modal title="Let your AI look at your social media" subtitle="Your AI will write a first overview: what you post, average likes, strong and weak points, your audience." onClose={onClose} wide><div className="modal-body journey">
  <ol className="journey-steps"><li><span>1</span><div><strong>Open the browser your AI uses</strong><p>For example the browser built into your AI app, or Claude in Chrome.</p></div></li>
   <li><span>2</span><div><strong>Log in to all of your social media accounts there</strong>{accounts.length?<div className="journey-accounts">{accounts.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><LogIn size={13}/>{s.platform}</a>)}</div>:<p>You haven’t added links yet. <button className="text-link" onClick={()=>{onClose();navigate('business');}}>Add them in Business files</button></p>}</div></li>
   <li><span>3</span><div><strong>Ask your AI to look at your social media</strong><p>It knows what to do. It only looks: it never posts, likes, follows or messages anyone.</p></div></li></ol></div>
  <div className="modal-actions"><button className="text-link" onClick={async()=>{await patch(journey({stage:'competitors'}));onClose();}}>Skip this step</button><div><button className="button secondary" onClick={onClose}>Later</button><button className="button primary" onClick={async()=>{await patch(journey({socialStartedAt:new Date().toISOString()}));onClose();navigate('insights');notify('Your AI overview will appear in AI overview');}}><Check size={16}/>Done, my AI is on it</button></div></div></Modal>;
 if(stage==='competitors')return <Modal title={savedComp?'Now let your AI compare you':'Who are your competitors?'} subtitle={savedComp?'It scrolls through their accounts and compares them with yours.':'Add the businesses you compete with. Links to their Instagram, TikTok or website help most.'} onClose={onClose} wide><div className="modal-body journey">
  {savedComp?<div className="journey-team"><Swords size={28}/><p>Ask your AI to compare you with your competitors. It looks through their accounts and yours, and its comparison appears in Competitors.</p></div>:<CompetitorEditor value={comp} onChange={setComp}/>}</div>
  <div className="modal-actions"><button className="text-link" onClick={async()=>{await patch(journey({stage:'team'}));onClose();}}>Skip this step</button><div>{savedComp?<button className="button primary" onClick={async()=>{await patch(journey({competitorsStartedAt:new Date().toISOString()}));onClose();navigate('competitors');}}><Check size={16}/>Done, my AI is on it</button>:<><button className="button secondary" onClick={onClose}>Later</button><button className="button primary" disabled={busy||!cleanCompetitors(comp).length} onClick={async()=>{setBusy(true);try{await patch({competitors:cleanCompetitors(comp)});setSavedComp(true);}catch(e){notify(e.message,'error');}finally{setBusy(false);}}}>Save competitors<ArrowRight size={15}/></button></>}</div></div></Modal>;
 if(stage==='team')return <Modal title="Now, introduce your team" subtitle="Upload a photo of each person who appears in your content, and describe who they are and how they come across." onClose={onClose}><div className="modal-body journey"><div className="journey-team"><Users size={30}/><p>AI uses these profiles to suggest who should speak in each video and to write scripts in their voice.</p></div></div>
  <div className="modal-actions"><button className="text-link" onClick={async()=>{await patch(journey({stage:'done'}));onClose();}}>Skip this step</button><div><button className="button secondary" onClick={onClose}>Later</button><button className="button primary" onClick={()=>{onClose();navigate('team');openTeam();}}><Plus size={16}/>Add your team</button></div></div></Modal>;
 return null;}

/* Which pop-up is due right now, if any */
export function journeyDue(ws,data){const st=stageOf(ws);if(st==='social'&&!ws.journey?.socialStartedAt)return true;if(st==='competitors'&&!ws.journey?.competitorsStartedAt)return true;if(st==='team'&&!(data.team||[]).length)return true;return false;}
export const waitingForAI=ws=>(stageOf(ws)==='social'&&ws.journey?.socialStartedAt)||(stageOf(ws)==='competitors'&&ws.journey?.competitorsStartedAt);

/* Overview card that shows where setup stands */
export function SetupProgress({workspace,data,navigate,openJourney}){
 const st=stageOf(workspace);if(st==='done')return null;const order=['social','competitors','team'];const at=order.indexOf(st);
 const items=[['social','AI overview of your social media',Sparkles,'insights'],['competitors','Competitor comparison',Swords,'competitors'],['team','Your team',Users,'team']];
 return <section className="panel setup-progress"><div><span className="eyebrow">GETTING STARTED</span><h2>{waitingForAI(workspace)?'Your AI is working on it':'Finish setting up '+workspace.name}</h2></div><ol>{items.map(([k,label,Icon,page],i)=><li key={k} className={i<at?'done':i===at?'now':''}><span>{i<at?<Check size={13}/>:<Icon size={13}/>}</span><button onClick={()=>navigate(page)}>{label}</button>{i===at&&<em>{waitingForAI(workspace)?'Waiting for your AI':'Next'}</em>}</li>)}</ol><button className="button primary" onClick={openJourney}>{waitingForAI(workspace)?'See instructions':'Continue'}<ArrowRight size={15}/></button></section>;}
