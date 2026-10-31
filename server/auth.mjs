// Sign-in. The app always keeps its own session cookie; a provider only checks the email and password.
// Providers: "local" (default, accounts stored on this computer), "supabase", "firebase",
// or "none" to skip sign-in, allowed only when Social Studio is not on a domain (this computer only).
// The owner's AI chooses one by setting AUTH_PROVIDER and the provider's keys in .env (see AGENTS.md).
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DAY=86400000, SESSION_DAYS=30;
const fail=(status,message)=>Object.assign(new Error(message),{status});
const cleanEmail=e=>String(e||'').trim().toLowerCase();
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function createAuth(store,dataDir){
 store.db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT, provider TEXT NOT NULL, created TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user TEXT NOT NULL, expires INTEGER NOT NULL);');
 const provider=(process.env.AUTH_PROVIDER||'local').toLowerCase();
 // A key the owner's local AI reads from disk to call the API on their behalf.
 const keyFile=path.join(dataDir,'agent-key');
 if(!existsSync(keyFile))writeFileSync(keyFile,randomBytes(24).toString('hex'),{mode:0o600});
 const agentKey=readFileSync(keyFile,'utf8').trim();
 const attempts=new Map();

 const users=()=>store.db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
 // People the owner wants to share the studio with. Their AI sets up access and sends the invitations (AGENTS.md).
 const invites=()=>store.list('_system','invites').sort((a,b)=>a.created.localeCompare(b.created));
 const invitedOpen=email=>invites().find(i=>i.email===email&&i.status!=='joined');
 const signupOpen=email=>users()===0||process.env.AUTH_ALLOW_SIGNUP==='true'||(email?!!invitedOpen(email):invites().some(i=>i.status!=='joined'));
 const remember=(email,providerName,hash=null)=>{const existing=store.db.prepare('SELECT * FROM users WHERE email=?').get(email);if(existing)return existing;const user={id:randomUUID(),email,hash,provider:providerName,created:new Date().toISOString()};store.db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(user.id,user.email,user.hash,user.provider,user.created);return user;};
 function throttle(email){const now=Date.now();const a=(attempts.get(email)||[]).filter(t=>now-t<15*60000);if(a.length>=10)throw fail(429,'Too many attempts. Wait a few minutes and try again.');a.push(now);attempts.set(email,a);}

 const providers={
  local:{label:'This computer',
   async signUp(email,password){if(store.db.prepare('SELECT 1 FROM users WHERE email=?').get(email))throw fail(400,'That email already has an account. Log in instead.');const salt=randomBytes(16).toString('hex');return remember(email,'local',`${salt}:${scryptSync(password,salt,64).toString('hex')}`);},
   async signIn(email,password){const u=store.db.prepare('SELECT * FROM users WHERE email=? AND provider=?').get(email,'local');if(!u?.hash)throw fail(401,'Email or password is incorrect.');const [salt,hash]=u.hash.split(':');const a=Buffer.from(hash,'hex'),b=scryptSync(password,salt,64);if(a.length!==b.length||!timingSafeEqual(a,b))throw fail(401,'Email or password is incorrect.');return u;}},
  supabase:{label:'Supabase',
   async call(pathname,body){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;if(!url||!key)throw fail(500,'Supabase sign-in is selected but SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env.');const r=await fetch(url.replace(/\/$/,'')+pathname,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const d=await r.json().catch(()=>({}));if(!r.ok)throw fail(r.status>=500?502:401,d.error_description||d.msg||d.message||'Supabase could not sign you in.');return d;},
   async signUp(email,password){const d=await this.call('/auth/v1/signup',{email,password});if(!d.access_token&&!d.session)throw fail(202,'Check your email to confirm your account, then log in.');return remember(email,'supabase');},
   async signIn(email,password){await this.call('/auth/v1/token?grant_type=password',{email,password});return remember(email,'supabase');}},
  firebase:{label:'Firebase',
   async call(action,body){const key=process.env.FIREBASE_API_KEY;if(!key)throw fail(500,'Firebase sign-in is selected but FIREBASE_API_KEY is missing in .env.');const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,returnSecureToken:true}),signal:AbortSignal.timeout(20000)});const d=await r.json().catch(()=>({}));if(!r.ok)throw fail(401,({EMAIL_NOT_FOUND:'Email or password is incorrect.',INVALID_PASSWORD:'Email or password is incorrect.',INVALID_LOGIN_CREDENTIALS:'Email or password is incorrect.',EMAIL_EXISTS:'That email already has an account. Log in instead.'})[d.error?.message?.split(' ')[0]]||'Firebase could not sign you in.');return d;},
   async signUp(email,password){await this.call('signUp',{email,password});return remember(email,'firebase');},
   async signIn(email,password){await this.call('signInWithPassword',{email,password});return remember(email,'firebase');}},
 };
 providers.none={label:'No sign-in (this computer only)',async signUp(){throw fail(400,'Sign-in is turned off on this computer.');},async signIn(){throw fail(400,'Sign-in is turned off on this computer.');}};
 if(provider==='none'&&process.env.STUDIO_PUBLIC_URL)throw new Error('AUTH_PROVIDER=none only works when Social Studio is not on a domain. Remove STUDIO_PUBLIC_URL or choose a sign-in provider.');
 const active=providers[provider];
 if(!active)throw new Error(`Unknown AUTH_PROVIDER "${provider}". Use local, supabase or firebase, or add a provider in server/auth.mjs.`);

 function startSession(user){const token=randomBytes(32).toString('hex');store.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token,user.id,Date.now()+SESSION_DAYS*DAY);store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());return token;}
 const secure=/^https:/i.test(process.env.STUDIO_PUBLIC_URL||'')?'; Secure':'';
 const cookie=token=>`studio_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token?SESSION_DAYS*86400:0}${secure}`;
 const tokenOf=req=>(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('studio_session='))?.slice(15)||'';
 function userOf(req){const bearer=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(bearer&&bearer.length===agentKey.length&&timingSafeEqual(Buffer.from(bearer),Buffer.from(agentKey)))return {id:'agent',email:'your AI',agent:true};
  if(provider==='none')return {id:'local',email:'',local:true};
  const token=tokenOf(req);if(!token)return null;const s=store.db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(token,Date.now());if(!s)return null;return store.db.prepare('SELECT id,email,provider FROM users WHERE id=?').get(s.user)||null;}

 return {provider,label:active.label,agentKeyFile:keyFile,userOf,signupOpen,
  status(req){const user=userOf(req);return {signedIn:!!user,user:user?{email:user.email}:null,provider,providerLabel:active.label,signupOpen:signupOpen(),hasAccount:users()>0};},
  async signUp(email,password){email=cleanEmail(email);if(!validEmail(email))throw fail(400,'Enter a valid email address.');if(String(password||'').length<8)throw fail(400,'Use a password of at least 8 characters.');if(!signupOpen(email))throw fail(403,'This email hasn’t been invited. Ask the owner to invite you, or log in.');throttle(email);const user=await active.signUp(email,String(password));const inv=invitedOpen(email);if(inv)store.save('_system','invites',{...inv,status:'joined',joined:new Date().toISOString()},inv.id);return startSession(user);},
  async signIn(email,password){email=cleanEmail(email);if(!validEmail(email)||!password)throw fail(400,'Enter your email and password.');throttle(email);return startSession(await active.signIn(email,String(password)));},
  signOut(req){const t=tokenOf(req);if(t)store.db.prepare('DELETE FROM sessions WHERE token=?').run(t);},
  cookie,
  invites,
  addInvites(people){const have=new Set(invites().map(i=>i.email));const added=[];for(const p of (people||[]).slice(0,50)){const email=cleanEmail(p.email);if(!validEmail(email))throw fail(400,`“${p.email||''}” is not a valid email.`);if(have.has(email))continue;have.add(email);added.push(store.save('_system','invites',{email,name:String(p.name||'').trim().slice(0,80),status:'pending',note:'',created:new Date().toISOString()}));}return added;},
  updateInvite(id,patch){const inv=store.get('_system','invites',id);if(!inv)throw fail(404,'Invitation not found.');const status=patch.status??inv.status;if(!['pending','sent','joined'].includes(status))throw fail(400,'Status must be pending, sent or joined.');return store.save('_system','invites',{...inv,status,name:patch.name!==undefined?String(patch.name).slice(0,80):inv.name,note:patch.note!==undefined?String(patch.note).slice(0,500):inv.note},id);},
  removeInvite(id){return store.remove('_system','invites',id);},
  // Everything except sign-in, health and the app shell needs a session or the agent key.
  gate(req,res,next){const open=req.baseUrl==='/api'&&(req.path.startsWith('/auth/')||req.path==='/health');if(open||userOf(req))return next();res.status(401).json({error:'Please log in.'});},
 };
}
