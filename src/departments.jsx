import React,{useState} from 'react';
import {ArrowLeft,Bot,Brain,Check,Clapperboard,Compass,Facebook,GraduationCap,Instagram,Link2,Linkedin,MessagesSquare,Music2,Palette,PenLine,Plus,RefreshCw,Send,Sparkles,Trash2,Upload,X,Youtube} from 'lucide-react';
import {api,dateLabel} from './lib';
import {DEPARTMENTS,DEPARTMENT_KEYS,recommendedDepartments} from '../shared/departments.js';
import {PageTitle,Empty,Field,Modal,Spinner} from './components';
import {Markdown} from './knowledge';
import {Report} from './insights';

const ICONS={Clapperboard,GraduationCap,Instagram,Music2,Linkedin,Facebook,Youtube,PenLine,Palette,Compass,MessagesSquare,Sparkles};
export function DeptIcon({dept,size=34}){const Icon=ICONS[dept?.icon]||Sparkles;return <span className="dept-icon" style={{width:size,height:size,background:dept?.color||'#334155'}}><Icon size={Math.round(size*.5)}/></span>;}
const host=u=>{try{return new URL(u).host.replace(/^www\./,'');}catch{return u;}};
const isUrl=t=>/^https?:\/\/\S+$/i.test(t)||/^(www\.)?[a-z0-9-]+\.[a-z]{2,}(\/\S*)?$/i.test(t);
const toUrl=t=>/^https?:\/\//i.test(t)?t:'https://'+t;
const STATUS={new:'Waiting',queued:'In line',learning:'Learning…',learned:'Learned',failed:'Needs another try'};
const ofDept=(list,id)=>(list||[]).filter(x=>x.departmentId===id);

