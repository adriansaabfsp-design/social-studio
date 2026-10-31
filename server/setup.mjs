// Whether the owner's AI has finished setting up the database and the domain (see AGENTS.md, section 1).
// Read fresh from .env on every check, so the app notices as soon as the AI writes it.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const LABELS={local:'This computer (SQLite)',supabase:'Supabase',firebase:'Firebase'};
export function setupStatus(root){
 const file={};
 try{for(const line of readFileSync(path.join(root,'.env'),'utf8').split('\n')){const m=line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(m)file[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}}catch{}
 const get=k=>process.env[k]||file[k]||'';
 const db=get('STUDIO_DATABASE').trim().toLowerCase();
 let domain='';const url=get('STUDIO_PUBLIC_URL');
 if(url){try{domain=new URL(url).host;}catch{}}else if(get('STUDIO_DOMAIN').toLowerCase()==='none')domain='none';
 return {database:db?(LABELS[db]||get('STUDIO_DATABASE')):'',domain,domainLabel:domain==='none'?'This computer only':domain,ready:!!db&&!!domain};
}
