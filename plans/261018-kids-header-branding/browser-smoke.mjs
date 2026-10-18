import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-kids-brand-'));
const port = 5196;
const widths=(process.env.SMOKE_WIDTHS||'320,390,640,1366').split(',').map(Number);
const balances=(process.env.SMOKE_BALANCES||'0,1234567890').split(',').map(Number);
assert(widths.length<=8&&widths.every(n=>Number.isInteger(n)&&n>=320&&n<=1920));
assert(balances.length<=2&&balances.every(n=>n===0||n===1234567890));
const paths = ['/kham-pha', '/kho-truyen', '/van-hoa', '/diem-thuong', '/phong-bau-vat'];
const taglines = {
  vi: 'CÙNG CON MỞ KHO BÁU, TIẾNG VIỆT THÊM NHIỆM MÀU',
  en: 'OPEN THE TREASURE WITH YOUR CHILD, MAKE VIETNAMESE MAGICAL',
};
const child = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0 };
const longName = 'Nguyễn Hoàng Thiên An Minh Khôi';
const fixtureId = '/__brand-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KidsLayout } from '/src/app/layouts/KidsLayout.tsx';
import { PublicLayout } from '/src/app/layouts/PublicLayout.tsx';
import { PricingPage } from '/src/features/public/PricingPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
const profile = {...${JSON.stringify(child)}, viviPoints:Number(params.get('points')), name:params.get('points') === '0' ? 'An' : ${JSON.stringify(longName)}};
const second = {...profile,_id:'b',name:'Binh'};
useAuthStore.setState({user:{id:'parent',email:'p@example.test',displayName:'Parent',role:params.get('role')},isLoading:false});
useChildStore.setState({activeChild:profile,children:[profile,second],isLoading:false});
useUiLanguageStore.getState().setLanguage(params.get('lang'));
const content=React.createElement('div',{style:{minHeight:1400,display:'flex',flexDirection:'column',justifyContent:'space-between'}},
 React.createElement('h1',{id:'first-content'},'Local layout fixture'),React.createElement('button',{id:'last-content',style:{minHeight:44,minWidth:44}},'Last content control'));
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},
 React.createElement(BrowserRouter,null,React.createElement(Routes,null,
  React.createElement(Route,{element:React.createElement(ProtectedRoute,null,React.createElement(ChildSessionGuard,null,React.createElement(KidsLayout)))},
   ...${JSON.stringify(paths)}.map(path=>React.createElement(Route,{key:path,path,element:content}))),
  React.createElement(Route,{element:React.createElement(PublicLayout)},React.createElement(Route,{path:'/gia',element:React.createElement(PricingPage)})),
  ...['/','/admin','/phu-huynh/tien-do'].map(path=>React.createElement(Route,{key:path,path,element:React.createElement('h1',null,'Fixture destination '+path)}))))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host:'127.0.0.1', port, strictPort:true, hmr:false, watch:null },
  plugins:[{name:'kids-brand-fixture',resolveId(id){if(id===fixtureId)return id;},load(id){if(id===fixtureId)return fixture;},
    configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
      if(!/^\/(?:kham-pha|kho-truyen|van-hoa|diem-thuong|phong-bau-vat|gia|admin|phu-huynh\/tien-do)?(?:\?|$)/.test(req.url||''))return next();
      res.setHeader('Content-Type','text/html');
      res.end(await vite.transformIndexHtml(req.url,html.replace('/src/main.tsx',fixtureId)));
    });}},
  ],
});

