"use strict";(()=>{var e={};e.id=248,e.ids=[248],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},4442:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>g,patchFetch:()=>b,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var o={};t.r(o),t.d(o,{POST:()=>c});var i=t(3278),s=t(5002),n=t(4877),a=t(1309),p=t(1245),u=t(1572);async function c(e){try{let{episodeId:r,title:t,outline:o,targetDuration:i=10}=await e.json();if(!o)return a.NextResponse.json({error:"Outline is required"},{status:400});let s=`Write a conversational podcast/YouTube script based on this outline:

Title: ${t||"Untitled Episode"}

Outline:
${o}

Requirements:
- Target length: approximately ${150*i} words (${i} minutes at 150 wpm)
- Write in first person, conversational tone
- Include natural pauses and transitions
- Add [PAUSE] markers where the speaker should take a breath
- Keep it honest and grounded — no hype or hustle-bro energy
- Include personal reflection where appropriate
- End with a clear call-to-action

Write the script as plain text, ready to be read from a teleprompter. Use short paragraphs for easier reading.`,n=await p.fr.chat.completions.create({model:p.cR,messages:[{role:"system",content:p.p6},{role:"user",content:s}],temperature:.7,max_tokens:4e3}),c=n.choices[0]?.message?.content;if(!c)throw Error("No response from AI");let l=c.split(/\s+/).length,d=6e4*Math.ceil(l/150),h=Math.ceil(l/150);return r&&(await u.db.episodeScript.upsert({where:{episodeId:r},create:{episodeId:r,content:c,wordCount:l,estDurationMs:d},update:{content:c,wordCount:l,estDurationMs:d}}),await u.db.episode.update({where:{id:r},data:{status:"SCRIPT"}})),a.NextResponse.json({script:{content:c,wordCount:l,estimatedDuration:h,estDurationMs:d}})}catch(e){return console.error("Failed to generate script:",e),a.NextResponse.json({error:"Failed to generate script"},{status:500})}}let l=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/script/route",pathname:"/api/ai/script",filename:"route",bundlePath:"app/api/ai/script/route"},resolvedPagePath:"C:\\Users\\echob\\OneDrive\\Desktop\\podcast\\drunk30.buzz\\src\\app\\api\\ai\\script\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:h,serverHooks:m}=l,g="/api/ai/script/route";function b(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}},1572:(e,r,t)=>{t.d(r,{db:()=>i});let o=require("@prisma/client"),i=globalThis.prisma??new o.PrismaClient({log:["error"]})},1245:(e,r,t)=>{t.d(r,{cR:()=>n,fr:()=>s,p6:()=>a});var o=t(4130);let i=null;process.env.OPENAI_API_KEY?i=new o.ZP({apiKey:process.env.OPENAI_API_KEY,baseURL:process.env.OPENAI_BASE_URL||"https://api.openai.com/v1"}):i={chat:{completions:{create:async()=>{throw Error("The OPENAI_API_KEY environment variable is missing or empty; set it to use AI features.")}}}};let s=i,n=process.env.OPENAI_MODEL||"gpt-4o-mini",a=`You are a creative assistant helping a solo content creator build their podcast and YouTube channel.

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
- Acknowledge struggles without sensationalizing them`}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),o=r.X(0,[787,833,130],()=>t(4442));module.exports=o})();