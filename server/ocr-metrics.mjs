export function parseOcrMetrics(items){
 const metrics=Object.fromEntries(['reach','views','likes','comments','shares','saves','followers','followerTotal'].map(k=>[k,null]));
 const definitions={reach:/^(accounts reached|reach)$/i,views:/^(views|plays|video views)$/i,likes:/^likes$/i,comments:/^comments$/i,shares:/^shares$/i,saves:/^saves$/i,followers:/^(new followers|follows|followers gained)$/i,followerTotal:/^(followers|total followers)$/i};
 const parse=s=>{const m=s.trim().match(/^([\d,]+(?:\.\d+)?)\s*([KM])?$/i);return m?Math.round(Number(m[1].replaceAll(',',''))*(m[2]?.toUpperCase()==='K'?1000:m[2]?.toUpperCase()==='M'?1000000:1)):null;};
 const used=new Set();
 for(const [key,pattern] of Object.entries(definitions)){
 const label=items.find(x=>pattern.test(x.text.trim()));if(!label)continue;
 const lx=label.box[0]+label.box[2]/2,ly=label.box[1]+label.box[3]/2;
 const candidates=items.map((x,i)=>({...x,i,value:parse(x.text)})).filter(x=>x.value!==null&&!used.has(x.i)).map(x=>{const xmid=x.box[0]+x.box[2]/2,ymid=x.box[1]+x.box[3]/2;const sameRow=Math.abs(ymid-ly)<.025;const sameColumn=Math.abs(xmid-lx)<.13&&Math.abs(ymid-ly)<.1;return {...x,score:sameRow?Math.abs(xmid-lx)*.05+Math.abs(ymid-ly):sameColumn?Math.abs(ymid-ly)+.03:100};}).sort((a,b)=>a.score-b.score);
 if(candidates[0]?.score<.13){metrics[key]=candidates[0].value;used.add(candidates[0].i);}
 }
 const text=items.map(x=>x.text).join('\n');return {platform:/tiktok/i.test(text)?'TikTok':/youtube/i.test(text)?'YouTube':/facebook/i.test(text)?'Facebook':/linkedin/i.test(text)?'LinkedIn':/instagram|reel insights|post insights/i.test(text)?'Instagram':null,scope:/reel insights|post insights|video insights/i.test(text)?'post':'account',metrics,visiblePeriod:'Check the date range in the source image',notes:['Extracted with on-device Apple Vision OCR. Review every value and its label. Unmatched values remain blank.','The local language model is still being prepared; this import uses OCR with positional label matching.']};
}
