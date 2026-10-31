// AI departments: each one specializes in one job, keeps its own knowledge and writes down what it learns.
// `lens` is how the department studies anything added to its knowledge. `helps` lists departments it coaches.
export const DEPARTMENTS={
 'video-editor':{name:'Video editor',icon:'Clapperboard',color:'#7c3aed',
  mission:'Learns editing from the inspiration you share and turns it into an editing playbook for your videos.',
  lens:'Study it as a video editor: the hook in the first two seconds, cut rhythm and shot length, transitions, on-screen text and caption style, framing and camera movement, b-roll, color and grade, pace changes, and how it ends.'},
 'video-supervisor':{name:'Video editor supervisor',icon:'GraduationCap',color:'#be185d',helps:['video-editor'],
  mission:'Coaches the video editor on storytelling and watchability: what makes people stop, stay and finish a video.',
  lens:'Study it as a storytelling supervisor: does the hook earn attention, is there a clear arc (setup, tension, payoff), where would viewers drop off, the emotional beats, how clear the message is, and whether the ending lands. Give concrete coaching notes for the editor.'},
 instagram:{name:'Instagram',icon:'Instagram',color:'#d62976',platform:'Instagram',
  mission:'Owns Instagram: tracks your analytics, watches accounts you admire and your competitors, and learns which formats, hooks and topics work there.',
  lens:'Study it as an Instagram strategist: format, hook, caption style, hashtags, posting rhythm, and what drives saves, shares and comments.'},
 tiktok:{name:'TikTok',icon:'Music2',color:'#111827',platform:'TikTok',
  mission:'Owns TikTok: your analytics, trends and sounds worth using, and accounts to learn from.',
  lens:'Study it as a TikTok strategist: the first second, native text placement, sound and trend use, length, loopability and comment bait.'},
 linkedin:{name:'LinkedIn',icon:'Linkedin',color:'#0a66c2',platform:'LinkedIn',
  mission:'Owns LinkedIn: your analytics, people and companies worth following, and what earns attention from professionals.',
  lens:'Study it as a LinkedIn strategist: the first two lines, story structure, document and carousel posts, credibility, and what starts real conversations in the comments.'},
 facebook:{name:'Facebook',icon:'Facebook',color:'#1877f2',platform:'Facebook',
  mission:'Owns Facebook: your page and group analytics, local community, and what gets shared.',
  lens:'Study it as a Facebook strategist: shareability, community conversation, local relevance, and video versus photo performance.'},
 youtube:{name:'YouTube',icon:'Youtube',color:'#dc2626',platform:'YouTube',
  mission:'Owns YouTube: Shorts and long videos, titles and thumbnails, and channels worth learning from.',
  lens:'Study it as a YouTube strategist: title and thumbnail promise, the first 30 seconds, retention structure, chapters, and calls to subscribe.'},
 copywriter:{name:'Copywriter',icon:'PenLine',color:'#b45309',
  mission:'Writes hooks, captions and scripts in your brand voice, and learns from writing you admire.',
  lens:'Study it as a copywriter: the opening line, rhythm, word choice, how it sounds out loud, and the call to action.'},
 designer:{name:'Graphic designer',icon:'Palette',color:'#0f766e',
  mission:'Designs covers, thumbnails and carousels that stay on brand, and learns from visual references.',
  lens:'Study it as a graphic designer: layout, hierarchy, typography, color, contrast, and what makes it readable on a phone.'},
 strategist:{name:'Content strategist',icon:'Compass',color:'#334155',helps:['video-editor','instagram','tiktok','linkedin','copywriter'],
  mission:'Sees the big picture: pillars, the calendar, campaigns, and which department should do what next.',
  lens:'Study it as a content strategist: the goal behind it, the audience, how it fits a series or campaign, and what to repeat or avoid.'},
 community:{name:'Community manager',icon:'MessagesSquare',color:'#4d7c0f',
  mission:'Looks after comments and messages: what people ask, how they feel, and replies in your voice.',
  lens:'Study it as a community manager: what the audience asks and feels, tone of replies, and questions worth turning into content.'},
};
export const DEPARTMENT_KEYS=Object.keys(DEPARTMENTS);
const PLATFORM_KEYS={Instagram:'instagram',TikTok:'tiktok',LinkedIn:'linkedin',Facebook:'facebook',YouTube:'youtube'};
// Suggested departments for a workspace: video, the platforms it is on, and a strategist.
export function recommendedDepartments(workspace){
 const platforms=(workspace?.socials||[]).map(s=>PLATFORM_KEYS[s.platform]).filter(Boolean);
 return [...new Set(['video-editor','video-supervisor',...(platforms.length?platforms:['instagram']),'strategist'])];
}
