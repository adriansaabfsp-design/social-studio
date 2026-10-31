// Personal and business knowledge: what the owner and their AI should always know.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const exec=promisify(execFile);

export const DOC_TYPES=/\.(pdf|docx?|rtf|odt|pages|txt|md|csv|json|xlsx?|numbers|pptx?|key|png|jpe?g|webp|heic|gif|svg|mp3|m4a|wav|aac|ogg|webm|mp4|mov|m4v)$/i;

export function getProfile(store){
 let p={};try{p=JSON.parse(store.meta('profile')||'{}');}catch{}
 return {name:p.name??store.meta('owner-name')??'',about:p.about||'',files:p.files||[],onboarded:!!p.onboarded};
}
export function saveProfile(store,patch){
 const p={...getProfile(store)};
 if('name' in patch)p.name=String(patch.name||'').trim().slice(0,80);
 if('about' in patch)p.about=String(patch.about||'').slice(0,20000);
 if('onboarded' in patch)p.onboarded=!!patch.onboarded;
 if(patch.files)p.files=patch.files.slice(0,200);
 store.setMeta('profile',JSON.stringify(p));store.setMeta('owner-name',p.name);
 return p;
}

/* Readable text from common document types, so local AI and agents can use it without opening the file. */
async function extractText(file){
 const ext=path.extname(file).toLowerCase();
 try{
  if(['.txt','.md','.csv','.json'].includes(ext))return (await readFile(file,'utf8')).slice(0,20000);
  if(['.doc','.docx','.rtf','.odt','.html'].includes(ext))return (await exec('textutil',['-convert','txt','-stdout',file],{timeout:30000,maxBuffer:5e6})).stdout.slice(0,20000);
 }catch{}
 return '';
}
export async function fileRecord(file){
 const ext=path.extname(file.filename).toLowerCase();
 const kind=/\.(png|jpe?g|webp|heic|gif|svg)$/.test(ext)?'image':/\.(mp3|m4a|wav|aac|ogg|webm)$/.test(ext)?'audio':/\.(mp4|mov|m4v)$/.test(ext)?'video':'document';
 return {url:'/media/'+file.filename,name:file.originalname.slice(0,160),kind,size:file.size,uploaded:new Date().toISOString(),text:await extractText(file.path)};
}
/* Absolute paths let a local AI agent open the original files. */
export const withPaths=(files,mediaDir)=>(files||[]).map(({text,...f})=>({...f,path:path.join(mediaDir,path.basename(f.url)),hasText:!!text,excerpt:text?text.slice(0,1500):undefined}));
