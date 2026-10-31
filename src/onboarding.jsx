import React,{useEffect,useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,Check,Eye,EyeOff,ImagePlus,Lock,Minus,Plus,Users,Wand2,X} from 'lucide-react';
import {api,TEMPLATES,TEMPLATE_KEYS,themeVars} from './lib';
import {Field,Spinner} from './components';
import {Colors,Pillars,Languages,draftWithAI,WorkspaceMark} from './workspace';
import {StoryField,FilesPanel,SocialLinks,cleanSocials,handleFrom} from './knowledge';

const FIRST=['invite','name','business','you','about','socials','look','voice'];
const MORE=['business','about','socials','look','voice'];
const SAVE_KEY='studio-onboarding';
const BLANK={name:'',tagline:'',description:'',pillars:[...TEMPLATES.other.pillars],audience:'',voice:'',compliance:'',languages:['English'],accent:TEMPLATES.other.accent,ink:TEMPLATES.other.ink,industry:'other',socials:[],logo:'',hero:'',files:[]};

export function Onboarding({mode='first',profile,setProfile,workspaces=[],notify,onDone,onClose}){
 const steps=mode==='first'?FIRST:MORE;
 const saved=(()=>{if(mode!=='first')return null;try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{return null;}})();
 const[step,setStep]=useState(()=>Math.max(0,steps.indexOf(saved?.step)));
 const[ws,setWs]=useState(()=>workspaces.find(w=>w.id===saved?.wsId)||null);
 const[v,setV]=useState(()=>({...BLANK,...(workspaces.find(w=>w.id===saved?.wsId)||{})}));
 const[me,setMe]=useState({name:profile?.name||'',about:profile?.about||'',files:profile?.files||[]});
 const[busy,setBusy]=useState(false),[ai,setAi]=useState(false);
 const[people,setPeople]=useState([]),[known,setKnown]=useState([]);
 useEffect(()=>{if(mode==='first')api('/api/invites').then(d=>{setKnown(d.invites);setPeople(d.invites.length?d.invites.map(i=>({name:i.name,email:i.email,saved:true})):Array.from({length:d.wanted},()=>({name:'',email:''})));}).catch(()=>{});},[mode]);
 const id=steps[step];const set=(k,val)=>setV(x=>({...x,[k]:val}));
 useEffect(()=>{if(mode==='first')try{localStorage.setItem(SAVE_KEY,JSON.stringify({step:steps[step],wsId:ws?.id}));}catch{}},[step,ws,mode]);
 const patch=async body=>{const next=await api(`/api/workspaces/${ws.id}`,{method:'PATCH',body});setWs(next);return next;};
 const go=n=>setStep(s=>Math.max(0,Math.min(steps.length-1,s+n)));

 async function next(){setBusy(true);try{
  if(id==='invite'){const fresh=people.filter(p=>!p.saved&&p.email.trim());await api('/api/invites',{method:'POST',body:{count:people.length,people:fresh}});}
  if(id==='name'){if(!me.name.trim())return;const p=await api('/api/profile',{method:'PUT',body:{name:me.name}});setProfile?.(x=>({...x,...p}));}
  if(id==='business'){if(!v.name.trim())return;if(!ws){const w=await api('/api/workspaces',{method:'POST',body:{name:v.name,pillars:v.pillars,accent:v.accent,ink:v.ink,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}});setWs(w);setV(x=>({...x,...w}));}else if(v.name!==ws.name)await patch({name:v.name});}
  if(id==='you'){const p=await api('/api/profile',{method:'PUT',body:{about:me.about}});setProfile?.(x=>({...x,...p}));}
  if(id==='about')await patch({description:v.description});
  if(id==='socials'){const socials=cleanSocials(v.socials);set('socials',socials);await patch({socials,handles:[...new Set(socials.map(handleFrom).filter(Boolean))].slice(0,8)});}
  if(id==='look')await patch({accent:v.accent,ink:v.ink,tagline:v.tagline});
  if(id==='voice'){const done=await patch({pillars:v.pillars,audience:v.audience,voice:v.voice,compliance:v.compliance,languages:v.languages,industry:v.industry,...(ws.journey?{}:{journey:{stage:'social'}})});
   if(mode==='first'){const p=await api('/api/profile',{method:'PUT',body:{onboarded:true}});setProfile?.(x=>({...x,...p}));try{localStorage.removeItem(SAVE_KEY);}catch{}}
   onDone(done);return;}
  go(1);}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
 async function image(kind,file){if(!file)return;try{const form=new FormData();form.append('file',file);const w=await api(`/api/workspaces/${ws.id}/image/${kind}`,{method:'POST',body:form});setWs(w);setV(x=>({...x,logo:w.logo,hero:w.hero}));}catch(e){notify(e.message,'error');}}
 const voiceNote=url=>async file=>{try{const form=new FormData();form.append('file',file);const r=await api(url,{method:'POST',body:form});if(url.startsWith('/api/profile'))setMe(x=>({...x,files:r.files}));else{setWs(r);set('files',r.files);}notify('Voice note attached');}catch(e){notify(e.message,'error');}};

 const progressSteps=steps;const pIndex=step;
 const canNext={invite:people.every(p=>p.saved||!p.email.trim()||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())),name:me.name.trim(),business:v.name.trim(),voice:v.pillars.length>0}[id]??true;
 const theme=themeVars(v);

 const setCount=n=>setPeople(list=>n>list.length?[...list,...Array.from({length:n-list.length},()=>({name:'',email:''}))]:list.slice(0,Math.max(n,list.filter(p=>p.saved).length)));
 const editPerson=(i,patch)=>setPeople(list=>list.map((p,j)=>j===i?{...p,...patch}:p));
 const body={
  invite:<><h2>How many people do you want to invite or share this with?</h2><p className="ob-sub">Partners, your team, an agency. Each person gets their own login.</p>
   <div className="invite-count"><button type="button" aria-label="Fewer people" disabled={people.length<=people.filter(p=>p.saved).length} onClick={()=>setCount(people.length-1)}><Minus size={18}/></button><span><strong>{people.length}</strong>{people.length===0?'Just me for now':people.length===1?'person':'people'}</span><button type="button" aria-label="More people" disabled={people.length>=50} onClick={()=>setCount(people.length+1)}><Plus size={18}/></button></div>
   {people.length>0&&<div className="invite-rows">{people.map((p,i)=><div className="invite-row" key={i}><span className="invite-num">{i+1}</span><input value={p.name} disabled={p.saved} onChange={e=>editPerson(i,{name:e.target.value})} placeholder="Name"/><input type="email" value={p.email} disabled={p.saved} onChange={e=>editPerson(i,{email:e.target.value})} placeholder="Email"/>{p.saved&&<span className="invite-saved"><Check size={13}/>Saved</span>}</div>)}</div>}
   {people.length>0&&<p className="ob-note"><Users size={15}/>Tell your local AI to invite them. It sets up access in your database and sends the invitations.</p>}</>,
  name:<><h2>Tell us your name</h2><p className="ob-sub">So your studio feels like yours.</p><input className="ob-input" autoFocus value={me.name} maxLength={80} onChange={e=>setMe({...me,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&canNext&&next()} placeholder="Your name"/></>,
  business:<><h2>What is your business name?</h2><p className="ob-sub">You can add more businesses later.</p><input className="ob-input" autoFocus value={v.name} maxLength={80} onChange={e=>set('name',e.target.value)} onKeyDown={e=>e.key==='Enter'&&canNext&&next()} placeholder="Business name"/>
</>,
  you:<><h2>Talk about yourself</h2><p className="ob-sub">As much detail as you like: who you are, your age, what you love, your taste, how you like to work and to be spoken to. Type, dictate, or upload anything about you. Only you and your AI see this.</p>
   <StoryField value={me.about} onChange={t=>setMe({...me,about:t})} notify={notify} onAudio={voiceNote('/api/profile/files')} placeholder="I'm… I started… I love… I can't stand… When I make content I…"/>
   <FilesPanel files={me.files} uploadUrl="/api/profile/files" removeUrl={i=>`/api/profile/files/${i}`} onChanged={p=>{setMe(x=>({...x,files:p.files}));setProfile?.(x=>({...x,files:p.files}));}} notify={notify} empty="CV, photos of you, interviews, voice notes, anything that helps."/></>,
  about:<><h2>Now talk about your business</h2><p className="ob-sub">What you sell, who comes to you, your story, prices, what makes you different, what customers say. Add photos and documents too: menus, brochures, price lists.</p>
   <StoryField value={v.description} onChange={t=>set('description',t)} notify={notify} onAudio={ws&&voiceNote(`/api/workspaces/${ws.id}/files`)} placeholder={`${v.name||'We'} started… Our customers… What makes us different…`}/>
   {ws&&<FilesPanel files={ws.files||[]} uploadUrl={`/api/workspaces/${ws.id}/files`} removeUrl={i=>`/api/workspaces/${ws.id}/files/${i}`} onChanged={w=>{setWs(w);set('files',w.files);}} notify={notify} empty="Photos of the place, products and team, menus, brochures."/>}</>,
  socials:<><h2>Add your social media links</h2><p className="ob-sub">Your AI will look at these accounts later. Paste a link or an @handle.</p><SocialLinks value={v.socials.length?v.socials:[{platform:'Instagram',url:''},{platform:'TikTok',url:''}]} onChange={x=>set('socials',x)}/></>,
  look:<div className="wizard-split"><div><h2>Look & feel</h2><p className="ob-sub">Your colors re-theme the whole studio.</p>
   <div className="field-row"><label className="upload-tile"><input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>image('logo',e.target.files[0])}/>{v.logo?<img src={v.logo} alt=""/>:<ImagePlus size={22}/>}<span>{v.logo?'Change logo':'Upload logo'}</span></label><label className="upload-tile wide"><input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>image('hero',e.target.files[0])}/>{v.hero?<img src={v.hero} alt=""/>:<ImagePlus size={22}/>}<span>{v.hero?'Change cover':'Create a cover'}</span></label></div>
   <Colors v={v} set={set}/><Field label="Tagline (optional)"><input value={v.tagline} maxLength={160} onChange={e=>set('tagline',e.target.value)} placeholder="One line people remember"/></Field></div>
   <aside className="wizard-preview"><span className="eyebrow">PREVIEW</span><div className="preview-card"><div className="preview-top"><WorkspaceMark ws={v} size={40}/><span><strong>{v.name}</strong><small>{v.tagline||'Your tagline'}</small></span></div><div className="preview-hero" style={{background:v.hero?`center/cover url(${v.hero})`:`linear-gradient(135deg,${v.accent},${v.ink})`}}/><span className="preview-button">Create content</span></div></aside></div>,
  voice:<><h2>Voice & content</h2><p className="ob-sub">How {v.name||'you'} sounds and what you post about. Let AI draft it from what you told us, then edit.</p>
   <button type="button" className="button secondary ai-draft" disabled={ai||!v.description.trim()} onClick={()=>draftWithAI(v,setV,notify,setAi)}>{ai?<Spinner text="Drafting with local AI…"/>:<><Wand2 size={15}/>Draft it with AI</>}</button>
   <div className="field"><span>Content pillars</span><Pillars value={v.pillars} onChange={x=>set('pillars',x)}/><small>The 3 to 5 themes you post about again and again.</small></div>
   <div className="field-row"><Field label="Audience"><textarea rows={2} value={v.audience} onChange={e=>set('audience',e.target.value)} placeholder="Who you want to reach"/></Field><Field label="Brand voice"><textarea rows={2} value={v.voice} onChange={e=>set('voice',e.target.value)} placeholder="e.g. Warm, witty, never pushy"/></Field></div>
   <div className="field-row"><Field label="Review rule (optional)" hint="Anything that must be checked before posting."><input value={v.compliance} onChange={e=>set('compliance',e.target.value)}/></Field><Field label="Type of business"><select value={v.industry} onChange={e=>set('industry',e.target.value)}>{TEMPLATE_KEYS.map(k=><option key={k} value={k}>{TEMPLATES[k].label}</option>)}</select></Field></div>
   <div className="field"><span>Languages you post in</span><Languages value={v.languages} onChange={x=>set('languages',x)}/></div></>,
 }[id];

 return <Shell theme={theme} onClose={onClose} wide={id==='look'}>
  <div className="ob-progress"><span>Step {pIndex+1} of {progressSteps.length}</span><div><i style={{width:`${(pIndex+1)/progressSteps.length*100}%`}}/></div></div>
  <div className="ob-screen">{body}</div>
  <div className="ob-actions">{step>0?<button className="button secondary" onClick={()=>go(-1)}><ArrowLeft size={15}/>Back</button>:<span/>}<div>{['socials','look'].includes(id)&&<button className="text-link" onClick={()=>go(1)}>Skip for now</button>}<button className="button primary" disabled={!canNext||busy} onClick={next}>{busy?<Spinner text="Saving…"/>:id==='voice'?<><Check size={16}/>Finish</>:<>Continue<ArrowRight size={15}/></>}</button></div></div>
 </Shell>;
}

