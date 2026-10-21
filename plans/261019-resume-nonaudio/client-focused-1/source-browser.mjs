import './safety.cjs';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { createServer as probe } from 'node:net';
import { createServer } from 'vite';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = resolve(process.argv[2]);
assert(output.startsWith(join(root, 'plans', '261019-resume-nonaudio')));
const { chromium, expect } = createRequire(import.meta.url)('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test');
const results = [], requests = [], errors = [], blocked = [], observations = [];
let mongo, apiServer, vite, browser, page, fault;
let lane = Promise.resolve(), nextAt = 0;
const persist = () => writeFile(join(output, 'browser-results.json'), JSON.stringify({results, requests, errors, blocked, observations}, null, 2));
const check = async (id, run) => {
  try { await run(); results.push({id, status:'PASS'}); console.log(`PASS ${id}`); }
  catch (error) {
    results.push({id, status:'FAIL', error:String(error), stack:error.stack}); console.log(`FAIL ${id}: ${error}`);
    if (page && !page.isClosed()) {
      await page.screenshot({path:join(output, `${id}-failure.png`), fullPage:true}).catch(()=>{});
      await writeFile(join(output, `${id}-failure.txt`), await page.locator('body').innerText().catch(()=>''));
    }
  }
  await persist();
};
const freePort = () => new Promise((res, rej) => {const s=probe();s.on('error',rej);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>res(port));});});
const pace = () => {const p=lane.then(async()=>{await new Promise(r=>setTimeout(r,Math.max(0,nextAt-Date.now())));nextAt=Date.now()+750;});lane=p.catch(()=>{});return p;};
const screenshot = async id => {await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(output,`${id}.png`),fullPage:true,animations:'disabled'});};
const layout = async id => {
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
  observations.push({id,...dimensions});assert(dimensions.width<=dimensions.viewport+1,JSON.stringify(dimensions));
};
try {
  const port=await freePort(), base=`http://127.0.0.1:${port}`;
  process.env.CLIENT_ORIGIN=base;
  const dbName=`nonaudio_${randomBytes(6).toString('hex')}`;
  mongo=await MongoMemoryReplSet.create({binary:{version:'8.2.6',systemBinary:process.env.MONGOMS_SYSTEM_BINARY},instanceOpts:[{ip:'127.0.0.1'}],replSet:{count:1,dbName,storageEngine:'wiredTiger'}});
  process.env.MONGODB_URI=mongo.getUri(dbName);
  await mongoose.connect(process.env.MONGODB_URI);
  const {app}=await import('../../server/src/app.ts');
  const {User,Subscription,Child,Stage,Lesson,LessonProgress,PointTransaction}=await import('../../server/src/models/index.ts');
  const {AuthService}=await import('../../server/src/modules/auth/auth.service.ts');
  await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
  const admin=await User.create({email:'nonaudio-admin@example.test',displayName:'QA Admin',passwordHash:'synthetic-unused',role:'admin'});
  await Subscription.create({userId:admin._id,plan:'free'});
  const stage=await Stage.create({order:1,slug:'nonaudio',title:'QA Stage',goal:'Synthetic only'});
  const sort=await Lesson.create({stageId:stage._id,order:1,title:'QA Sort',freeInStarterPlan:true,totalActivities:1,activities:[{id:'sort',type:'sort_order',prompt:'QA arrange repeated words',correctAnswer:['Bé','yêu','Bé'],wrongHint:'QA hint: start with Be'}]});
  const progressLessons=await Lesson.create(['Zero','Not started','Completed','Missing'].map((title,index)=>({stageId:stage._id,order:index+2,title:`QA ${title}`,totalActivities:1,activities:[{id:'intro',type:'word_card',prompt:'QA intro',targetWord:'A'}]})));
  apiServer=await new Promise((res,rej)=>{const s=app.listen(0,'127.0.0.1',()=>res(s));s.on('error',rej);});
  process.chdir(join(root,'client'));
  vite=await createServer({root:join(root,'client'),envFile:false,define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api/v1'),'import.meta.env.VITE_GOOGLE_CLIENT_ID':JSON.stringify('')},server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null,proxy:{'/api':{target:`http://127.0.0.1:${apiServer.address().port}`,changeOrigin:true}}}});
  await vite.listen();browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  observations.push({runtime:browser.version(),dbName,synthetic:true,frontendPort:port,apiPort:apiServer.address().port});
  const openContext=async(user,language,width)=>{
    const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
    const tokens=await AuthService.generateTokens(user);
    await context.addCookies([{name:'refreshToken',value:tokens.refreshToken,url:base,httpOnly:true,sameSite:'Lax'},{name:'vv_has_session',value:'1',url:base,sameSite:'Lax'}]);
    await context.addInitScript(language=>localStorage.setItem('vietverse_ui_language',language),language);
    await context.route('**/*',async route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.hostname!=='127.0.0.1'){blocked.push({host:url.hostname,path:url.pathname});return route.abort('blockedbyclient');}
      if(req.resourceType()==='media'||/\/recordings|\/payments|\/auth\/google|\/content-images\/|\/publish$/.test(url.pathname)) {
        blocked.push({path:url.pathname,forbidden:true});return route.abort('blockedbyclient');
      }
      if(url.pathname.startsWith('/api/')) {
        await pace();
        if(fault && url.pathname===fault.path) {
          fault.hits++;
          return route.fulfill({status:fault.status,contentType:'application/json',body:JSON.stringify(fault.body)});
        }
      }
      return route.continue();
    });
    page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',error=>errors.push({message:error.message}));
    page.on('response',response=>{const url=new URL(response.url());if(url.pathname.startsWith('/api/'))requests.push({method:response.request().method(),path:url.pathname,status:response.status()});});
    return context;
  };
  if (process.env.PR18_FOOTER_ONLY === '1') {
    const { footerMatrix } = await import('./footer-matrix.mjs');
    await footerMatrix({openContext,base,stage,check,observations,models:{User,Subscription,Child,Lesson,LessonProgress,PointTransaction}});
  }
  for(const [language,width] of process.env.PR18_FOOTER_ONLY === '1' ? [] : [['vi',320],['en',1366]]) {
    const tag=`${language}${width}`;
    const zero=await Child.create({parentId:admin._id,name:`QA detail ${tag}`,ageGroup:'5-6',companionLanguages:['en'],screenTimeLimit:0});
    const gone=await Child.create({parentId:admin._id,name:`QA absent ${tag}`,ageGroup:'5-6',companionLanguages:['en']});
    const retry=await Child.create({parentId:admin._id,name:`QA retry ${tag}`,ageGroup:'5-6',companionLanguages:['en'],screenTimeLimit:15});
    const empty=await Child.create({parentId:admin._id,name:`QA empty ${tag}`,ageGroup:'5-6',companionLanguages:['en']});
    await LessonProgress.create(progressLessons.map((lesson,index)=>({childId:zero._id,lessonId:lesson._id,status:['in_progress','not_started','completed','in_progress'][index],stars:index===2?2:0,scorePercent:index===2?75:0})));
    await LessonProgress.collection.updateOne({childId:zero._id,lessonId:progressLessons[3]._id},{$unset:{stars:'',scorePercent:'',status:''}});
    const adminContext=await openContext(admin,language,width);
    await page.goto(`${base}/admin/hoc-vien`);
    const row=name=>page.getByRole('row').filter({hasText:name});
    const dialog=()=>page.getByRole('dialog',{name:'Hồ Sơ Toàn Diện Của Bé'});
    const close=async()=>{await page.keyboard.press('Escape');await expect(dialog()).toHaveCount(0);};
    await check(`${tag}-admin-values`,async()=>{
      await row(zero.name).getByRole('button',{name:'Xem chi tiết'}).click();
      await expect(dialog().getByText('Không giới hạn',{exact:true})).toBeVisible();
      await expect(dialog().getByText('0%',{exact:true})).toHaveCount(2);
      await expect(dialog().getByText('75%',{exact:true})).toBeVisible();
      await expect(dialog().getByText('100%',{exact:true})).toHaveCount(0);
      for(const status of ['Đang học','Chưa bắt đầu','Hoàn thành','Chưa rõ trạng thái']) await expect(dialog().getByText(status,{exact:true})).toBeVisible();
      await expect(dialog().getByText('Chưa có dữ liệu',{exact:true})).toHaveCount(2);
      const stars=await dialog().locator('svg[aria-label="sao"]').evaluateAll(nodes=>nodes.map(n=>n.parentElement.textContent.trim()));
      assert.deepEqual(stars.sort(),['0','0','2','Chưa có dữ liệu'].sort());
      await layout(tag+'-admin');await screenshot(`${tag}-admin-values`);await close();
    });
    await check(`${tag}-admin-real-404`,async()=>{
      await Child.deleteOne({_id:gone._id});
      await row(gone.name).getByRole('button',{name:'Xem chi tiết'}).click();
      await expect(dialog().getByRole('alert')).toContainText('Không tìm thấy hồ sơ học viên');
      assert(requests.some(r=>r.path===`/api/v1/admin/learners/${gone.id}`&&r.status===404));
      await expect(dialog().getByText('Đang tải hồ sơ bé…')).toHaveCount(0);
      await screenshot(`${tag}-admin-404`);await close();
    });
    await check(`${tag}-admin-injected-error-real-retry`,async()=>{
      fault={path:`/api/v1/admin/learners/${retry.id}`,status:500,hits:0,body:{success:false,error:{message:'QA temporary failure'}}};
      await row(retry.name).getByRole('button',{name:'Xem chi tiết'}).click();
      await expect(dialog().getByRole('alert')).toContainText('QA temporary failure');
      assert(fault.hits>0);fault=null;
      await dialog().getByRole('button',{name:language==='vi'?/Thử lại/:/Try again/}).click();
      await expect(dialog().getByText('15 phút',{exact:true})).toBeVisible();
      await expect(dialog().getByRole('alert')).toHaveCount(0);
      assert(requests.some(r=>r.path===`/api/v1/admin/learners/${retry.id}`&&r.status===200));
      await screenshot(`${tag}-admin-retry`);await close();
    });
    await check(`${tag}-admin-injected-empty`,async()=>{
      fault={path:`/api/v1/admin/learners/${empty.id}`,status:200,hits:0,body:{success:true,data:null}};
      await row(empty.name).getByRole('button',{name:'Xem chi tiết'}).click();
      await expect(dialog().getByText('Không tìm thấy hồ sơ học viên.',{exact:true})).toBeVisible();
      assert(fault.hits>0);fault=null;await close();
    });
    fault=null;await adminContext.close();

    const parent=await User.create({email:`nonaudio-${tag}@example.test`,displayName:'QA Parent',passwordHash:'synthetic-unused',role:'parent'});
    await Subscription.create({userId:parent._id,plan:'free'});
    const learner=await Child.create({parentId:parent._id,name:`QA learner ${tag}`,ageGroup:'5-6',companionLanguages:['en'],screenTimeLimit:0,viviPoints:0});
    const parentContext=await openContext(parent,language,width);
    await page.goto(`${base}/hoc/${sort.id}`);
    const session=()=>page.evaluate(async()=>{const {useLessonSessionStore}=await import('/src/store/lessonSessionStore.ts');return useLessonSessionStore.getState().currentSession;});
    const state=async()=>({session:await session(),points:(await Child.findById(learner.id)).viviPoints,ledger:await PointTransaction.countDocuments({childId:learner._id}),completions:requests.filter(r=>r.path===`/api/v1/lessons/${sort.id}/complete`).length});
    await check(`${tag}-full-player-wrong-reset-correct`,async()=>{
      await expect(page.getByRole('heading',{name:'QA arrange repeated words'})).toBeVisible();
      const finish=page.getByRole('button',{name:language==='vi'?'Hoàn thành bài':'Finish lesson',exact:true});
      await expect(finish).toBeDisabled();
      await page.getByRole('button',{name:'yêu',exact:true}).click();
      await page.getByRole('button',{name:'Bé',exact:true}).first().click();
      await page.getByRole('button',{name:'Bé',exact:true}).click();
      await expect(page.getByRole('status').filter({hasText:'QA hint: start with Be'})).toBeVisible();
      await expect.poll(async()=>(await session())?.hearts).toBe(2);
      await expect.poll(async()=>(await session())?.answers?.[0]?.isCorrect).toBe(false);
      const beforeReset=await state();
      assert.equal(beforeReset.points,0);assert.equal(beforeReset.ledger,0);
      await screenshot(`${tag}-sort-wrong`);
      await page.getByRole('button',{name:language==='vi'?'Xếp lại':'Reorder',exact:true}).click();
      await expect(page.getByRole('button',{name:'Bé',exact:true})).toHaveCount(2);
      await expect(page.getByRole('button',{name:'yêu',exact:true})).toHaveCount(1);
      await expect(page.getByRole('status').filter({hasText:'QA hint: start with Be'})).toHaveCount(0);
      assert.deepEqual(await state(),beforeReset,'Reset must not mutate hearts, answer, points or completion');
      await screenshot(`${tag}-sort-reset`);
      await page.getByRole('button',{name:'Bé',exact:true}).first().click();
      await page.getByRole('button',{name:'yêu',exact:true}).click();
      await page.getByRole('button',{name:'Bé',exact:true}).click();
      await expect.poll(async()=>(await session())?.answers?.[0]?.isCorrect).toBe(true);
      const corrected=await state();
      assert.equal(corrected.session.hearts,2);assert.equal(corrected.points,0);assert.equal(corrected.ledger,0);
      assert.deepEqual(corrected.session.answers[0].userAnswer,['Bé','yêu','Bé']);
      await expect(page.locator('audio,video')).toHaveCount(0);
      // Keep the layout failure as its own result so server completion is still exercised.
      await check(`${tag}-full-player-layout`,async()=>layout(tag+'-sort'));
      await screenshot(`${tag}-sort-correct`);
      const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/v1/lessons/${sort.id}/complete`);
      await finish.click();const response=await responsePromise;
      assert.equal(response.status(),200);const data=(await response.json()).data;
      assert.equal(data.passed,true);assert.equal(data.scorePercent,100);assert.equal(data.stars,3);
      const saved=await LessonProgress.findOne({childId:learner._id,lessonId:sort._id}).orFail();
      assert.equal(saved.status,'completed');assert.equal(saved.scorePercent,100);
      const ledgers=await PointTransaction.find({childId:learner._id});
      assert.deepEqual(ledgers.map(entry=>({reason:entry.reason,delta:entry.delta})).sort((a,b)=>a.reason.localeCompare(b.reason)),[{reason:'activity',delta:1},{reason:'lesson',delta:10}]);
      assert.equal(data.pointsEarned,11);
      assert.equal((await Child.findById(learner.id)).viviPoints,11);
      observations.push({id:tag+'-completion',status:response.status(),data,heartsBeforeCompletion:2});
      await expect(page.getByRole('dialog')).toBeVisible();
      await screenshot(`${tag}-sort-finished`);
    });
    await parentContext.close();
  }
  await check('no-page-errors-or-forbidden-requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(blocked.filter(x=>x.forbidden),[]);assert(!requests.some(r=>r.status===429));});
} catch(error) {
  results.push({id:'harness',status:'FAIL',error:String(error),stack:error.stack});console.error(error);
} finally {
  await browser?.close();await vite?.close();
  if(apiServer)await new Promise(resolve=>apiServer.close(resolve));
  await mongoose.disconnect();await mongo?.stop();
  observations.push({cleanup:'browser, vite, API, mongoose and temporary replica set stopped'});
  await persist();
}
process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
