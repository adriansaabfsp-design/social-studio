// Voice library: ElevenLabs instant voice cloning and voiceovers for team members.
// Unlike the rest of the studio, these calls leave the Mac: samples and text are sent to ElevenLabs.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getWorkspace } from './workspaces.mjs';
const exec=promisify(execFile);
const API='https://api.elevenlabs.io/v1';
const fail=(status,message)=>Object.assign(new Error(message),{status});

export function voiceKey(store){return process.env.ELEVENLABS_API_KEY||store.meta('elevenlabs_key')||'';}

async function eleven(key,url,options={}){
 const r=await fetch(API+url,{...options,headers:{'xi-api-key':key,...options.headers},signal:AbortSignal.timeout(120000)});
 if(!r.ok){let detail='';try{const d=await r.json();detail=d.detail?.message||d.detail?.status||(typeof d.detail==='string'?d.detail:'');}catch{}
  if(r.status===401)throw fail(401,'ElevenLabs rejected the API key. Check it in Settings.');
  throw fail(r.status>=500?502:400,'ElevenLabs: '+(detail||`request failed (${r.status})`));}
 return r;
}

export async function connectKey(store,key){
 key=String(key||'').trim();if(!/^[A-Za-z0-9_-]{20,200}$/.test(key))throw fail(400,'Paste a valid ElevenLabs API key.');
 const user=await (await eleven(key,'/user')).json();
 store.setMeta('elevenlabs_key',key);
 return {connected:true,tier:user.subscription?.tier||null};
}
export function disconnectKey(store){store.db.prepare('DELETE FROM metadata WHERE key=?').run('elevenlabs_key');}

/* Samples are normalised to mono mp3 so any browser recording or phone file works. */
export async function addSample({store,brand,member,file,mediaDir}){
 const name=randomUUID()+'.mp3';const out=path.join(mediaDir,name);
 try{await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',file.path,'-vn','-ac','1','-ar','44100','-b:a','128k',out],{timeout:120000,maxBuffer:1e6});}
 catch{throw fail(400,'This file could not be read as audio.');}finally{await unlink(file.path).catch(()=>{});}
 const probe=JSON.parse((await exec('ffprobe',['-v','quiet','-print_format','json','-show_format',out],{timeout:20000})).stdout);
 const seconds=Math.round(Number(probe.format?.duration||0));
 if(seconds<3){await unlink(out).catch(()=>{});throw fail(400,'Use a sample of at least a few seconds of speech.');}
 const samples=[...(member.voiceSamples||[]),{url:'/media/'+name,name:file.originalname.slice(0,120),seconds}].slice(-10);
 return store.save(brand,'team',{...member,voiceSamples:samples},member.id);
}

export async function cloneVoice({store,brand,member,consentBy,mediaDir}){
 const key=voiceKey(store);if(!key)throw fail(400,'Connect ElevenLabs in Settings first.');
 if(!consentBy?.trim())throw fail(400,'Confirm that this person agreed to have their voice cloned.');
 const samples=member.voiceSamples||[];if(!samples.length)throw fail(400,'Add at least one voice sample first.');
 const form=new FormData();
 form.append('name',`${member.name} · ${getWorkspace(store,brand)?.name||'Social Studio'}`.slice(0,100));
 form.append('description',`Social Studio voice for ${member.name}${member.role?' ('+member.role+')':''}. Consent confirmed by ${consentBy.trim()}.`.slice(0,500));
 form.append('remove_background_noise','true');
 for(const s of samples)form.append('files',new Blob([await readFile(path.join(mediaDir,path.basename(s.url)))],{type:'audio/mpeg'}),path.basename(s.url));
 if(member.voiceId)await eleven(key,'/voices/'+member.voiceId,{method:'DELETE'}).catch(()=>{});
 const {voice_id}=await (await eleven(key,'/voices/add',{method:'POST',body:form})).json();
 return store.save(brand,'team',{...member,voiceId:voice_id,voiceConsent:{by:consentBy.trim().slice(0,120),date:new Date().toISOString()},voiceCreated:new Date().toISOString()},member.id);
}

export async function speak({store,brand,member,text,mediaDir}){
 const key=voiceKey(store);if(!key)throw fail(400,'Connect ElevenLabs in Settings first.');
 if(!member.voiceId)throw fail(400,'Create a voice clone for this person first.');
 text=String(text||'').replace(/\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim();
 if(!text)throw fail(400,'Write what they should say.');if(text.length>2500)throw fail(400,'Keep each voiceover under 2,500 characters.');
 const r=await eleven(key,`/text-to-speech/${member.voiceId}?output_format=mp3_44100_128`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:.5,similarity_boost:.8}})});
 const name=randomUUID()+'.mp3';await writeFile(path.join(mediaDir,name),Buffer.from(await r.arrayBuffer()));
 const clip={id:randomUUID(),text:text.slice(0,2500),url:'/media/'+name,created:new Date().toISOString()};
 const fresh=store.get(brand,'team',member.id);
 store.save(brand,'team',{...fresh,voiceClips:[clip,...(fresh.voiceClips||[])].slice(0,50)},member.id);
 return clip;
}

export async function deleteRemoteVoice(store,voiceId){const key=voiceKey(store);if(voiceId&&key)await eleven(key,'/voices/'+voiceId,{method:'DELETE'}).catch(()=>{});}
export async function removeVoice({store,brand,member}){
 await deleteRemoteVoice(store,member.voiceId);
 return store.save(brand,'team',{...member,voiceId:'',voiceConsent:null},member.id);
}
