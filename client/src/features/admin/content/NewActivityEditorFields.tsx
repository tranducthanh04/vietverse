import React from 'react';
import type { Activity } from './content.types.js';
import { TextField } from './FormFields.js';
import { MediaFields } from './MediaFields.js';
import { FieldNotes } from './EditorialNotes.js';
export type NewEditorProps = { activity: Activity; onChange: (activity: Activity) => void; index: number };

export function OptionRows({activity,onChange,index,onRemove}:{activity:Activity;onChange:(activity:Activity)=>void;index:number;onRemove:(id:string)=>void}){
  const n=index+1, path=`activities.${index}`;
  return <fieldset><legend>Lựa chọn {n}</legend><FieldNotes field={`${path}.options`}/>
    {(activity.options??[]).map((option,i)=><fieldset key={option.id}>
      <TextField label={`Lựa chọn ${n}.${i+1}`} name={`${path}.options.${i}.text`} value={option.text??''}
        onChange={text=>onChange({...activity,options:activity.options!.map((old,at)=>at===i?{...old,text}:old)})}/>
      <MediaFields value={option} prefix={`${path}.options.${i}.`} onChange={change=>onChange({...activity,options:activity.options!.map((old,at)=>at===i?{...old,...change}:old)})}/>
      <button type="button" aria-label={`Đưa lựa chọn ${n}.${i+1} lên`} disabled={i===0} onClick={()=>{
        const options=[...activity.options!]; [options[i-1],options[i]]=[options[i],options[i-1]]; onChange({...activity,options});
      }}>Lên</button>
      <button type="button" onClick={()=>onRemove(option.id)}>Xóa lựa chọn {n}.{i+1}</button>
    </fieldset>)}
    <button type="button" disabled={(activity.options?.length??0)>=12} onClick={()=>onChange({...activity,options:[...(activity.options??[]),{id:crypto.randomUUID(),text:'',audioUrl:'',imageUrl:''}]})}>Thêm lựa chọn {n}</button>
  </fieldset>;
}
export function answerMap(activity:Activity):Record<string,string>{
  return activity.correctAnswer && typeof activity.correctAnswer==='object' && !Array.isArray(activity.correctAnswer) ? activity.correctAnswer : {};
}