function Shell({children,theme,onClose,wide}){return <div className="ob" style={theme}><div className={`ob-card ${wide?'wide':''}`}>{onClose&&<button className="ob-close" aria-label="Close" onClick={onClose}><X size={18}/></button>}{children}</div></div>;}

/* Before sign-in: welcome, database, then the login page your AI set up */
export function SignIn({auth,onSignedIn,notify,recheck}){
 const first=!auth.onboarded&&!auth.hasAccount;const setup=auth.setup||{};
 // While the owner's AI is still setting things up, check again every few seconds.
 useEffect(()=>{if(setup.ready||auth.hasAccount)return;const t=setInterval(()=>recheck?.(),3000);return()=>clearInterval(t);},[setup.ready,auth.hasAccount]);
 const[screen,setScreen]=useState(first?'welcome':(!auth.hasAccount&&!setup.ready)?'database':'login');
 const[mode,setMode]=useState(auth.signupOpen&&!auth.hasAccount?'signup':'login');
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState('');
 async function submit(e){e.preventDefault();setError('');setInfo('');if(mode==='signup'&&password!==confirm){setError('The passwords don’t match.');return;}setBusy(true);
  try{const r=await fetch(`/api/auth/${mode==='signup'?'signup':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json().catch(()=>({}));
   if(r.status===202){setInfo(d.message);setMode('login');}else if(!r.ok)setError(d.error||'Something went wrong.');else onSignedIn();}
  catch{setError('Social Studio is not reachable. Make sure it is running.');}finally{setBusy(false);}}
 const theme=themeVars({accent:'#0b6e4f',ink:'#123b36'});
 if(screen==='welcome')return <Shell theme={theme}><div className="ob-hero"><span className="ob-logo"><Activity size={30}/></span><h1>Welcome to Social Studio</h1><p>Plan, film and measure social media for any business. Your data and AI stay with you.</p><button className="button primary ob-big" onClick={()=>setScreen('database')}>Thanks, Adrian<ArrowRight size={17}/></button></div></Shell>;
 if(screen==='database')return <Shell theme={theme}><div className="ob-screen ob-database"><span className="ob-kicker">BEFORE YOU START</span><h2>Please tell your local AI to set up the database and domain for this project after cloning the repo.</h2>
  <div className="setup-checks">{[['Database',setup.database],['Domain',setup.domainLabel]].map(([label,value])=><div key={label} className={value?'ready':''}><span className="setup-dot">{value?<Check size={14}/>:<span className="spinner-ring"/>}</span><strong>{label}</strong><em>{value||'Waiting for your AI…'}</em></div>)}</div>
  {!setup.ready&&<p className="setup-hint">You can link an existing domain and database, like your business website.</p>}</div>
  <div className="ob-actions"><button className="button secondary" onClick={()=>setScreen('welcome')}><ArrowLeft size={15}/>Back</button><button className="button primary" disabled={!setup.ready} onClick={()=>auth.provider==='none'?onSignedIn():setScreen('login')}>{setup.ready?<>Done<Check size={15}/></>:'Waiting for setup'}</button></div></Shell>;
 const signup=mode==='signup';
 return <Shell theme={theme}><form className="ob-screen ob-auth" onSubmit={submit}><span className="ob-logo small"><Lock size={20}/></span><h2>{signup?'Create your account':'Log in'}</h2><p className="ob-sub">{signup?'You’ll use this to open Social Studio from now on.':'Welcome back.'}</p>
  <Field label="Email"><input type="email" autoComplete="email" autoFocus required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com"/></Field>
  <Field label="Password" hint={signup?'At least 8 characters.':undefined}><span className="password-field"><input type={show?'text':'password'} autoComplete={signup?'new-password':'current-password'} required minLength={signup?8:undefined} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></Field>
  {signup&&<Field label="Confirm password"><input type={show?'text':'password'} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></Field>}
  {error&&<p className="auth-error" role="alert">{error}</p>}{info&&<p className="ob-note"><Check size={15}/>{info}</p>}
  <button className="button primary ob-big auth-submit" disabled={busy}>{busy?<Spinner text={signup?'Creating your account…':'Logging in…'}/>:signup?'Create account':'Log in'}</button>
  <div className="auth-foot">{auth.signupOpen&&(auth.hasAccount||!signup)&&<button type="button" className="text-link" onClick={()=>{setMode(signup?'login':'signup');setError('');}}>{signup?'I already have an account':'Create a new account'}</button>}<span>{auth.provider==='local'?'Your account stays on this computer':`Secured by ${auth.providerLabel}`}</span></div>
 </form></Shell>;}
