"use strict";(()=>{var e={};e.id=391,e.ids=[391],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},5304:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>b,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var o={};r.r(o),r.d(o,{POST:()=>c});var i=r(3278),a=r(5002),s=r(4877),n=r(1309),p=r(1245),u=r(1572);async function c(e){try{let{episodeId:t,title:r,description:o,script:i}=await e.json();if(!r)return n.NextResponse.json({error:"Title is required"},{status:400});let a=`Generate YouTube metadata for a video with this context:

Title: ${r}
${o?`Description: ${o}`:""}
${i?`Script excerpt (first 1000 chars): ${i.substring(0,1e3)}...`:""}

Generate a complete YouTube pack with:
1. 5 alternative title options (compelling, under 60 chars each)
2. A full video description (include links placeholders, timestamps placeholder)
3. 5-8 relevant hashtags (without # prefix)
4. 15-20 video tags for SEO
5. Chapter timestamps template
6. A pinned comment suggestion
7. 3 thumbnail text/concept ideas

Return as JSON:
{
  "titles": ["title1", "title2", ...],
  "description": "full description text",
  "hashtags": ["tag1", "tag2", ...],
  "tags": ["keyword1", "keyword2", ...],
  "chapters": "00:00 - Intro\\n...",
  "pinnedComment": "comment text",
  "thumbnailIdeas": ["idea1", "idea2", "idea3"]
}

Tone: Honest, grounded, focused on learning and building. No clickbait or hype.`,s=await p.fr.chat.completions.create({model:p.cR,messages:[{role:"system",content:p.p6},{role:"user",content:a}],response_format:{type:"json_object"},temperature:.8}),c=s.choices[0]?.message?.content;if(!c)throw Error("No response from AI");let l=JSON.parse(c);return t&&(await u.db.youTubePack.findUnique({where:{episodeId:t}})?await u.db.youTubePack.update({where:{episodeId:t},data:{titleOptions:l.titles,description:l.description,hashtags:l.hashtags,tags:l.tags,chapters:l.chapters,pinnedComment:l.pinnedComment,thumbnailIdeas:l.thumbnailIdeas}}):await u.db.youTubePack.create({data:{episodeId:t,titleOptions:l.titles,description:l.description,hashtags:l.hashtags,tags:l.tags,chapters:l.chapters,pinnedComment:l.pinnedComment,thumbnailIdeas:l.thumbnailIdeas}})),n.NextResponse.json({youtubePack:l})}catch(e){return console.error("Failed to generate YouTube pack:",e),n.NextResponse.json({error:"Failed to generate YouTube pack"},{status:500})}}let l=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/ai/youtube-pack/route",pathname:"/api/ai/youtube-pack",filename:"route",bundlePath:"app/api/ai/youtube-pack/route"},resolvedPagePath:"C:\\Users\\echob\\OneDrive\\Desktop\\podcast\\drunk30.buzz\\src\\app\\api\\ai\\youtube-pack\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:h,serverHooks:m}=l,g="/api/ai/youtube-pack/route";function b(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}},1572:(e,t,r)=>{r.d(t,{db:()=>i});let o=require("@prisma/client"),i=globalThis.prisma??new o.PrismaClient({log:["error"]})},1245:(e,t,r)=>{r.d(t,{cR:()=>s,fr:()=>a,p6:()=>n});var o=r(4130);let i=null;process.env.OPENAI_API_KEY?i=new o.ZP({apiKey:process.env.OPENAI_API_KEY,baseURL:process.env.OPENAI_BASE_URL||"https://api.openai.com/v1"}):i={chat:{completions:{create:async()=>{throw Error("The OPENAI_API_KEY environment variable is missing or empty; set it to use AI features.")}}}};let a=i,s=process.env.OPENAI_MODEL||"gpt-4o-mini",n=`You are a creative assistant helping a solo content creator build their podcast and YouTube channel.

Context about the creator:
- 51 years old
- On-and-off struggles with alcohol, documenting recovery journey
- Learning to code, building businesses, consulting
- Building in public, embracing imperfection

Tone requirements:
- Honest, calm, grounded
- NO hustle-bro language
- NO glamorization of addiction or drinking
- Emphasis on discipline, consistency, recovery
- Focus on "build anyway", "ship imperfectly", "recover responsibly"

Brand tagline: "Build anyway. Recover loudly. Ship consistently."

Important safety guidelines:
- Do not glamorize alcohol or substance use
- Avoid medical advice about addiction or recovery
- Keep tone responsible and reflective
- Focus on learning, discipline, and rebuilding
- Acknowledge struggles without sensationalizing them`}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[787,833,130],()=>r(5304));module.exports=o})();