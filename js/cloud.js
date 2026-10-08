import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://jdeqnboljrgrpnvkfthx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fWijlFfBeTw4Ku8EPkno7w_BgOARn0j";
export const CLOUD_SEEN_KEY = "calibre-cloud-seen-at";

const LOCAL_SESSION={user:{id:"__calibre_local__",email:""},localOnly:true};
let client;

export function supabaseClient(){
  if(!client){
    client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
  }
  return client;
}

function cachedSession(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!key.startsWith("sb-")||!key.includes("-auth-token"))continue;
      const raw=localStorage.getItem(key);
      if(!raw)continue;
      const parsed=JSON.parse(raw);
      const value=parsed?.currentSession||parsed;
      if(value?.user?.id)return value;
    }
  }catch{}
  return null;
}

export async function session(){
  try{
    const {data,error}=await supabaseClient().auth.getSession();
    if(error)throw error;
    if(data?.session?.user)return data.session;
  }catch{}

  // A bench app must remain usable if auth refresh/CDN/network is temporarily
  // unavailable. Preserve a cached real session when possible, otherwise use
  // an explicit local-only session so navigation never locks or redirects.
  return cachedSession()||LOCAL_SESSION;
}

export async function signUp(email,password){
  const redirect=new URL("settings.html",location.href).href;
  return supabaseClient().auth.signUp({email,password,options:{emailRedirectTo:redirect}});
}

export async function signIn(email,password){
  return supabaseClient().auth.signInWithPassword({email,password});
}

export async function requestPasswordReset(email){
  const redirect=new URL("settings.html?reset=1",location.href).href;
  return supabaseClient().auth.resetPasswordForEmail(email,{redirectTo:redirect});
}

export async function updatePassword(password){
  return supabaseClient().auth.updateUser({password});
}

export async function signOut(){ return supabaseClient().auth.signOut(); }

function cleanState(state){
  const copy=structuredClone(state||{});
  delete copy._cloud;
  return copy;
}

export function seenCloudAt(){ return localStorage.getItem(CLOUD_SEEN_KEY)||""; }
export function markCloudSeen(updatedAt){ if(updatedAt)localStorage.setItem(CLOUD_SEEN_KEY,updatedAt); }

export async function readCloudState(){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,state:null,updatedAt:null};
  const {data,error}=await supabaseClient().from("calibre_state").select("data,updated_at").eq("user_id",s.user.id).maybeSingle();
  if(error)throw error;
  return {signedIn:true,user:s.user,state:data?.data||null,updatedAt:data?.updated_at||null};
}

export async function writeCloudState(state){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,updatedAt:null};
  const updatedAt=new Date().toISOString();
  const payload={user_id:s.user.id,data:cleanState(state),updated_at:updatedAt};
  const {error}=await supabaseClient().from("calibre_state").upsert(payload,{onConflict:"user_id"});
  if(error)throw error;
  markCloudSeen(updatedAt);
  return {signedIn:true,user:s.user,updatedAt};
}

export async function readInbox(){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,items:[]};
  const {data,error}=await supabaseClient()
    .from("calibre_inbox")
    .select("id,push_id,job_data,created_at")
    .is("imported_at",null)
    .order("created_at",{ascending:true});
  if(error)throw error;
  return {signedIn:true,user:s.user,items:Array.isArray(data)?data:[]};
}

export async function markInboxImported(id){
  const s=await session();
  if(!s?.user||s.localOnly)throw new Error("Cloud session unavailable");
  const {error}=await supabaseClient()
    .from("calibre_inbox")
    .update({imported_at:new Date().toISOString()})
    .eq("id",id);
  if(error)throw error;
  return true;
}

export async function cloudStatus(){
  const s=await session();
  return {configured:true,signedIn:!!s?.user&&!s.localOnly,email:s?.localOnly?"":(s?.user?.email||"")};
}