async function headerGeometry(page, language, label) {
  const header=page.getByRole('banner');
  const brand=header.getByRole('link',{name:'VIETVERSE',exact:true});
  assert.equal(await brand.getAttribute('href'),'/');
  const tagline=header.getByText(taglines[language],{exact:true});
  await tagline.waitFor();
  assert.deepEqual(await header.evaluate((el, text)=>{
    const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
    const bounds=el.getBoundingClientRect();
    const controls=[...el.querySelectorAll('a,button')].filter(e=>e.getClientRects().length);
    const boxes=controls.map(e=>e.getBoundingClientRect());
    const invalid=controls.filter((e,i)=>boxes[i].width<44||boxes[i].height<44||!inside(boxes[i],bounds)||boxes[i].right>innerWidth||boxes[i].left<0).map(e=>e.getAttribute('aria-label')||e.textContent);
    const overlap=boxes.some((a,i)=>boxes.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
    const node=[...el.querySelectorAll('*')].find(e=>e.textContent===text&&e.children.length===0);
    const wordmark=[...el.querySelectorAll('span')].find(e=>e.textContent==='VIETVERSE');
    const clipped=[node,wordmark].some(part=>{const range=document.createRange();range.selectNodeContents(part);return [...range.getClientRects()].some(r=>!inside(r,part.getBoundingClientRect())||!inside(r,bounds));});
    const style=getComputedStyle(node);
    return {invalid,overlap,clipped,smallTagline:parseFloat(style.fontSize)<12,hidden:style.visibility==='hidden'||style.display==='none',overflow:document.documentElement.scrollWidth>innerWidth};
  },taglines[language]),{invalid:[],overlap:false,clipped:false,smallTagline:false,hidden:false,overflow:false},label);
}

async function activate(page, control, keyboard) {
  if(!keyboard)return control.click();
  // Always traverse actual tab order, including when Escape returned focus to this control.
  await page.keyboard.press('Tab');
  if(await control.evaluate(el=>el===document.activeElement))await page.keyboard.press('Tab');
  for(let i=0;i<32&&!(await control.evaluate(el=>el===document.activeElement));i++)await page.keyboard.press('Tab');
  // Await real transition completion before inspecting the rendered 2px focus indicator.
  await control.evaluate(async el=>{
    await new Promise(resolve=>requestAnimationFrame(resolve));
    let timeout;
    try { await Promise.race([Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Focus transition exceeded 500ms')),500);})]); }
    finally {clearTimeout(timeout);}
    await new Promise(resolve=>requestAnimationFrame(resolve));
  });
  const focus=await control.evaluate(el=>{
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    const visibleColor=color=>color!=='transparent'&&!/rgba\([^)]*,\s*0\)/.test(color);
    const outline=parseFloat(style.outlineWidth)>=2&&style.outlineStyle!=='none'&&visibleColor(style.outlineColor);
    const ring=style.boxShadow.split(/,(?![^()]*\))/).some(shadow=>visibleColor(shadow)&&parseFloat(shadow.match(/-?[\d.]+px/g)?.[3]||'0')>=2);
    return {active:el===document.activeElement,visible:el.matches(':focus-visible'),indicator:outline||ring,inViewport:rect.width>0&&rect.height>0&&rect.top>=0&&rect.bottom<=innerHeight,boxShadow:style.boxShadow,outline:style.outline};
  });
  assert(focus.active&&focus.visible&&focus.indicator&&focus.inViewport,'Keyboard focus: '+await control.getAttribute('aria-label')+' '+JSON.stringify(focus));
  await page.keyboard.press('Enter');
}

let browser;
try {
  await server.listen();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({reducedMotion:'reduce'});
  const errors=[],unexpected=[];
  let profiles=[],selections=0,verified=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname,method=route.request().method();
    let data;
    if(method==='GET'&&path==='/api/v1/children')data=profiles;
    if(method==='PATCH'&&path==='/api/v1/children/b/select'){data=profiles[1];selections++;}
    if(method==='GET'&&path==='/api/v1/parent/gate/challenge')data={num1:7,num2:8,challengeToken:'local-challenge'};
    if(method==='POST'&&path==='/api/v1/parent/gate/verify'){
      assert.deepEqual(route.request().postDataJSON(),{challengeToken:'local-challenge',answer:56});
      data={gateToken:'local-gate'};verified++;
    }
    if(data===undefined){unexpected.push(method+' '+path);return route.abort();}
    await route.fulfill({contentType:'application/json',body:JSON.stringify({data})});
  });
  let cases=0;
  for(const width of widths)for(const language of ['vi','en'])for(const role of ['parent','admin'])for(const balance of balances){
    const label=`${language} ${role} ${width}px points=${balance}`;
    profiles=[{...child,name:balance?longName:'An',viviPoints:balance},{...child,_id:'b',name:'Binh',viviPoints:balance}];
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:${port}/kham-pha?lang=${language}&role=${role}&points=${balance}`,{waitUntil:'domcontentloaded'});
    const header=page.getByRole('banner'),nav=page.getByRole('navigation');
    await header.getByRole('link',{name:'VIETVERSE',exact:true}).waitFor();
    assert(await page.evaluate(async()=>{await document.fonts.ready;const faces=await document.fonts.load('800 12px "Be Vietnam Pro"','VIETVERSE TIẾNG VIỆT');return faces.length>0&&faces.every(f=>f.status==='loaded');}),'Real font');
    await headerGeometry(page,language,label);
    assert(await page.evaluate(()=>document.getElementById('first-content').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom),'Top content clearance');
    await page.screenshot({path:resolve(shots,`${language}-${role}-${width}-${balance}.png`)});
    for(const target of paths){
      await nav.locator(`a[href="${target}"]`).click();await page.waitForURL('**'+target);
      if(target!=='/kham-pha')await page.waitForFunction(()=>document.activeElement?.id==='main-content');
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      assert.deepEqual(await page.evaluate(()=>{
        const bar=document.querySelector('nav'),links=[...bar.querySelectorAll('a')],boxes=links.map(e=>e.getBoundingClientRect());
        const overlap=boxes.some((a,i)=>boxes.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
        const clipped=links.some((link,i)=>{const range=document.createRange();range.selectNodeContents(link.querySelector('span'));return [...range.getClientRects()].some(r=>r.left<boxes[i].left-1||r.right>boxes[i].right+1||r.bottom>boxes[i].bottom+1);});
        return {sticky:Math.abs(document.querySelector('header').getBoundingClientRect().top)<1,covered:document.getElementById('last-content').getBoundingClientRect().bottom>bar.getBoundingClientRect().top,small:boxes.some(r=>r.width<44||r.height<44),overflow:document.documentElement.scrollWidth>innerWidth,overlap,clipped,rows:new Set(boxes.map(r=>r.top)).size};
      }),{sticky:true,covered:false,small:false,overflow:false,overlap:false,clipped:false,rows:width<400?2:1},label+' '+target);
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    const other=language==='vi'?'en':'vi';
    await activate(page,header.getByRole('button').filter({hasText:new RegExp('^'+other.toUpperCase()+'$')}),balance>0);
    await headerGeometry(page,other,label+' switched');
    await activate(page,header.getByRole('button').filter({hasText:new RegExp('^'+language.toUpperCase()+'$')}),balance>0);
    const picker=header.getByRole('button',{name:/Chọn hồ sơ bé|Choose child profile/});
    await activate(page,picker,balance>0);await page.locator('#child-picker-menu').waitFor();
    assert(await page.locator('#child-picker-menu').evaluate(el=>[...el.querySelectorAll('button')].every(button=>{const r=button.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})),'Picker visible touch targets fit');
    await page.keyboard.press('Escape');
    assert(await picker.evaluate(e=>e===document.activeElement),'Picker Escape focus');
    await activate(page,picker,balance>0);await activate(page,page.locator('#child-picker-menu').getByRole('button',{name:/^Binh/}),balance>0);
    await page.waitForFunction(()=>document.querySelector('header button[aria-haspopup]')?.textContent.includes('Binh'));
    await headerGeometry(page,language,label+' selected');
    const brand=header.getByRole('link',{name:'VIETVERSE',exact:true});
    await activate(page,brand,balance>0);
    await page.waitForURL(url=>url.pathname==='/');await page.goBack();await nav.waitFor();
    await activate(page,header.getByRole('link',{name:/Điểm thưởng|Rewards/}),balance>0);await page.waitForURL('**/diem-thuong');
    await activate(page,nav.locator('a[href="/gia"]'),balance>0);await page.waitForURL('**/gia');await page.getByText('250.000đ',{exact:true}).waitFor();
    assert.equal(await page.getByRole('dialog').count(),0);await page.goBack();await nav.waitFor();
    const admin=header.getByRole('button',{name:/Quản trị hệ thống|System administration/});
    assert.equal(await admin.count(),role==='admin'?1:0);
    if(role==='admin'){await activate(page,admin,balance>0);await page.waitForURL('**/admin');await page.goBack();await nav.waitFor();}
    await page.evaluate(()=>{sessionStorage.removeItem('vietverse_parent_gate_token');sessionStorage.removeItem('vietverse_parent_gate_unlocked');});
    await activate(page,header.getByRole('button',{name:/Vào Góc Phụ Huynh|Enter the Parent Corner/}),balance>0);
    const answer=page.getByRole('spinbutton');await answer.fill('56');await answer.press('Enter');
    await page.waitForURL('**/phu-huynh/tien-do');assert.equal(await page.evaluate(()=>sessionStorage.getItem('vietverse_parent_gate_token')),'local-gate');
    console.log('PASS '+label);cases++;
  }
  const expected=widths.length*4*balances.length;
  assert.equal(cases,expected);assert.equal(selections,expected);assert.equal(verified,expected);
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  console.log(`PASS ${cases} cases; screenshots: ${shots}`);
} finally {await browser?.close();await server.close();}
