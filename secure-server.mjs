import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loginPage} from './server/login-page.mjs';

const root=fileURLToPath(new URL('./public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const hash=value=>createHash('sha256').update(value).digest();
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// This server is deliberately separate from the GitHub Pages preview server.
// Put it behind HTTPS at /atlas/ before retiring the public static deployment.
export function createSecureServer({password=process.env.ATLAS_PASSWORD,sessionSecret=process.env.ATLAS_SESSION_SECRET||randomBytes(32),basePath=process.env.ATLAS_BASE_PATH||'',publicOrigin=process.env.ATLAS_PUBLIC_ORIGIN||'',sessionSeconds=8*60*60,now=Date.now,maxFailures=10,trustProxy=false}={}){
 if(basePath&&!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath))throw Error('Invalid ATLAS_BASE_PATH');
 if(publicOrigin&&new URL(publicOrigin).origin!==publicOrigin)throw Error('ATLAS_PUBLIC_ORIGIN must be an origin without a path');
 if(publicOrigin&&new URL(publicOrigin).protocol!=='https:')throw Error('Public hosting requires HTTPS');
 if(typeof sessionSecret==='string'&&Buffer.byteLength(sessionSecret)<32)throw Error('ATLAS_SESSION_SECRET must contain at least 32 bytes');
 const cookieName='atlas_session',cookiePath=basePath+'/',secure=Boolean(publicOrigin),sessions=new Map(),attempts=new Map();
 const expected=password?hash(password):null,sign=value=>createHmac('sha256',sessionSecret).update(value).digest('base64url');
 const cookie=(value,expired=false)=>`${cookieName}=${value}; Path=${cookiePath}; HttpOnly; SameSite=Strict${secure?'; Secure':''}${expired?'; Max-Age=0':''}`;
 const loginCookie=value=>`atlas_login=${value}; Path=${cookiePath}; HttpOnly; SameSite=Strict${secure?'; Secure':''}; Max-Age=600`;
 const readCookie=(req,name)=>String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
 function validLoginToken(req,token){
  if(typeof token!=='string'||token.length>300||token!==readCookie(req,'atlas_login'))return false;
  const [id,expiry,signature,...extra]=token.split('.');if(extra.length||!id||!/^\d+$/.test(expiry||'')||Number(expiry)<=now()||!signature)return false;
  const a=Buffer.from(signature),b=Buffer.from(sign('login:'+id+'.'+expiry));return a.length===b.length&&timingSafeEqual(a,b);
 }
 const clean=()=>{for(const [id,expiry] of sessions)if(expiry<=now())sessions.delete(id);for(const [ip,bucket] of attempts)if(bucket.until<=now())attempts.delete(ip);};
 function verified(req){
  const token=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!token||token.length>300)return null;
  const [id,expiry,signature,...extra]=token.split('.');
  if(extra.length||!id||!/^\d+$/.test(expiry||'')||!signature)return null;
  const value=id+'.'+expiry,a=Buffer.from(signature),b=Buffer.from(sign(value));
  if(a.length!==b.length||!timingSafeEqual(a,b)||Number(expiry)<=now()||sessions.get(id)!==Number(expiry))return null;
  return id;
 }
 return http.createServer(async(req,res)=>{
  const nonce=randomBytes(18).toString('base64');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`);
  const send=(status,text,type='text/plain; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(req.method==='HEAD'?'':text);};
  const redirect=location=>{res.writeHead(303,{Location:location});res.end();};
  try{
   const url=new URL(req.url,'http://localhost');
   if(basePath&&url.pathname===basePath)return redirect(basePath+'/');
   if(!url.pathname.startsWith(cookiePath))return send(404,'Not found');
   const route=decodeURIComponent(url.pathname.slice(basePath.length));
   if(!expected)return send(503,'Atlas access is not configured.');
   clean();
   const id=verified(req),home=basePath+'/';
   const returnPath=value=>{if(typeof value!=='string'||!value.startsWith(home)||value.startsWith('//')||/[\\\r\n]/.test(value))return home;const destination=new URL(value,'https://atlas.invalid');return destination.origin==='https://atlas.invalid'&&destination.pathname.startsWith(home)&&!destination.pathname.startsWith(basePath+'/auth/')?destination.pathname+destination.search+destination.hash:home;};
   const login=(status,error='',returnTo=home)=>{const value=randomBytes(24).toString('base64url')+'.'+(now()+600000),csrf=value+'.'+sign('login:'+value);res.setHeader('Set-Cookie',loginCookie(csrf));return send(status,loginPage({basePath,error,returnTo:returnPath(returnTo),nonce,csrf}),'text/html; charset=utf-8');};
   if(route==='/auth/login'||route==='/auth/logout'){
    if(req.method!=='POST')return send(405,'Use POST.');
    const requestOrigin=publicOrigin||`http://${req.headers.host}`;
    // Sandboxed browsers can send an opaque Origin. They must still prove the
    // signed form token and same-origin fetch metadata; cross-site forms fail.
    const opaqueOrigin=req.headers.origin==='null';
    if(req.headers['sec-fetch-site']==='cross-site'||(opaqueOrigin&&req.headers['sec-fetch-site']!=='same-origin')||(!opaqueOrigin&&req.headers.origin&&req.headers.origin!==requestOrigin))return send(403,'Request origin rejected.');
    if(route==='/auth/logout'){if(id)sessions.delete(id);res.setHeader('Set-Cookie',cookie('',true));return redirect(home);}
    if(!String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded'))return send(415,'Unsupported form encoding.');
    // Do not trust client IP headers unless the deployment explicitly uses a trusted proxy.
    const ip=trustProxy?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
    const bucket=attempts.get(ip);
    if(bucket?.failures>=maxFailures){res.setHeader('Retry-After',Math.ceil((bucket.until-now())/1000));return login(429,'Too many attempts. Please try again in 15 minutes.');}
    if(attempts.size>=5000||sessions.size>=10000)return send(503,'Please try again later.');
    let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>4096)return send(413,'Request too large.');}
    const form=new URLSearchParams(body),candidate=form.get('password')||'',returnTo=returnPath(form.get('returnTo'));
    if(!validLoginToken(req,form.get('csrf')))return send(403,'Please reload the login page and try again.');
    if(!timingSafeEqual(hash(candidate),expected)){attempts.set(ip,{failures:(bucket?.failures||0)+1,until:bucket?.until||now()+15*60*1000});return login(401,'Incorrect password. Try again.',returnTo);}
    const sessionId=randomBytes(32).toString('base64url'),expiry=now()+sessionSeconds*1000,value=sessionId+'.'+expiry;
    sessions.set(sessionId,expiry);attempts.delete(ip);res.setHeader('Set-Cookie',cookie(value+'.'+sign(value)));return redirect(returnTo);
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,'Method not allowed.');
   if(!id){if(route==='/'||route==='/index.html')return login(200,'',url.pathname+url.search);return send(401,'Password required.');}
   if(route==='/access.js')return send(404,'Not found');
   if(route==='/api/session')return send(200,JSON.stringify({authenticated:true}),'application/json');
   if(route==='/auth-session.js')return send(200,`const button=document.createElement('button');button.className='plain';button.textContent='Lock';button.setAttribute('aria-label','Lock Atlas');button.onclick=async()=>{const r=await fetch(${JSON.stringify(basePath+'/auth/logout')},{method:'POST'});if(r.ok)location.reload()};document.querySelector('header').append(button);`,'text/javascript; charset=utf-8');
   const name=route==='/'?'/index.html':route;
   if(name.includes('\0')||name.includes('\\')||name.split('/').some(p=>p.startsWith('.')))return send(404,'Not found');
   const target=path.resolve(root,'.'+name);if(!target.startsWith(root))return send(404,'Not found');
   let data=await readFile(target);
   if(name==='/index.html'){
    // The secure response has no client-side password verifier or hidden app.
    let html=data.toString().replace(/<section id="password-gate"[\s\S]*?<\/section>/,'').replace('<div id="atlas-app" hidden>','<div id="atlas-app">').replace(/<script type="module" src="\.\/access\.js[^\"]*"><\/script>/,'<script type="module" src="./app.js?v=table-fit-1"></script><script type="module" src="./auth-session.js"></script>');
    html=html.replace(/<script(?=[ >])/g,`<script nonce="${escape(nonce)}"`);data=Buffer.from(html);
   }
   return send(200,data,types[path.extname(target)]||'application/octet-stream');
  }catch(error){return send(error.code==='ENOENT'?404:400,'Request could not be completed.');}
 });
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(!process.env.ATLAS_PASSWORD){console.error('Set ATLAS_PASSWORD in the server environment before starting Atlas.');process.exitCode=1;}
 else createSecureServer().listen(Number(process.env.PORT||4323),process.env.HOST||'127.0.0.1',()=>console.log('Protected Atlas server listening on port '+(process.env.PORT||4323)));
}


