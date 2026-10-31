// A made-up finished overview, shown when someone clicks "See an example". Not anyone's real data.
const P=(date,platform,format,topic,caption,likes,comments,views,shares,saves,note='')=>({date,platform,format,topic,caption,url:'',likes,comments,views,shares,saves,note});
export const EXAMPLE_REPORT={
 id:'example',kind:'social',example:true,author:'Example',created:'2026-10-27T09:00:00.000Z',
 title:'Café Olive, Sep 1 – Oct 26: Reels with people carry the feed',
 summary:'22 posts across Instagram and TikTok. Reels with regulars and the terrace get nearly three times the likes of product photos, while carousels underperform. Posting stops on weekends, exactly when the terrace is busiest.',
 platform:'Instagram, TikTok',from:'2026-09-01',to:'2026-10-26',period:'22 posts, Sep 1 – Oct 26, 2026',
 stats:[{label:'Followers',value:'4,210'},{label:'Posts reviewed',value:'22'},{label:'Avg likes (Instagram)',value:'153'},{label:'Avg comments',value:'19'},{label:'Avg views (video)',value:'6.2K'},{label:'Posts per week',value:'2.8'}],
 strengths:['Reels average 245 likes, about 2.7× the coffee product photos (92)','A recognisable warm color grade: the feed looks like one place','Comments are friendly and specific; people tag friends on terrace posts'],
 weaknesses:['No posts on Saturdays or Sundays, the busiest terrace days','Carousels average 63 likes and few saves','Captions rarely end with a question, so comments stay low on photos','TikTok reuses Instagram Reels with Instagram text placement'],
 opportunities:['A weekly “Regulars of Olive” Reel (the format that already wins)','Weekend morning Stories from the terrace, posted live','Short barista tips made for TikTok, vertical text, under 20 seconds','Turn the seasonal menu carousel into a 3-shot Reel'],
 audience:'Mostly locals aged 22–35 from Mar Mikhael and Achrafieh, plus remote workers. The most common questions: opening hours, vegan options and whether there are power outlets. About a third of comments tag a friend.',
 body:`## What to do next
1. Film one **Regulars of Olive** Reel per week (Tuesday mornings, 20–30 s).
2. Post at least one Story on Saturday and Sunday mornings from the terrace.
3. Rework carousels into short Reels; keep carousels for the menu only.
4. End photo captions with one simple question ("Oat or whole?").

## Best and weakest posts
| | Post | Likes | Why |
|---|---|---|---|
| Best | Meet Rami, here every morning since 2019 (Reel) | 412 | A real person, a story, and the terrace light |
| Best | Pouring the first autumn latte (TikTok) | 9.8K views | Close-up, sound on, 12 seconds |
| Weakest | New pastries this week (carousel) | 38 | Product only, no people, no question |
`,
 sources:['https://instagram.com/cafeolive','https://tiktok.com/@cafeolive'],
 posts:[
  P('2026-09-02','Instagram','Reel','Regulars','Meet Rami, here every morning since 2019',412,38,9100,64,51,'Best post of the period'),
  P('2026-09-04','Instagram','Photo','Coffee craft','Oat flat white, made slowly',96,6,null,2,8),
  P('2026-09-06','TikTok','Video','Coffee craft','How we dial in the espresso every morning',null,22,6400,40,null),
  P('2026-09-09','Instagram','Carousel','Seasonal menu','New pastries this week',38,2,null,0,3,'Weakest post: product only'),
  P('2026-09-11','Instagram','Reel','Terrace mornings','7:30 am on the terrace',284,19,7200,31,40),
  P('2026-09-15','Instagram','Photo','Behind the counter','Our new grinder arrived',71,9,null,1,2),
  P('2026-09-17','TikTok','Video','Terrace mornings','Sound on: Mar Mikhael waking up',null,14,4100,18,null),
  P('2026-09-18','Instagram','Reel','Regulars','Lea orders the same cake every Thursday',236,27,6100,22,30),
  P('2026-09-23','Instagram','Carousel','Seasonal menu','Fig and labneh toast, step by step',72,4,null,3,9),
  P('2026-09-25','Instagram','Photo','Terrace mornings','Rainy morning, warm inside',118,7,null,2,6),
  P('2026-09-29','Instagram','Reel','Coffee craft','Latte art fails, a compilation',198,31,5400,44,12),
  P('2026-10-01','TikTok','Video','Seasonal menu','Pouring the first autumn latte',null,48,9800,120,null,'Best TikTok'),
  P('2026-10-02','Instagram','Reel','Seasonal menu','The autumn menu in 20 seconds',176,15,4800,19,33),
  P('2026-10-06','Instagram','Carousel','Behind the counter','A day with our barista, in 8 photos',81,5,null,2,4),
  P('2026-10-08','Instagram','Photo','Coffee craft','Single origin of the month: Ethiopia',88,10,null,1,7),
  P('2026-10-09','TikTok','Video','Regulars','Guess the regular from their order',null,61,8700,75,null),
  P('2026-10-13','Instagram','Reel','Terrace mornings','First cold morning on the terrace',221,17,5900,26,28),
  P('2026-10-15','Instagram','Photo','Regulars','Thank you for 4,000 of you',152,44,null,5,3),
  P('2026-10-16','Instagram','Carousel','Seasonal menu','Pumpkin spice, our way',59,3,null,1,6),
  P('2026-10-20','TikTok','Video','Behind the counter','Closing up at 7 pm',null,9,2300,6,null),
  P('2026-10-22','Instagram','Reel','Behind the counter','What 200 cups a day looks like',187,12,5100,21,15),
  P('2026-10-24','Instagram','Photo','Terrace mornings','Blankets are out',104,8,null,2,5),
 ],
};
