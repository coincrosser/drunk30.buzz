"use strict";(()=>{var e={};e.id=417,e.ids=[417],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},3089:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>h,patchFetch:()=>b,requestAsyncStorage:()=>d,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var r={};o.r(r),o.d(r,{POST:()=>c});var n=o(3278),i=o(5002),s=o(4877),a=o(1309),u=o(1245),l=o(1572);async function c(e){try{let{episodeId:t,topic:o,context:r}=await e.json();if(!o)return a.NextResponse.json({error:"Topic is required"},{status:400});let n=`Create an outline for a podcast/YouTube episode about: ${o}

${r?`Additional context: ${r}`:""}

Create a structured outline with:
1. A compelling hook/introduction (1-2 sentences to grab attention)
2. 3-5 main talking points with brief notes for each
3. A personal angle or story connection
4. A conclusion with a call-to-action

Format the response as JSON with this structure:
{
  "hook": "string",
  "mainPoints": [
    { "title": "string", "notes": "string" }
  ],
  "personalAngle": "string",
  "conclusion": "string",
  "callToAction": "string"
}

Remember: Keep the tone honest, grounded, and reflective. No hustle-bro language. Focus on learning and building.`,i=await u.fr.chat.completions.create({model:u.cR,messages:[{role:"system",content:u.p6},{role:"user",content:n}],response_format:{type:"json_object"},temperature:.7}),s=i.choices[0]?.message?.content;if(!s)throw Error("No response from AI");let c=JSON.parse(s),p=`## Hook
${c.hook}

## Main Points
${c.mainPoints.map((e,t)=>`${t+1}. **${e.title}**
   ${e.notes}`).join("\n\n")}

## Personal Angle
${c.personalAngle}

## Conclusion
${c.conclusion}

## Call to Action
${c.callToAction}`;return t&&(await l.db.episodeOutline.upsert({where:{episodeId:t},create:{episodeId:t,content:p},update:{content:p}}),await l.db.episode.update({where:{id:t},data:{status:"OUTLINE"}})),a.NextResponse.json({outline:{...c,formatted:p}})}catch(e){return console.error("Failed to generate outline:",e),a.NextResponse.json({error:"Failed to generate outline"},{status:500})}}let p=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/ai/outline/route",pathname:"/api/ai/outline",filename:"route",bundlePath:"app/api/ai/outline/route"},resolvedPagePath:"C:\\Users\\echob\\OneDrive\\Desktop\\podcast\\drunk30.buzz\\src\\app\\api\\ai\\outline\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:g,serverHooks:m}=p,h="/api/ai/outline/route";function b(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},1572:(e,t,o)=>{o.d(t,{db:()=>n});let r=require("@prisma/client"),n=globalThis.prisma??new r.PrismaClient({log:["error"]})},1245:(e,t,o)=>{o.d(t,{cR:()=>s,fr:()=>i,p6:()=>a});var r=o(4130);let n=null;process.env.OPENAI_API_KEY?n=new r.ZP({apiKey:process.env.OPENAI_API_KEY,baseURL:process.env.OPENAI_BASE_URL||"https://api.openai.com/v1"}):n={chat:{completions:{create:async()=>{throw Error("The OPENAI_API_KEY environment variable is missing or empty; set it to use AI features.")}}}};let i=n,s=process.env.OPENAI_MODEL||"gpt-4o-mini",a=`You are a creative assistant helping a solo content creator build their podcast and YouTube channel.

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
- Acknowledge struggles without sensationalizing them`}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[787,833,130],()=>o(3089));module.exports=r})();