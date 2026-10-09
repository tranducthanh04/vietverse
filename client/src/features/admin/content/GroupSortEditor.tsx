import React,{useState} from 'react';
import { OptionRows,answerMap,type NewEditorProps } from './NewActivityEditorFields.js';
import { TextField } from './FormFields.js';
import { FieldNotes } from './EditorialNotes.js';
import { useNoteDescription } from './editorialNotesContext.js';
export function GroupSortEditor({activity,onChange,index}:NewEditorProps){
  const [warning,setWarning]=useState(''); const n=index+1,path=`activities.${index}`,map=answerMap(activity);
  const note=useNoteDescription(`${path}.correctAnswer`);
  return <>
    <fieldset><legend>Nhóm {n}</legend><FieldNotes field={`${path}.groups`}/>
      {(activity.groups??[]).map((group,i)=><div key={group.id}>
        <TextField label={`Tên nhóm ${n}.${i+1}`} name={`${path}.groups.${i}.label`} value={group.label} onChange={label=>onChange({...activity,groups:activity.groups!.map((old,at)=>at===i?{...old,label}:old)})}/>
        <button type="button" disabled={i===0} aria-label={`Đưa nhóm ${n}.${i+1} lên`} onClick={()=>{
          const groups=[...activity.groups!];[groups[i-1],groups[i]]=[groups[i],groups[i-1]];onChange({...activity,groups});
        }}>Lên</button>
        <button type="button" onClick={()=>{
          setWarning('Cần phân nhóm lại các item có nhóm vừa xóa. Không tự gán sang nhóm khác.');
          onChange({...activity,groups:activity.groups!.filter(old=>old.id!==group.id),correctAnswer:Object.fromEntries(Object.entries(map).map(([id,value])=>[id,value===group.id?'':value]))});
        }}>Xóa nhóm {n}.{i+1}</button>
      </div>)}
      <button type="button" disabled={(activity.groups?.length??0)>=6} onClick={()=>onChange({...activity,groups:[...(activity.groups??[]),{id:crypto.randomUUID(),label:''}]})}>Thêm nhóm {n}</button>
    </fieldset>
    <OptionRows activity={activity} index={index} onChange={onChange} onRemove={id=>{
      const next={...map};delete next[id]; setWarning('Kiểm tra lại đáp án phân nhóm sau khi xóa item.');
      onChange({...activity,options:activity.options?.filter(o=>o.id!==id),correctAnswer:next});
    }}/>
    {warning&&<p role="status">{warning}</p>}
    <fieldset><legend>Đáp án phân nhóm {n}</legend><FieldNotes field={`${path}.correctAnswer`} id={note}/>
      {(activity.options??[]).map((option,i)=><label key={option.id} className="cms-field"><span>Nhóm đúng {n}.{i+1}: {option.text||option.id}</span>
        <select aria-describedby={note} name={`${path}.correctAnswer.${option.id}`} value={map[option.id]||''} onChange={event=>onChange({...activity,correctAnswer:{...map,[option.id]:event.target.value}})}>
          <option value="">Chưa phân nhóm</option>{activity.groups?.map(group=><option key={group.id} value={group.id}>{group.label||group.id}</option>)}
        </select>
      </label>)}
    </fieldset>
  </>;
}
