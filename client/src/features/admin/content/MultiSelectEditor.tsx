import React,{useState} from 'react';
import { OptionRows,type NewEditorProps } from './NewActivityEditorFields.js';
import { FieldNotes } from './EditorialNotes.js';
import { useNoteDescription } from './editorialNotesContext.js';
export function MultiSelectEditor({activity,onChange,index}:NewEditorProps){
  const [warning,setWarning]=useState(false);
  const selected=Array.isArray(activity.correctAnswer)?activity.correctAnswer:[];
  const path=`activities.${index}.correctAnswer`,note=useNoteDescription(path);
  return <>
    <OptionRows activity={activity} onChange={onChange} index={index} onRemove={id=>{
      setWarning(true); onChange({...activity,options:activity.options?.filter(o=>o.id!==id),correctAnswer:selected.filter(answer=>answer!==id)});
    }}/>
    {warning&&<p role="status">Kiểm tra lại đáp án sau khi xóa lựa chọn. Không tự chọn đáp án thay thế.</p>}
    <fieldset><legend>Đáp án chọn nhiều {index+1}</legend><FieldNotes field={path} id={note}/>
      <p>Chọn theo vị trí/ID; các chữ giống nhau là lựa chọn riêng.</p>
      {(activity.options??[]).map((option,i)=><label className="cms-row" key={option.id}>
        <input type="checkbox" aria-label={`Đáp án ${index+1}.${i+1}`} name={path} aria-describedby={note} checked={selected.includes(option.id)} onChange={()=>onChange({...activity,correctAnswer:selected.includes(option.id)?selected.filter(id=>id!==option.id):[...selected,option.id]})}/>
        {i+1}. {option.text||option.id}
      </label>)}
    </fieldset>
  </>;
}
