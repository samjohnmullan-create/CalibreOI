/* Optional secure proxy. Holds OPENAI_API_KEY server-side. */
function textFrom(data){if(data?.output_text)return data.output_text;const parts=[];for(const item of data?.output||[])for(const bit of item.content||[])if(bit?.text)parts.push(bit.text);return parts.join("\n");}
function inputFrom(body){const items=[],images=Array.isArray(body.images)?body.images.filter(url=>typeof url==="string"&&url.startsWith("data:image/")):[];let attached=false;for(const message of Array.isArray(body.messages)?body.messages:[]){const content=[{type:"input_text",text:String(message?.content||"")}];if(!attached&&message?.role!=="assistant"){for(const url of images)content.push({type:"input_image",image_url:url});attached=true;}items.push({role:message?.role==="assistant"?"assistant":"user",content});}return items;}
export default async function handler(req,res){
 if(req.method!=="POST"){res.status(405).json({error:"POST only"});return;}
 const key=process.env.OPENAI_API_KEY;if(!key){res.status(500).json({error:"OPENAI_API_KEY is not configured on the server."});return;}
 let body={};try{body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};}catch{res.status(400).json({error:"Invalid JSON body"});return;}
 const instructions=["You are the bench assistant for Calibre & Co., restoring antique pocket watches and vintage watches.","The job brief is already attached. Do not ask for it again.","Be short and specific. Do not invent serials, dimensions, part numbers, lubrication points or timing figures.",body.page?`Page: ${body.page}`:"","Job brief:\n"+(body.brief||"No job loaded.")].filter(Boolean).join("\n");
 try{
  const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1",instructions,input:inputFrom(body)})});
  const data=await upstream.json().catch(()=>({}));if(!upstream.ok){res.status(upstream.status).json({error:data.error?.message||"OpenAI error"});return;}res.status(200).json({text:textFrom(data)});
 }catch(err){res.status(502).json({error:err?.message||"Assistant request failed"});}
}
