import React from 'react';
import {ArrowRight,BarChart3,BookOpen,CalendarDays,Contact,Lightbulb,Repeat2} from 'lucide-react';
import {PageTitle} from './components';

const STEPS=[
 ['ideas',Lightbulb,'Catch the idea','Save a link, a clip from your phone, or a quick voice note in Social media ideas. AI can turn it into a hook, a shot list and a first script.'],
 ['calendar',CalendarDays,'Put it on the calendar','Create content, choose the date, channels and format, and move it from Draft to Published as it progresses.'],
 ['team',Contact,'Know who’s speaking','Describe each person in Team & personalities. AI uses those profiles to suggest the best speaker and write in their voice.'],
 ['scripts',BookOpen,'Write it, then film it','Open Scripts & teleprompter, pick who’s on camera, tailor the words to them, then rehearse with the teleprompter.'],
 ['analytics',BarChart3,'See what worked','Drop in an Insights screenshot. The numbers are read for you; check them, save, and watch the trend.'],
];

export function GuideView({navigate}){
 return <><PageTitle eyebrow="WELCOME TO YOUR STUDIO" title="How Social Studio works." description="A simple rhythm you can repeat every week."/>
 <div className="section-heading"><div><h2>Your weekly rhythm</h2><p>Five steps, the same for every workspace.</p></div><span className="guide-loop"><Repeat2 size={15}/>Repeat every week</span></div>
 <div className="guide-steps">{STEPS.map(([page,Icon,title,body],i)=><button key={page} className="guide-step" onClick={()=>navigate(page)}><span className="guide-step-top"><span className="team-step-icon"><Icon size={18}/></span><span className="team-step-number">0{i+1}</span></span><h3>{title}</h3><p>{body}</p><span className="text-link">Open<ArrowRight size={13}/></span></button>)}</div>
 <section className="guide-tips panel"><div><h3>One studio, many businesses</h3><p>Use the workspace picker at the top left to switch or add a business. Each has its own brand kit, calendar, team, ideas and analytics, and nothing mixes.</p></div><div><h3>Finding anything</h3><p>Press <kbd>⌘</kbd> <kbd>K</kbd> to search content, tasks and ideas from any page.</p></div><div><h3>Everything stays on this Mac</h3><p>Your data and AI run locally. Nothing is posted for you; publishing still happens in Instagram or TikTok.</p></div></section>
 </>;}
