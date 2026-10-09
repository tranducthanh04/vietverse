import React from 'react';
import type { NewEditorProps } from './NewActivityEditorFields.js';
import { TextField } from './FormFields.js';
import { FieldNotes } from './EditorialNotes.js';
export function FollowStepsEditor({activity,onChange,index}:NewEditorProps){
  const n=index+1,path=`activities.${index}`;
  return <fieldset><legend>Bước thực hiện {n}</legend><FieldNotes field={`${path}.steps`}/>
    <p>Bé tự xác nhận; không kiểm chứng động tác ngoài đời. Audio thiếu vẫn giữ lời hướng dẫn.</p>
    {(activity.steps??[]).map((step,i)=><div key={step.id}>
      <TextField label={`Bước ${n}.${i+1}`} name={`${path}.steps.${i}.text`} value={step.text}
        onChange={text=>onChange({...activity,steps:activity.steps!.map((old,at)=>at===i?{...old,text}:old)})}/>
      <button type="button" disabled={i===0} aria-label={`Đưa bước ${n}.${i+1} lên`} onClick={()=>{
        const steps=[...activity.steps!];[steps[i-1],steps[i]]=[steps[i],steps[i-1]];onChange({...activity,steps});
      }}>Lên</button>
      <button type="button" onClick={()=>onChange({...activity,steps:activity.steps!.filter(old=>old.id!==step.id)})}>Xóa bước {n}.{i+1}</button>
    </div>)}
    <button type="button" disabled={(activity.steps?.length??0)>=3} onClick={()=>onChange({...activity,steps:[...(activity.steps??[]),{id:crypto.randomUUID(),text:''}]})}>Thêm bước {n}</button>
  </fieldset>;
}
