import React,{useEffect,useState} from 'react';
import {ArrowUpRight,AtSign,Bot,FileText,FolderOpen,Mic2,Palette,Users} from 'lucide-react';
import {api,initials,dateLabel,TEMPLATES} from './lib';
import {Platform} from './components';
import {WorkspaceMark} from './workspace';

const excerpt=(t,n=150)=>{t=(t||'').trim();return t.length>n?t.slice(0,n).replace(/\s+\S*$/,'')+'…':t;};
function Thumbs({files=[],max=4}){const shown=files.slice(0,max);const more=files.length-shown.length;
 return <div className="qa-thumbs">{shown.map(f=><span key={f.url} className="qa-thumb">{f.kind==='image'?<img src={f.url} alt=""/>:<FileText size={15}/>}</span>)}{more>0&&<span className="qa-thumb more">+{more}</span>}</div>;}
function Card({icon:Icon,title,onClick,className='',children,empty}){return <button className={`qa-card ${className}`} onClick={onClick}><span className="qa-head"><span className="qa-icon"><Icon size={15}/></span><strong>{title}</strong><ArrowUpRight size={14} className="qa-go"/></span>{empty?<span className="qa-empty">{empty}</span>:children}</button>;}

/* Top of the overview: your personal folder first, then everything from onboarding, one click away. */
export function QuickAccess({profile,workspace:ws,data,navigate}){
 const[people,setPeople]=useState([]);
 useEffect(()=>{api('/api/invites').then(d=>setPeople(d.invites)).catch(()=>{});},[]);
 const socials=(ws.socials||[]).filter(s=>s.platform!=='Website');const website=(ws.socials||[]).find(s=>s.platform==='Website');
 const latest=(data.reports||[]).filter(r=>r.kind==='social').sort((a,b)=>b.created.localeCompare(a.created))[0];
 const pending=(data.requests||[]).filter(r=>r.status==='pending').length;
 return <section className="quick-access" aria-label="Quick access">
  <button className="qa-card qa-personal" onClick={()=>navigate('me')}>
   <span className="qa-head"><span className="qa-icon"><FolderOpen size={15}/></span><strong>Your personal folder</strong><ArrowUpRight size={14} className="qa-go"/></span>
   <span className="qa-person"><span className="avatar big">{initials(profile.name||'You')}</span><span><strong>{profile.name||'Add your name'}</strong><small>{(profile.files||[]).length} file{(profile.files||[]).length===1?'':'s'} · only you and your AI</small></span></span>
   <p className="qa-text">{excerpt(profile.about,260)||'Tell your AI who you are: your story, taste and how you like to work.'}</p>
   <Thumbs files={profile.files}/>
  </button>
  <Card icon={FolderOpen} title="Business" onClick={()=>navigate('business')} empty={!ws.description&&!(ws.files||[]).length&&'Describe your business and add photos.'}>
   <span className="qa-row"><WorkspaceMark ws={ws} size={26}/><span className="qa-strong">{ws.name}</span></span><p className="qa-text small">{excerpt(ws.description,110)}</p><Thumbs files={ws.files} max={5}/></Card>
  <Card icon={AtSign} title="Social accounts" onClick={()=>navigate('business')} empty={!socials.length&&!website&&'Add your social links.'}>
   <span className="qa-socials">{socials.slice(0,5).map(s=><span key={s.url}><Platform name={s.platform} small/>{(()=>{try{return decodeURIComponent(new URL(s.url).pathname.split('/').filter(Boolean)[0]||new URL(s.url).host);}catch{return s.platform;}})()}</span>)}{website&&<span className="qa-web">{website.url.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'')}</span>}</span></Card>
  <Card icon={Palette} title="Look & feel" onClick={()=>navigate('brand')}>
   <span className="qa-row"><span className="qa-swatch" style={{background:ws.accent}}/><span className="qa-swatch" style={{background:ws.ink}}/>{ws.hero&&<img className="qa-cover" src={ws.hero} alt=""/>}</span><p className="qa-text small">{ws.tagline||'No tagline yet.'}</p></Card>
  <Card icon={Mic2} title="Voice & content" onClick={()=>navigate('brand')}>
   <span className="qa-pillars">{(ws.pillars||[]).slice(0,4).map(p=><span key={p}>{p}</span>)}</span><p className="qa-text small">{excerpt(ws.voice,90)||(TEMPLATES[ws.industry]?.label)}</p></Card>
  <Card icon={Users} title="People" onClick={()=>navigate('settings')} empty={!people.length&&'Just you. Invite partners or your team.'}>
   <span className="avatar-stack qa-people">{people.slice(0,5).map(p=><i key={p.id} title={`${p.name||p.email} · ${p.status}`}>{initials(p.name||p.email)}</i>)}</span><p className="qa-text small">{people.filter(p=>p.status==='joined').length} joined · {people.filter(p=>p.status!=='joined').length} waiting</p></Card>
  <Card icon={Bot} title="AI overview" onClick={()=>navigate('insights')} empty={!latest&&!pending&&'Your AI’s first look at your social media appears here.'}>
   {latest&&<><span className="qa-strong">{latest.title}</span><p className="qa-text small">{dateLabel(latest.created.slice(0,10),{month:'short',day:'numeric',year:'numeric'})}{latest.stats?.[0]?` · ${latest.stats[0].label}: ${latest.stats[0].value}`:''}</p></>}{pending>0&&<span className="qa-pending">{pending} overview{pending>1?'s':''} requested</span>}</Card>
 </section>;}
