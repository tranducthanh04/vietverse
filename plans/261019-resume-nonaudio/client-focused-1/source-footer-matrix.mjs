import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { expect } = createRequire(import.meta.url)('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test');

export async function footerMatrix({openContext,base,stage,check,observations,models}) {
  const {User,Subscription,Child,Lesson,LessonProgress,PointTransaction}=models;
  const output=process.argv[2];
  const lesson=await Lesson.create({stageId:stage._id,order:6,title:'QA footer lesson',freeInStarterPlan:true,totalActivities:2,activities:['Next','Finish'].map((label,index)=>({id:`footer-${index}`,type:'sort_order',prompt:`QA footer ${label}`,correctAnswer:['Bé','yêu','Bé'],wrongHint:'QA text-only hint'}))});
  for(const language of ['vi','en']) for(const width of [320,390,640,1366]) {
    const tag=`${language}${width}`;
    const parent=await User.create({email:`footer-${tag}@example.test`,displayName:'QA Footer Parent',passwordHash:'synthetic-unused',role:'parent'});
    await Subscription.create({userId:parent._id,plan:'free'});
    const child=await Child.create({parentId:parent._id,name:`QA footer ${tag}`,ageGroup:'5-6',companionLanguages:['en'],screenTimeLimit:0});
    // Existing lesson order6 must be unlocked using actual completed prior lessons.
    const earlier=await Lesson.find({stageId:stage._id,order:{$lt:6}});
    await LessonProgress.create(earlier.map(item=>({childId:child._id,lessonId:item._id,status:'completed',scorePercent:100,stars:3})));
    // Keep stage incomplete so reward expectations don't include a stage bonus.
    if (!(await Lesson.exists({stageId:stage._id,order:7}))) await Lesson.create({stageId:stage._id,order:7,title:'QA later',totalActivities:1,activities:[{id:'later',type:'word_card',prompt:'Later',targetWord:'A'}]});
    const context=await openContext(parent,language,width);
    const page=context.pages()[0];
    await page.goto(`${base}/hoc/${lesson.id}`);
    const footer=page.locator('footer');
    const button=footer.getByRole('button');
    const session=()=>page.evaluate(async()=>{const {useLessonSessionStore}=await import('/src/store/lessonSessionStore.ts');return useLessonSessionStore.getState().currentSession;});
    const geometry=async id=>{
      await footer.scrollIntoViewIfNeeded();
      const data=await footer.evaluate(element=>{
        const button=element.querySelector('button');
        const status=element.firstElementChild.firstElementChild;
        const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const textRects=node=>{
          const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),rectangles=[];
          let text;while((text=walker.nextNode())) if(text.textContent.trim()) {
            const range=document.createRange();range.selectNodeContents(text);
            for(const r of range.getClientRects())rectangles.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom});
          }return rectangles;
        };
        const b=rect(button),center={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};
        const text=button.querySelector('span');
        return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,footer:rect(element),button:b,disabled:button.disabled,
          hit:button.contains(document.elementFromPoint(center.x,center.y)),buttonText:button.innerText,statusText:status.innerText,
          buttonTextRects:textRects(text),statusTextRects:textRects(status),buttonFont:getComputedStyle(button).fontSize};
      });
      observations.push({id,...data});
      assert(data.documentWidth<=width+1,`Document exceeds viewport: ${JSON.stringify(data)}`);
      for(const [name,r] of [['footer',data.footer],['button',data.button],...data.statusTextRects.map(r=>['status text',r]),...data.buttonTextRects.map(r=>['button text',r])]) {
        assert(r.left>=-1&&r.right<=width+1&&r.top>=-1&&r.bottom<=data.viewport.height+1,`${name} outside viewport: ${JSON.stringify(data)}`);
      }
      assert(data.button.width>=44&&data.button.height>=44);
      assert(parseFloat(data.buttonFont)>=18);
      if(!data.disabled)assert(data.hit,'Enabled action must be topmost at its center');
      for(const r of data.statusTextRects) assert(r.right<=data.button.left+1||r.left>=data.button.right-1||r.bottom<=data.button.top+1||r.top>=data.button.bottom-1,'Status text overlaps action');
      for(const r of data.buttonTextRects) assert(r.left>=data.button.left&&r.right<=data.button.right&&r.top>=data.button.top&&r.bottom<=data.button.bottom,'Button text clipped');
      await page.screenshot({path:join(output,`${id}.png`),animations:'disabled'});
    };
    const focusByTab=async()=>{
      for(let i=0;i<12;i++) {
        await page.keyboard.press('Tab');
        if(await button.evaluate(node=>document.activeElement===node))break;
      }
      await expect(button).toBeFocused();
    };
    await check(`${tag}-footer-actions`,async()=>{
      for(const [index,label] of ['Next','Finish'].entries()) {
        await expect(page.getByRole('heading',{name:`QA footer ${label}`})).toBeVisible();
        const name=language==='vi'?(index===0?'Tiếp theo':'Hoàn thành bài'):(index===0?'Next':'Finish lesson');
        await expect(button).toHaveText(name);
        await expect(button).toBeDisabled();
        await check(`${tag}-${label}-unanswered`,()=>geometry(`${tag}-${label}-unanswered`));
        await page.getByRole('button',{name:'yêu',exact:true}).click();
        await page.getByRole('button',{name:'Bé',exact:true}).first().click();
        await page.getByRole('button',{name:'Bé',exact:true}).click();
        await expect.poll(async()=>(await session())?.hearts).toBe(2-index);
        await expect(button).toBeEnabled();
        await check(`${tag}-${label}-wrong`,()=>geometry(`${tag}-${label}-wrong`));
        await page.getByRole('button',{name:language==='vi'?'Xếp lại':'Reorder',exact:true}).click();
        await expect(page.getByRole('button',{name:'Bé',exact:true})).toHaveCount(2);
        assert.equal((await session()).hearts,2-index);
        assert.equal(await PointTransaction.countDocuments({childId:child._id}),0);
        for(const word of ['Bé','yêu','Bé'])await page.getByRole('button',{name:word,exact:true}).first().click();
        await expect.poll(async()=>(await session())?.answers?.find(answer=>answer.activityId===`footer-${index}`)?.isCorrect).toBe(true);
        await check(`${tag}-${label}-correct`,()=>geometry(`${tag}-${label}-correct`));
        await focusByTab();
        if(index===0) await page.keyboard.press('Enter');
        else {
          const completion=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/v1/lessons/${lesson.id}/complete`);
          if(width===320||width===640)await page.keyboard.press('Enter');else await button.click();
          const response=await completion;assert.equal(response.status(),200);
          const data=(await response.json()).data;
          assert.equal(data.scorePercent,100);assert.equal(data.pointsEarned,12);
          assert.equal((await Child.findById(child.id)).viviPoints,12);
          observations.push({id:tag+'-activated',next:'keyboard',finish:width===320||width===640?'keyboard':'pointer',points:12});
        }
      }
    });
    await context.close();
  }
}
