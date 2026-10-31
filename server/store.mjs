import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export function createStore(directory){
 mkdirSync(directory,{recursive:true});
 const db=new DatabaseSync(path.join(directory,'studio.sqlite'));
 db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, brand TEXT NOT NULL, collection TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL); CREATE INDEX IF NOT EXISTS record_scope ON records(brand,collection); CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
 const unpack=r=>r?{...JSON.parse(r.data),id:r.id,brand:r.brand,created:r.created,updated:r.updated}:null;
 return {db,
 list:(brand,collection)=>db.prepare('SELECT * FROM records WHERE brand=? AND collection=? ORDER BY created DESC').all(brand,collection).map(unpack),
 get:(brand,collection,id)=>unpack(db.prepare('SELECT * FROM records WHERE brand=? AND collection=? AND id=?').get(brand,collection,id)),
 save(brand,collection,input,id=randomUUID()){const existing=this.get(brand,collection,id);if(!existing&&db.prepare('SELECT id FROM records WHERE id=?').get(id))throw new Error('Record ID belongs to a different workspace or collection.');const now=new Date().toISOString();db.prepare('INSERT INTO records (id,brand,collection,data,created,updated) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated').run(id,brand,collection,JSON.stringify(input),existing?.created||now,now);return this.get(brand,collection,id);},
 remove(brand,collection,id){if(collection==='content'){for(const m of this.list(brand,'metrics').filter(m=>m.postId===id))this.remove(brand,'metrics',m.id);for(const a of this.list(brand,'audience').filter(a=>a.postId===id))this.remove(brand,'audience',a.id);for(const t of this.list(brand,'tasks').filter(t=>t.contentId===id))this.save(brand,'tasks',{...t,contentId:''},t.id);}if(collection==='knowledge')for(const l of this.list(brand,'deptlog').filter(l=>l.knowledgeId===id))this.remove(brand,'deptlog',l.id);if(collection==='departments'){for(const c of ['knowledge','deptlog','asks'])for(const x of this.list(brand,c).filter(x=>x.departmentId===id))this.remove(brand,c,x.id);for(const d of this.list(brand,'departments').filter(d=>d.helps?.includes(id)))this.save(brand,'departments',{...d,helps:d.helps.filter(h=>h!==id)},d.id);}if(collection==='team')for(const p of this.list(brand,'content').filter(p=>p.speakers?.includes(id)))this.save(brand,'content',{...p,speakers:p.speakers.filter(x=>x!==id)},p.id);return db.prepare('DELETE FROM records WHERE brand=? AND collection=? AND id=?').run(brand,collection,id).changes;},
 meta:key=>db.prepare('SELECT value FROM metadata WHERE key=?').get(key)?.value,
 setMeta:(key,value)=>db.prepare('INSERT OR REPLACE INTO metadata VALUES (?,?)').run(key,value)
 };
}
