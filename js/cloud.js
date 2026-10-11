import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://jdeqnboljrgrpnvkfthx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fWijlFfBeTw4Ku8EPkno7w_BgOARn0j";
export const CLOUD_SEEN_KEY = "calibre-cloud-seen-at";
export const CLOUD_REVISION_KEY = "calibre-cloud-seen-revision";

const LOCAL_SESSION={user:{id:"__calibre_local__",email:""},localOnly:true};
let client;
let recoveryPromise=null;

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
      if(value?.user?.id&&value?.access_token&&value?.refresh_token)return value;
    }
  }catch{}
  return null;
}

function sessionUsable(value){
  if(!value?.user?.id||!value?.access_token)return false;
  const expiresAt=Number(value.expires_at)||0;
  return !expiresAt||expiresAt*1000>Date.now()+30000;
}

async function recoverCachedSession(){
  if(recoveryPromise)return recoveryPromise;
  recoveryPromise=(async()=>{
    const cached=cachedSession();
    if(!cached)return null;
    const sb=supabaseClient();
    try{
      const {data,error}=await sb.auth.setSession({access_token:cached.access_token,refresh_token:cached.refresh_token});
      if(error)throw error;
      if(sessionUsable(data?.session))return data.session;
      const refreshed=await sb.auth.refreshSession(data?.session||cached);
      if(refreshed.error)throw refreshed.error;
      return sessionUsable(refreshed.data?.session)?refreshed.data.session:null;
    }catch(err){
      console.warn("Calibre cloud session recovery failed",err);
      return null;
    }
  })();
  try{return await recoveryPromise;}finally{recoveryPromise=null;}
}

export async function session(){
  const sb=supabaseClient();
  try{
    const {data,error}=await sb.auth.getSession();
    if(error)throw error;
    if(sessionUsable(data?.session))return data.session;
    if(data?.session?.refresh_token){
      const refreshed=await sb.auth.refreshSession(data.session);
      if(!refreshed.error&&sessionUsable(refreshed.data?.session))return refreshed.data.session;
    }
  }catch(err){
    console.warn("Calibre cloud session check failed",err);
  }
  return (await recoverCachedSession())||LOCAL_SESSION;
}

export async function signUp(email,password){
  const redirect=new URL("settings.html",location.href).href;
  return supabaseClient().auth.signUp({email,password,options:{emailRedirectTo:redirect}});
}
export async function signIn(email,password){return supabaseClient().auth.signInWithPassword({email,password});}
export async function requestPasswordReset(email){const redirect=new URL("settings.html?reset=1",location.href).href;return supabaseClient().auth.resetPasswordForEmail(email,{redirectTo:redirect});}
export async function updatePassword(password){return supabaseClient().auth.updateUser({password});}
export async function signOut(){return supabaseClient().auth.signOut();}

function cleanState(state){const copy=structuredClone(state||{});delete copy._cloud;return copy;}
export function seenCloudAt(){return localStorage.getItem(CLOUD_SEEN_KEY)||"";}
export function seenCloudRevision(){const value=Number(localStorage.getItem(CLOUD_REVISION_KEY));return Number.isInteger(value)&&value>=0?value:null;}
export function markCloudSeen(updatedAt,revision=null){if(updatedAt)localStorage.setItem(CLOUD_SEEN_KEY,updatedAt);if(Number.isInteger(Number(revision))&&Number(revision)>=0)localStorage.setItem(CLOUD_REVISION_KEY,String(Number(revision)));}
export function isCloudConflict(error){return error?.code==='CALIBRE_SYNC_CONFLICT';}
function conflictError(remoteRevision=null){const conflict=new Error('Cloud data changed since this device last saw it. Use Safe cloud pull to merge, or Safe cloud push only if you intend to overwrite the cloud copy.');conflict.code='CALIBRE_SYNC_CONFLICT';conflict.remoteRevision=remoteRevision;conflict.seenRevision=seenCloudRevision();return conflict;}

export async function readCloudState(){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,state:null,updatedAt:null,revision:null};
  const {data,error}=await supabaseClient().from("calibre_state").select("data,updated_at,revision").eq("user_id",s.user.id).maybeSingle();
  if(error)throw error;
  return {signedIn:true,user:s.user,state:data?.data||null,updatedAt:data?.updated_at||null,revision:data?.revision==null?null:Number(data.revision)};
}

async function currentRemoteRevision(userId){
  const {data,error}=await supabaseClient().from('calibre_state').select('revision,updated_at').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  return {revision:data?.revision==null?0:Number(data.revision),updatedAt:data?.updated_at||''};
}

export async function writeCloudState(state,{force=false}={}){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,updatedAt:null,revision:null};
  let expectedRevision=seenCloudRevision();
  if(force){
    const remote=await currentRemoteRevision(s.user.id);expectedRevision=remote.revision;
  }else if(expectedRevision==null){
    const remote=await currentRemoteRevision(s.user.id);
    if(remote.revision>0)throw conflictError(remote.revision);
    expectedRevision=0;
  }
  const {data,error}=await supabaseClient().rpc('calibre_write_state',{expected_revision:expectedRevision,new_data:cleanState(state)});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(!row||row.revision==null)throw conflictError(null);
  const revision=Number(row.revision),updatedAt=row.updated_at||new Date().toISOString();
  markCloudSeen(updatedAt,revision);
  return {signedIn:true,user:s.user,updatedAt,revision};
}

export async function readInbox(){
  const s=await session();
  if(!s?.user||s.localOnly)return {signedIn:false,items:[]};
  const {data,error}=await supabaseClient().from("calibre_inbox").select("id,push_id,job_data,created_at").is("imported_at",null).order("created_at",{ascending:true});
  if(error)throw error;
  return {signedIn:true,user:s.user,items:Array.isArray(data)?data:[]};
}
export async function markInboxImported(id){const s=await session();if(!s?.user||s.localOnly)throw new Error("Cloud session unavailable");const {error}=await supabaseClient().from("calibre_inbox").update({imported_at:new Date().toISOString()}).eq("id",id);if(error)throw error;return true;}
export async function cloudStatus(){const s=await session();return {configured:true,signedIn:!!s?.user&&!s.localOnly,email:s?.localOnly?"":(s?.user?.email||"")};}
