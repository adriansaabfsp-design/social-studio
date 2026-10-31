import React,{useEffect,useRef,useState} from 'react';
import {FileText,Film,ImagePlus,Mic,Music,Plus,Square,Trash2,Upload,X} from 'lucide-react';
import {api} from './lib';
import {Spinner} from './components';

/* ---------- Dictation: speak instead of typing ---------- */
const DICTATION_LANGS=[['en-US','English'],['ar-LB','العربية'],['fr-FR','Français']];
export function MicButton({onText,onAudio,notify}){
 const SR=typeof window!=='undefined'&&(window.SpeechRecognition||window.webkitSpeechRecognition);
 const[on,setOn]=useState(false),[recording,setRecording]=useState(false),[lang,setLang]=useState(()=>{try{return localStorage.getItem('dictation-lang')||'en-US';}catch{return 'en-US';}});
 const rec=useRef(),media=useRef(),chunks=useRef([]);
 useEffect(()=>()=>{try{rec.current?.stop();media.current?.stop();}catch{}},[]);
 function dictate(){if(on){rec.current?.stop();return;}const r=new SR();r.lang=lang;r.continuous=true;r.interimResults=false;
  r.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)t+=e.results[i][0].transcript;if(t.trim())onText(t.trim());};
  r.onerror=e=>{setOn(false);if(e.error!=='aborted'&&e.error!=='no-speech')notify?.(e.error==='not-allowed'?'Allow microphone access to dictate.':'Dictation is unavailable here. Use "Record a voice note" instead.','error');};
  r.onend=()=>setOn(false);rec.current=r;try{r.start();setOn(true);}catch{setOn(false);}}
 async function record(){if(recording){media.current?.stop();return;}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const m=new MediaRecorder(stream);chunks.current=[];m.ondataavailable=e=>e.data.size&&chunks.current.push(e.data);m.onstop=()=>{stream.getTracks().forEach(t=>t.stop());setRecording(false);const type=m.mimeType||'audio/webm';onAudio?.(new File([new Blob(chunks.current,{type})],`Voice note ${new Date().toLocaleString()}.${type.includes('mp4')?'m4a':'webm'}`,{type}));};media.current=m;m.start();setRecording(true);}catch{notify?.('Allow microphone access to record.','error');}}
 return <div className="mic-row">
  {SR&&<button type="button" className={`mic-button ${on?'live':''}`} onClick={dictate}>{on?<><Square size={13} fill="currentColor"/>Stop dictating</>:<><Mic size={15}/>Dictate</>}</button>}
  {SR&&<select aria-label="Dictation language" value={lang} onChange={e=>{setLang(e.target.value);try{localStorage.setItem('dictation-lang',e.target.value);}catch{}}}>{DICTATION_LANGS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
  {onAudio&&<button type="button" className={`text-link record-link ${recording?'live':''}`} onClick={record}>{recording?<><Square size={11} fill="currentColor"/>Stop and attach recording</>:<><Music size={13}/>Record a voice note</>}</button>}
  {on&&<span className="mic-live"><i/>Listening… speak naturally</span>}
 </div>;}

/* Big writing area with dictation */
export function StoryField({value,onChange,placeholder,rows=9,onAudio,notify,hint}){
 const add=t=>onChange((value?value.replace(/\s*$/,'')+(/[.!?]$/.test(value.trim())||!value.trim()?' ':'. '):'')+t);
 const words=(value||'').trim().split(/\s+/).filter(Boolean).length;
 return <div className="story-field"><textarea dir="auto" rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/><div className="story-foot"><MicButton onText={add} onAudio={onAudio} notify={notify}/><span className="story-count">{words} words{hint?` · ${hint}`:''}</span></div></div>;}

/* ---------- Files ---------- */
const fmtSize=n=>n>1e6?(n/1e6).toFixed(1)+' MB':Math.max(1,Math.round(n/1e3))+' KB';
const KIND_ICON={document:FileText,audio:Music,video:Film};
export function FilesPanel({files=[],uploadUrl,onChanged,removeUrl,notify,accept,title='Files',empty='Nothing uploaded yet.'}){
 const[busy,setBusy]=useState(0),[drag,setDrag]=useState(false);
 async function upload(list){const items=[...list];setBusy(items.length);let last;for(const f of items){try{const form=new FormData();form.append('file',f);last=await api(uploadUrl,{method:'POST',body:form});}catch(e){notify?.(`${f.name}: ${e.message}`,'error');}setBusy(n=>n-1);}if(last)onChanged(last);}
 async function remove(i){try{onChanged(await api(removeUrl(i),{method:'DELETE'}));}catch(e){notify?.(e.message,'error');}}
 return <div className="files-panel">
  <label className={`file-drop ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);upload(e.dataTransfer.files);}}>
   <input type="file" multiple hidden accept={accept} onChange={e=>{upload(e.target.files);e.target.value='';}}/>
   {busy?<Spinner text={`Uploading ${busy} file${busy>1?'s':''}…`}/>:<><Upload size={20}/><strong>Drop files here or choose files</strong><small>Photos, PDFs, documents, voice notes, videos · up to 200 MB each</small></>}
  </label>
  {files.length>0?<div className="file-grid">{files.map((f,i)=>{const Icon=KIND_ICON[f.kind]||FileText;return <div className="file-card" key={f.url}>
   <a href={f.url} target="_blank" rel="noreferrer" className="file-thumb">{f.kind==='image'?<img src={f.url} alt=""/>:<Icon size={22}/>}</a>
   <div className="file-meta"><strong title={f.name}>{f.name}</strong><small>{f.kind}{f.size?` · ${fmtSize(f.size)}`:''}{f.text?' · text read':''}</small></div>
   <button type="button" aria-label={`Remove ${f.name}`} onClick={()=>remove(i)}><X size={13}/></button></div>;})}</div>:<p className="muted files-empty">{empty}</p>}
 </div>;}

/* ---------- Social links ---------- */
export const PLATFORMS=['Instagram','TikTok','Facebook','YouTube','LinkedIn','X','Snapchat','Pinterest','Website','Other'];
const HOSTS={Instagram:'instagram.com',TikTok:'tiktok.com',Facebook:'facebook.com',YouTube:'youtube.com',LinkedIn:'linkedin.com',X:'x.com',Snapchat:'snapchat.com',Pinterest:'pinterest.com'};
export function normalizeLink(url,platform){let v=String(url||'').trim();if(!v)return '';if(v.startsWith('@')&&HOSTS[platform])v=`https://${HOSTS[platform]}/${platform==='TikTok'?'@':''}${v.slice(1)}`;if(!/^https?:\/\//i.test(v))v='https://'+v.replace(/^\/+/,'');return v;}
export const handleFrom=s=>{try{const seg=new URL(s.url).pathname.split('/').filter(Boolean)[0];return seg&&/^@?[a-zA-Z0-9_.]{1,40}$/.test(seg)?'@'+seg.replace(/^@/,''):null;}catch{return null;}};
export function SocialLinks({value,onChange}){
 const used=new Set(value.map(s=>s.platform));
 const set=(i,patch)=>onChange(value.map((s,j)=>j===i?{...s,...patch}:s));
 return <div className="social-links">{value.map((s,i)=><div className="social-row" key={i}><select value={s.platform} onChange={e=>set(i,{platform:e.target.value})}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select><input value={s.url} onChange={e=>set(i,{url:e.target.value})} onBlur={e=>set(i,{url:normalizeLink(e.target.value,s.platform)})} placeholder={HOSTS[s.platform]?`${HOSTS[s.platform]}/yourbusiness or @yourbusiness`:'https://'}/><button type="button" aria-label="Remove link" onClick={()=>onChange(value.filter((_,j)=>j!==i))}><Trash2 size={14}/></button></div>)}
  <div className="social-add">{PLATFORMS.filter(p=>!used.has(p)||['Website','Other'].includes(p)).map(p=><button type="button" key={p} onClick={()=>onChange([...value,{platform:p,url:''}])}><Plus size={12}/>{p}</button>)}</div></div>;}
export const cleanSocials=list=>list.map(s=>({platform:s.platform,url:normalizeLink(s.url,s.platform)})).filter(s=>s.url);

/* ---------- Minimal, safe markdown for AI reports ---------- */
function inline(text,key=0){const out=[];const re=/(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|`[^`]+`)/g;let last=0,m,i=0;
 while((m=re.exec(text))){if(m.index>last)out.push(text.slice(last,m.index));const t=m[0];
  if(t.startsWith('**'))out.push(<strong key={key+'-'+i++}>{t.slice(2,-2)}</strong>);
  else if(t.startsWith('['))out.push(<a key={key+'-'+i++} href={m[2]} target="_blank" rel="noreferrer">{t.slice(1,t.indexOf(']'))}</a>);
  else out.push(<code key={key+'-'+i++}>{t.slice(1,-1)}</code>);last=m.index+t.length;}
 if(last<text.length)out.push(text.slice(last));return out;}
export function Markdown({text}){
 const lines=String(text||'').replace(/\r/g,'').split('\n');const blocks=[];let i=0;
 while(i<lines.length){const l=lines[i];
  if(!l.trim()){i++;continue;}
  const h=l.match(/^(#{1,4})\s+(.*)/);if(h){const T=`h${Math.min(6,h[1].length+2)}`;blocks.push(<T key={i}>{inline(h[2],i)}</T>);i++;continue;}
  if(/^\s*\|/.test(l)){const rows=[];while(i<lines.length&&/^\s*\|/.test(lines[i])){if(!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i]))rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++;}
   blocks.push(<div className="md-table" key={'t'+i}><table><thead><tr>{rows[0]?.map((c,j)=><th key={j}>{inline(c,j)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r,k)=><tr key={k}>{r.map((c,j)=><td key={j}>{inline(c,k+'-'+j)}</td>)}</tr>)}</tbody></table></div>);continue;}
  if(/^\s*([-*]|\d+[.)])\s+/.test(l)){const ordered=/^\s*\d/.test(l);const items=[];while(i<lines.length&&/^\s*([-*]|\d+[.)])\s+/.test(lines[i])){items.push(lines[i].replace(/^\s*([-*]|\d+[.)])\s+/,''));i++;}
   const L=ordered?'ol':'ul';blocks.push(<L key={'l'+i}>{items.map((t,k)=><li key={k}>{inline(t,k)}</li>)}</L>);continue;}
  const para=[];while(i<lines.length&&lines[i].trim()&&!/^(#{1,4}\s|\s*\||\s*([-*]|\d+[.)])\s)/.test(lines[i])){para.push(lines[i]);i++;}
  blocks.push(<p key={'p'+i}>{inline(para.join(' '),i)}</p>);}
 return <div className="markdown">{blocks}</div>;}
