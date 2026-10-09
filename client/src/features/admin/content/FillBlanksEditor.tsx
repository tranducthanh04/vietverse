import React,{useState} from 'react';
import type { NewEditorProps } from './NewActivityEditorFields.js';
import { TextField } from './FormFields.js';
import { FieldNotes } from './EditorialNotes.js';
export function FillBlanksEditor({activity,onChange,index}:NewEditorProps){
  const [warning,setWarning]=useState(false);const n=index+1,path=`activities.${index}`;
  return <>
    <TextField label={`Mẫu câu ${n}`} name={`${path}.template`} value={activity.template??''} multiline onChange={template=>onChange({...activity,template})}/>
    <p>Chèn marker {'{{slot-id}}'} đúng một lần cho mỗi ô. Không tự chuyển dấu gạch dưới thành nhiều ô.</p>
    {warning&&<p role="status">Sửa marker của ô vừa xóa trong mẫu câu. Đáp án còn lại không bị đổi.</p>}
    <fieldset><legend>Ô trống {n}</legend><FieldNotes field={`${path}.blankSlots`}/>
      {(activity.blankSlots??[]).map((slot,i)=><fieldset key={slot.id}><legend>Ô {n}.{i+1} · Marker {'{{'+slot.id+'}}'}</legend>
        <TextField label={`Nhãn ô ${n}.${i+1}`} name={`${path}.blankSlots.${i}.label`} value={slot.label}
          onChange={label=>onChange({...activity,blankSlots:activity.blankSlots!.map((old,at)=>at===i?{...old,label}:old)})}/>
        <FieldNotes field={`${path}.blankSlots.${i}.acceptedAnswers`}/>
        {slot.acceptedAnswers.map((answer,k)=><div key={k}>
          <TextField label={`Đáp án ô ${n}.${i+1}.${k+1}`} name={`${path}.blankSlots.${i}.acceptedAnswers.${k}`} value={answer}
            onChange={next=>onChange({...activity,blankSlots:activity.blankSlots!.map((old,at)=>at===i?{...old,acceptedAnswers:old.acceptedAnswers.map((text,j)=>j===k?next:text)}:old)})}/>
          <button type="button" onClick={()=>onChange({...activity,blankSlots:activity.blankSlots!.map((old,at)=>at===i?{...old,acceptedAnswers:old.acceptedAnswers.filter((_,j)=>j!==k)}:old)})}>Xóa đáp án ô {n}.{i+1}.{k+1}</button>
        </div>)}
        <button type="button" disabled={slot.acceptedAnswers.length>=4} onClick={()=>onChange({...activity,blankSlots:activity.blankSlots!.map((old,at)=>at===i?{...old,acceptedAnswers:[...old.acceptedAnswers,'']}:old)})}>Thêm đáp án ô {n}.{i+1}</button>
        <button type="button" disabled={i===0} aria-label={`Đưa ô ${n}.${i+1} lên`} onClick={()=>{
          const blankSlots=[...activity.blankSlots!];[blankSlots[i-1],blankSlots[i]]=[blankSlots[i],blankSlots[i-1]];onChange({...activity,blankSlots});
        }}>Lên</button>
        <button type="button" onClick={()=>{setWarning(true);onChange({...activity,blankSlots:activity.blankSlots!.filter(old=>old.id!==slot.id)});}}>Xóa ô {n}.{i+1}</button>
      </fieldset>)}
      <button type="button" disabled={(activity.blankSlots?.length??0)>=6} onClick={()=>onChange({...activity,blankSlots:[...(activity.blankSlots??[]),{id:crypto.randomUUID(),label:'',acceptedAnswers:[]}]})}>Thêm ô {n}</button>
    </fieldset>
  </>;
}