/* ---------- Teach your AI: paste links, notes or files into a department ---------- */
function guessDept(text,depts){const t=text.toLowerCase();const by=k=>depts.find(d=>d.kind===k);
 if(/linkedin\.com/.test(t))return by('linkedin');if(/tiktok\.com/.test(t))return by('tiktok')||by('video-editor');if(/youtube\.com|youtu\.be|instagram\.com\/(reel|p)\//.test(t))return by('video-editor');if(/instagram\.com/.test(t))return by('instagram');return null;}
export function TeachModal({brand,data,onClose,notify,refresh,navigate,initialDept}){
 const depts=data.departments||[];
 const[text,setText]=useState(''),[why,setWhy]=useState(''),[deptId,setDeptId]=useState(initialDept||''),[files,setFiles]=useState([]),[watch,setWatch]=useState(false),[busy,setBusy]=useState(false);
 const target=depts.find(d=>d.id===deptId)||guessDept(text,depts)||depts[0];
 if(!depts.length)return <Modal title="Teach your AI" onClose={onClose}><div className="modal-body"><Empty icon={Brain} title="Set up your AI departments first" description="Departments are specialists, like a video editor or an Instagram strategist, that learn from what you share." action={<button className="button primary" onClick={()=>{onClose();navigate('departments');}}>Set up departments</button>}/></div></Modal>;
 async function send(){setBusy(true);try{
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);const links=lines.filter(isUrl);const note=lines.filter(l=>!isUrl(l)).join('\n');
  for(const url of links)await api(`/api/${brand}/knowledge`,{method:'POST',body:{departmentId:target.id,type:watch?'account':'link',url:toUrl(url),note:why}});
  if(note)await api(`/api/${brand}/knowledge`,{method:'POST',body:{departmentId:target.id,type:'note',title:note.split('\n')[0].slice(0,80),note:why?`${note}\n\n${why}`:note}});
  for(const f of files){const form=new FormData();form.append('file',f);form.append('note',why);await api(`/api/${brand}/departments/${target.id}/files`,{method:'POST',body:form});}
  await refresh();notify(`${target.name} is learning from it`);onClose();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 const count=text.split('\n').filter(l=>l.trim()).length+files.length;
 return <Modal title="Teach your AI" subtitle="Paste links, write what you noticed, or drop files. The right department learns from it and writes down what it learned." onClose={onClose} wide><div className="modal-body teach">
  <Field label="Links or notes" hint="One link per line. Anything that isn't a link becomes a note."><textarea autoFocus rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder={'https://www.instagram.com/reel/…\nhttps://www.youtube.com/watch?v=…\nI love how this one cuts on every beat'}/></Field>
  <label className="teach-files"><input type="file" multiple hidden accept="video/*,image/*,.pdf,.doc,.docx,.txt,.md,.rtf" onChange={e=>setFiles([...files,...e.target.files])}/><Upload size={15}/>{files.length?`${files.length} file${files.length>1?'s':''}: ${files.map(f=>f.name).join(', ').slice(0,80)}`:'Add videos, images or documents'}</label>
  <Field label="Why is it useful? (optional)"><input value={why} onChange={e=>setWhy(e.target.value)} placeholder="e.g. The pacing, the opening, how they show the product"/></Field>
  <div className="field"><span>Which department should learn it?</span><div className="dept-picker">{depts.map(d=><button type="button" key={d.id} className={target?.id===d.id?'active':''} onClick={()=>setDeptId(d.id)}><DeptIcon dept={d} size={24}/>{d.name}</button>)}</div></div>
  {target?.platform&&<label className="checkbox-row"><input type="checkbox" checked={watch} onChange={e=>setWatch(e.target.checked)}/>These are accounts to keep watching (your own AI follows them in its browser)</label>}
 </div><div className="modal-actions"><span className="form-note">{target?`${target.name} will learn from ${count||'it'} ${count===1?'item':'items'}.`:''}</span><div><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy||!count||!target} onClick={send}>{busy?<Spinner text="Sending…"/>:<><Send size={15}/>Teach {target?.name||'AI'}</>}</button></div></div></Modal>;}

/* ---------- All departments ---------- */
export function DepartmentsView({brand,data,workspace,refresh,notify,navigate}){
 const depts=data.departments||[];const[picked,setPicked]=useState(()=>recommendedDepartments(workspace)),[busy,setBusy]=useState(false),[adding,setAdding]=useState(false);
 async function setup(keys){setBusy(true);try{await api(`/api/${brand}/departments/setup`,{method:'POST',body:{keys}});await refresh();notify('Your AI departments are ready');setAdding(false);}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 if(!depts.length)return <><PageTitle eyebrow="AI BRAIN" title="Your AI departments." description="Specialists that each own one job. They learn from what you share, keep notes, and help each other."/>
  <section className="panel dept-setup"><h2>Pick your departments</h2><p className="muted">We picked a few for {workspace.name}. You can add or remove departments any time.</p>
   <div className="template-grid">{DEPARTMENT_KEYS.map(k=>{const t=DEPARTMENTS[k];const on=picked.includes(k);return <button key={k} className={`template-card ${on?'active':''}`} onClick={()=>setPicked(on?picked.filter(x=>x!==k):[...picked,k])}><DeptIcon dept={t} size={36}/><span><strong>{t.name}</strong><small>{t.mission}</small>{t.helps&&<em>Coaches {t.helps.map(h=>DEPARTMENTS[h].name).slice(0,2).join(', ')}{t.helps.length>2?'…':''}</em>}</span>{on&&<Check size={16} className="template-check"/>}</button>;})}</div>
   <div className="dept-setup-actions"><span className="muted">{picked.length} selected</span><button className="button primary" disabled={busy||!picked.length} onClick={()=>setup(picked)}>{busy?<Spinner text="Creating…"/>:<><Sparkles size={16}/>Create {picked.length} departments</>}</button></div></section></>;
 const missing=DEPARTMENT_KEYS.filter(k=>!depts.some(d=>d.kind===k));
 return <><PageTitle eyebrow="AI BRAIN" title="Your AI departments." description="Each one owns a job, learns from what you share, and writes down what it knows."><button className="button primary" onClick={()=>setAdding(true)}><Plus size={16}/>Add a department</button></PageTitle>
  <div className="dept-grid">{depts.map(d=>{const k=ofDept(data.knowledge,d.id);const learned=k.filter(x=>x.status==='learned').length;const busyNow=k.some(x=>['queued','learning'].includes(x.status));const coaches=depts.filter(c=>c.helps?.includes(d.id));const helps=(d.helps||[]).map(id=>depts.find(x=>x.id===id)).filter(Boolean);
   return <button key={d.id} className="dept-card" onClick={()=>navigate('dept:'+d.id)} style={{'--dept':d.color}}><span className="dept-card-top"><DeptIcon dept={d} size={40}/>{busyNow&&<span className="dept-live"><RefreshCw size={11} className="spin"/>Learning</span>}</span><strong>{d.name}</strong><p>{d.mission}</p>
    <span className="dept-stats"><span><b>{k.length}</b> in knowledge</span><span><b>{learned}</b> learned</span><span><b>{ofDept(data.asks,d.id).filter(a=>a.status==='done').length}</b> answers</span></span>
    {(coaches.length>0||helps.length>0)&&<span className="dept-links">{helps.length>0&&<>Coaches {helps.map(h=>h.name).join(', ')}</>}{coaches.length>0&&<>Coached by {coaches.map(c=>c.name).join(', ')}</>}</span>}</button>;})}</div>
  {adding&&<AddDepartment missing={missing} brand={brand} onClose={()=>setAdding(false)} onSetup={setup} refresh={refresh} notify={notify}/>}
 </>;}

function AddDepartment({missing,brand,onClose,onSetup,refresh,notify}){const[custom,setCustom]=useState({name:'',mission:'',instructions:'',color:'#334155'}),[busy,setBusy]=useState(false);
 async function create(){setBusy(true);try{await api(`/api/${brand}/departments`,{method:'POST',body:{...custom,kind:'custom',icon:'Sparkles'}});await refresh();notify(`${custom.name} is ready`);onClose();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 return <Modal title="Add a department" onClose={onClose} wide><div className="modal-body">
  {missing.length>0&&<><span className="eyebrow">READY-MADE</span><div className="template-grid small">{missing.map(k=><button key={k} className="template-card" onClick={()=>onSetup([k])}><DeptIcon dept={DEPARTMENTS[k]} size={30}/><span><strong>{DEPARTMENTS[k].name}</strong><small>{DEPARTMENTS[k].mission}</small></span><Plus size={15} className="template-check"/></button>)}</div></>}
  <span className="eyebrow" style={{marginTop:20}}>YOUR OWN</span>
  <div className="field-row"><Field label="Name"><input value={custom.name} onChange={e=>setCustom({...custom,name:e.target.value})} placeholder="e.g. Podcast producer, Photographer"/></Field><Field label="Color"><input type="color" value={custom.color} onChange={e=>setCustom({...custom,color:e.target.value})}/></Field></div>
  <Field label="Mission"><textarea rows={2} value={custom.mission} onChange={e=>setCustom({...custom,mission:e.target.value})} placeholder="What this department is responsible for"/></Field>
  <Field label="How it should work (optional)"><textarea rows={2} value={custom.instructions} onChange={e=>setCustom({...custom,instructions:e.target.value})} placeholder="Rules, what to focus on, what to avoid"/></Field>
 </div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy||!custom.name.trim()} onClick={create}>Create department</button></div></Modal>;}

/* ---------- One department ---------- */
export function DepartmentView({id,brand,data,refresh,notify,navigate,teach}){
 const dept=(data.departments||[]).find(d=>d.id===id);const[tab,setTab]=useState('knowledge'),[editing,setEditing]=useState(false);
 if(!dept)return <Empty icon={Brain} title="This department no longer exists" action={<button className="button primary" onClick={()=>navigate('departments')}>All departments</button>}/>;
 const depts=data.departments;const coaches=depts.filter(c=>c.helps?.includes(dept.id));const helps=(dept.helps||[]).map(x=>depts.find(d=>d.id===x)).filter(Boolean);
 const knowledge=ofDept(data.knowledge,dept.id);const tabs=[['knowledge',`Knowledge · ${knowledge.length}`],['playbook','Playbook'],['journal','Journal'],['ask','Ask'],...(dept.platform?[['analytics','Analytics']]:[])];
 return <><button className="text-link back-link" onClick={()=>navigate('departments')}><ArrowLeft size={14}/>All departments</button>
  <div className="dept-header" style={{'--dept':dept.color}}><DeptIcon dept={dept} size={56}/><div><span className="eyebrow">AI DEPARTMENT</span><h1>{dept.name}</h1><p>{dept.mission}</p>{(helps.length>0||coaches.length>0)&&<div className="dept-relations">{helps.map(h=><button key={h.id} onClick={()=>navigate('dept:'+h.id)}>Coaches <DeptIcon dept={h} size={18}/>{h.name}</button>)}{coaches.map(c=><button key={c.id} onClick={()=>navigate('dept:'+c.id)}>Coached by <DeptIcon dept={c} size={18}/>{c.name}</button>)}</div>}</div>
   <div className="dept-actions"><button className="button primary" onClick={()=>teach(dept.id)}><Brain size={15}/>Teach {dept.name}</button><button className="button secondary" onClick={()=>setEditing(true)}>Edit</button></div></div>
  <div className="filter-tabs dept-tabs">{tabs.map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
  {tab==='knowledge'&&<KnowledgeList dept={dept} brand={brand} data={data} refresh={refresh} notify={notify} teach={teach}/>}
  {tab==='playbook'&&<Playbook dept={dept} brand={brand} data={data} refresh={refresh} notify={notify}/>}
  {tab==='journal'&&<Journal dept={dept} data={data}/>}
  {tab==='ask'&&<AskBox dept={dept} brand={brand} data={data} refresh={refresh} notify={notify}/>}
  {tab==='analytics'&&<DeptAnalytics dept={dept} data={data} navigate={navigate}/>}
  {editing&&<EditDepartment dept={dept} brand={brand} depts={depts} onClose={()=>setEditing(false)} refresh={refresh} notify={notify} navigate={navigate}/>}
 </>;}

function KnowledgeList({dept,brand,data,refresh,notify,teach}){
 const items=ofDept(data.knowledge,dept.id).sort((a,b)=>b.created.localeCompare(a.created));const feedback=(data.deptlog||[]).filter(l=>l.kind==='feedback');
 const[open,setOpen]=useState(null);
 const act=async(fn,msg)=>{try{await fn();await refresh();if(msg)notify(msg);}catch(e){notify(e.message,'error');}};
 if(!items.length)return <Empty icon={Link2} title={`Teach ${dept.name} something`} description={dept.platform?`Paste ${dept.platform} posts you admire, accounts to watch, or notes. It learns and writes down what it notices.`:'Paste inspiration links, upload videos or documents, or write what you noticed. It learns from each one.'} action={<button className="button primary" onClick={()=>teach(dept.id)}><Plus size={16}/>Add knowledge</button>}/>;
 return <div className="knowledge-list">{items.map(k=>{const fb=feedback.filter(f=>f.knowledgeId===k.id);const expanded=open===k.id;return <article key={k.id} className={`knowledge-card ${k.status}`}>
  <div className="knowledge-main" onClick={()=>setOpen(expanded?null:k.id)}>
   <span className="knowledge-thumb">{k.frames?.[0]?<img src={k.frames[0].url} alt=""/>:k.type==='note'?<PenLine size={18}/>:k.type==='file'?<Upload size={18}/>:<Link2 size={18}/>}</span>
   <span className="knowledge-text"><strong>{k.title||k.learned?.title||host(k.url)||k.fileName||'Note'}</strong><small>{k.type==='account'?'Account to watch · ':''}{k.url?host(k.url):k.type==='file'?k.fileName:'Note'} · added {dateLabel(k.created.slice(0,10))}</small>{k.learned?.summary&&<p>{k.learned.summary}</p>}{k.status==='failed'&&<p className="error-text">{k.error}</p>}{k.status==='new'&&k.error&&<p className="muted">{k.error}</p>}{k.type==='account'&&<p className="muted">Your own AI watches this account in its browser and writes what it sees in the journal.</p>}</span>
   <span className={`knowledge-status ${k.status}`}>{['queued','learning'].includes(k.status)&&<RefreshCw size={11} className="spin"/>}{k.status==='learning'&&k.progress?k.progress:STATUS[k.status]}{k.status==='learned'&&<em>{/Local AI/.test(k.learnedBy)?'by local AI':`by ${k.learnedBy||'your AI'}`}</em>}</span>
  </div>
  {expanded&&<div className="knowledge-detail">
   {k.frames?.length>1&&<div className="knowledge-frames">{k.frames.map(f=><figure key={f.url}><img src={f.url} alt=""/><figcaption>{f.second.toFixed(1)}s</figcaption></figure>)}</div>}
   {k.note&&k.type!=='note'&&<p className="knowledge-why"><strong>Why you added it:</strong> {k.note}</p>}
   {k.type==='note'&&<p className="knowledge-why preserve-lines">{k.note}</p>}
   {k.learned&&<div className="report-two-cols"><section><h4>What it learned</h4><ul>{k.learned.takeaways.map((t,i)=><li key={i}>{t}</li>)}</ul></section><section><h4>Techniques</h4><ul>{k.learned.techniques.map((t,i)=><li key={i}>{t}</li>)}</ul></section></div>}
   {k.learned?.apply&&<p className="knowledge-apply"><strong>How we’ll use it:</strong> {k.learned.apply}</p>}
   {fb.map(f=>{const coach=data.departments.find(d=>d.id===f.departmentId);return <div key={f.id} className="coach-note"><span className="coach-head"><DeptIcon dept={coach} size={22}/><strong>{coach?.name||'Coach'}</strong><small>{f.author}</small></span><Markdown text={f.body}/></div>;})}
   {k.url&&<a className="text-link" href={k.url} target="_blank" rel="noreferrer"><Link2 size={13}/>Open the original</a>}
   <div className="knowledge-actions">{k.type!=='account'&&!['queued','learning'].includes(k.status)&&<button className="text-link" onClick={()=>act(()=>api(`/api/${brand}/knowledge/${k.id}/learn`,{method:'POST'}),'Learning again')}><RefreshCw size={13}/>{k.status==='learned'?'Learn again':'Learn now'}</button>}<button className="text-link danger" onClick={()=>act(()=>api(`/api/${brand}/knowledge/${k.id}`,{method:'DELETE'}),'Removed')}><Trash2 size={13}/>Remove</button></div>
  </div>}
 </article>;})}</div>;}

function Playbook({dept,brand,data,refresh,notify}){
 const[text,setText]=useState(dept.playbook||''),[busy,setBusy]=useState(false);const learned=ofDept(data.knowledge,dept.id).filter(k=>k.learned);
 async function save(){setBusy(true);try{await api(`/api/${brand}/departments/${dept.id}`,{method:'PATCH',body:{playbook:text}});await refresh();notify('Playbook saved');}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 return <div className="playbook-layout"><section className="panel"><div className="kit-head"><h2 className="panel-title">The playbook</h2><button className="button primary" disabled={busy||text===(dept.playbook||'')} onClick={save}><Check size={15}/>Save</button></div><p className="form-note">The rules this department follows. You and your AI can both edit it; your AI keeps it up to date as it learns.</p><textarea className="playbook-input" rows={16} value={text} onChange={e=>setText(e.target.value)} placeholder={'## Hooks\n- Show the payoff in the first frame\n\n## Rhythm\n- Cut on the beat, every 0.8 to 1.2 seconds'}/>{text&&<details className="report-body"><summary>Preview</summary><Markdown text={text}/></details>}</section>
  <section className="panel"><h2 className="panel-title">Everything it learned <span className="count-bubble">{learned.reduce((n,k)=>n+k.learned.takeaways.length,0)}</span></h2>{learned.length?learned.map(k=><div key={k.id} className="learned-group"><strong>{k.title}</strong><ul>{k.learned.takeaways.map((t,i)=><li key={i}>{t}</li>)}</ul>{k.learned.tags?.length>0&&<span className="qa-pillars">{k.learned.tags.map(t=><span key={t}>{t}</span>)}</span>}</div>):<p className="muted">Nothing learned yet.</p>}</section></div>;}

function Journal({dept,data}){
 const mine=new Set(ofDept(data.knowledge,dept.id).map(k=>k.id));
 const entries=(data.deptlog||[]).filter(l=>l.departmentId===dept.id||(l.kind==='feedback'&&mine.has(l.knowledgeId))).sort((a,b)=>b.created.localeCompare(a.created));
 if(!entries.length)return <Empty icon={Bot} title="The journal is empty" description="Each time this department learns something, gets coaching or writes a report, it appears here."/>;
 const label={learning:'Learned',feedback:'Coaching',report:'Report',note:'Note'};
 return <div className="journal">{entries.map(e=>{const who=data.departments.find(d=>d.id===e.departmentId);return <article key={e.id} className={`journal-entry ${e.kind}`}><span className="journal-meta"><DeptIcon dept={who} size={26}/><span><strong>{e.title}</strong><small>{label[e.kind]} · {who?.name} · {e.author} · {dateLabel(e.created.slice(0,10))}</small></span></span><Markdown text={e.body}/></article>;})}</div>;}

function AskBox({dept,brand,data,refresh,notify}){
 const[q,setQ]=useState(''),[busy,setBusy]=useState('');const asks=ofDept(data.asks,dept.id).sort((a,b)=>b.created.localeCompare(a.created));
 async function ask(local){setBusy(local?'local':'later');try{const a=await api(`/api/${brand}/asks`,{method:'POST',body:{departmentId:dept.id,prompt:q}});if(local)await api(`/api/${brand}/asks/${a.id}/answer`,{method:'POST'});setQ('');await refresh();notify(local?`${dept.name} is thinking`:'Saved for your AI');}catch(e){notify(e.message,'error');await refresh();}finally{setBusy('');}}
 return <><section className="panel ask-panel"><Field label={`Ask ${dept.name}`} hint="Local AI answers in seconds from what this department learned. Your own AI can go deeper and look things up."><textarea rows={3} value={q} onChange={e=>setQ(e.target.value)} placeholder={dept.kind==='video-supervisor'?'Review this script for storytelling: …':dept.kind==='video-editor'?'How should I edit a 20-second reel of our new menu?':'What should we post this week?'}/></Field>
  <div className="ask-actions"><button className="button secondary" disabled={!q.trim()||!!busy} onClick={()=>ask(false)}>{busy==='later'?<Spinner text="Saving…"/>:'Leave it for your AI'}</button><button className="button primary" disabled={!q.trim()||!!busy} onClick={()=>ask(true)}>{busy==='local'?<Spinner text="Asking…"/>:<><Send size={15}/>Ask now</>}</button></div></section>
  {asks.map(a=><article key={a.id} className="panel ask-item"><p className="ask-q">{a.prompt}</p>{a.status==='done'?<><Markdown text={a.answer}/><small className="muted">Answered by {a.answeredBy||'your AI'}</small></>:a.status==='failed'?<p className="error-text">{a.error}</p>:<p className="muted">{['queued','answering'].includes(a.status)?<><RefreshCw size={12} className="spin"/> Thinking…</>:'Waiting for your AI. Ask it to answer your departments’ questions.'}</p>}</article>)}</>;}

function DeptAnalytics({dept,data,navigate}){
 const reports=(data.reports||[]).filter(r=>r.kind==='social'&&(r.platform||'').toLowerCase().includes(dept.platform.toLowerCase())||(r.posts||[]).some(p=>p.platform===dept.platform)).sort((a,b)=>b.created.localeCompare(a.created));
 const latest=reports[0];
 if(!latest)return <Empty icon={Bot} title={`No ${dept.platform} overview yet`} description={`When your AI writes an overview that covers ${dept.platform}, this department keeps its own view of it here.`} action={<button className="button secondary" onClick={()=>navigate('insights')}>Go to AI overview</button>}/>;
 return <Report report={{...latest,posts:(latest.posts||[]).filter(p=>p.platform===dept.platform)}}/>;}

function EditDepartment({dept,brand,depts,onClose,refresh,notify,navigate}){
 const[v,setV]=useState({name:dept.name,mission:dept.mission,instructions:dept.instructions,color:dept.color,helps:dept.helps||[]}),[confirm,setConfirm]=useState(false);
 async function save(){try{await api(`/api/${brand}/departments/${dept.id}`,{method:'PATCH',body:v});await refresh();notify('Department saved');onClose();}catch(e){notify(e.message,'error');}}
 async function del(){try{await api(`/api/${brand}/departments/${dept.id}`,{method:'DELETE'});await refresh();notify(`${dept.name} removed`);onClose();navigate('departments');}catch(e){notify(e.message,'error');}}
 return <Modal title={`Edit ${dept.name}`} onClose={onClose}><div className="modal-body">
  <div className="field-row"><Field label="Name"><input value={v.name} onChange={e=>setV({...v,name:e.target.value})}/></Field><Field label="Color"><input type="color" value={v.color} onChange={e=>setV({...v,color:e.target.value})}/></Field></div>
  <Field label="Mission"><textarea rows={3} value={v.mission} onChange={e=>setV({...v,mission:e.target.value})}/></Field>
  <Field label="How it should work" hint="Rules it always follows. Your AI reads these before it does anything for this department."><textarea rows={3} value={v.instructions} onChange={e=>setV({...v,instructions:e.target.value})}/></Field>
  <div className="field"><span>Coaches these departments</span><div className="channel-options">{depts.filter(d=>d.id!==dept.id).map(d=><label key={d.id} className={v.helps.includes(d.id)?'selected':''}><input type="checkbox" checked={v.helps.includes(d.id)} onChange={()=>setV({...v,helps:v.helps.includes(d.id)?v.helps.filter(x=>x!==d.id):[...v.helps,d.id]})}/>{d.name}</label>)}</div></div>
 </div><div className="modal-actions">{confirm?<span className="delete-confirm">Remove {dept.name} and its knowledge? <button className="text-link danger" onClick={del}>Remove</button><button className="text-link" onClick={()=>setConfirm(false)}>Keep</button></span>:<button className="button danger ghost" onClick={()=>setConfirm(true)}><Trash2 size={15}/>Remove</button>}<div><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" onClick={save}>Save</button></div></div></Modal>;}
