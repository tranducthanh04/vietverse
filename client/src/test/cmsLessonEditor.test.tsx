import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LessonEditor } from "../features/admin/content/LessonEditor.js";
import { MediaFields } from "../features/admin/content/MediaFields.js";
import type { LessonContent } from "../features/admin/content/content.types.js";
import { EditorialNotesContext } from "../features/admin/content/editorialNotesContext.js";
afterEach(cleanup);
const initial: LessonContent = {
  title: "Bài một",
  description: "",
  stageId: "stage1",
  order: 1,
  freeInStarterPlan: true,
  totalActivities: 2,
  vocabulary: [],
  activities: [
    {
      id: "a",
      type: "word_card",
      prompt: "Đọc",
      targetWord: "mẹ",
      audioUrl: "",
      imageUrl: "",
      pointsWeight: 3,
    },
    {
      id: "b",
      type: "sort_order",
      prompt: "Xếp",
      orderedItems: ["bé", "đọc"],
      correctAnswer: ["bé", "đọc"],
      audioUrl: "",
      imageUrl: "",
    },
  ],
};
function Form() {
  const [value, setValue] = useState(initial);
  return (
    <>
      <LessonEditor value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </>
  );
}
it("keeps catalog and activity identity while moving/removing rows, preserving unedited metadata", () => {
  render(<Form />);
  expect(screen.getByLabelText("Thứ tự bài")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("button", { name: "Đưa hoạt động 2 lên" }));
  let value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.activities.map((a: { id: string }) => a.id)).toEqual(["b", "a"]);
  expect(value.activities[1].pointsWeight).toBe(3);
  fireEvent.click(screen.getByRole("button", { name: "Xóa hoạt động 1" }));
  value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.activities.map((a: { id: string }) => a.id)).toEqual(["a"]);
});
it("adds vocabulary and all seven activity form types without fabricating server IDs", () => {
  render(<Form />);
  fireEvent.click(screen.getByRole("button", { name: "Thêm từ vựng" }));
  fireEvent.change(screen.getByLabelText("Từ 1"), { target: { value: "bà" } });
  for (const type of [
    "listen_choose",
    "word_card",
    "drag_match",
    "fill_blank",
    "sort_order",
    "record_voice",
    "review",
  ]) {
    fireEvent.change(screen.getByLabelText("Loại hoạt động mới"), {
      target: { value: type },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm hoạt động" }));
  }
  const value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.vocabulary[0].word).toBe("bà");
  expect(value.activities.slice(2).map((a: { id: string }) => a.id)).toEqual([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  expect(screen.getByLabelText("Câu có ô trống 6")).toBeInTheDocument();
  expect(screen.getByLabelText("Từ cần đọc 8")).toBeInTheDocument();
});
it("distinguishes unsafe media syntax from an asset load failure", () => {
  const { rerender } = render(
    <MediaFields
      value={{ audioUrl: "javascript:alert(1)" }}
      onChange={() => {}}
    />,
  );
  expect(screen.getByText(/URL không hợp lệ/)).toBeInTheDocument();
  expect(screen.queryByLabelText("Nghe thử audio")).not.toBeInTheDocument();
  rerender(
    <MediaFields
      value={{ audioUrl: "https://example.test/a.mp3" }}
      onChange={() => {}}
    />,
  );
  fireEvent.error(screen.getByLabelText("Nghe thử audio"));
  expect(screen.getByText(/Không tải được audio/)).toBeInTheDocument();
});
it("describes legacy answer conversion beside its existing activity select", () => {
  const value: LessonContent = {
    ...initial,
    activities: [
      {
        id: "quiz",
        type: "review",
        prompt: "Chọn từ",
        audioUrl: "",
        imageUrl: "",
        correctAnswer: "",
        options: [
          { id: "a", text: "Mẹ", audioUrl: "", imageUrl: "" },
          { id: "b", text: "Bà", audioUrl: "", imageUrl: "" },
        ],
      },
    ],
  };
  render(
    <EditorialNotesContext.Provider
      value={[
        {
          field: "activities.0.correctAnswer",
          reason: "normalization",
          message: "Đáp án legacy chưa rõ, cần chọn lại",
        },
      ]}
    >
      <LessonEditor value={value} onChange={() => {}} />
    </EditorialNotesContext.Provider>,
  );
  expect(
    screen.getByRole("combobox", { name: "Đáp án 1" }),
  ).toHaveAccessibleDescription(/Đáp án legacy chưa rõ/);
});
it('adds the four new authoring types with Vietnamese labels and empty server activity IDs',()=>{
  render(<Form/>);
  for(const [type,label] of [['multi_select','Chọn nhiều đáp án'],['group_sort','Phân nhóm'],['fill_blanks','Điền nhiều ô trống'],['follow_steps','Nghe và thực hiện']]){
    expect(screen.getAllByRole('option',{name:label}).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Loại hoạt động mới'),{target:{value:type}});
    fireEvent.click(screen.getByRole('button',{name:'Thêm hoạt động'}));
  }
  const value=JSON.parse(screen.getByTestId('value').textContent!);
  expect(value.activities.slice(2).map((a:{id:string;type:string})=>[a.id,a.type])).toEqual([
    ['', 'multi_select'],['','group_sort'],['','fill_blanks'],['','follow_steps']]);
  expect(screen.getByLabelText('Mẫu câu 5')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Thêm bước 6'})).toBeInTheDocument();
});
function NewForm({activity}:{activity:LessonContent['activities'][number]}){
  const [value,onChange]=useState({...initial,activities:[activity]});
  return <><LessonEditor value={value} onChange={onChange}/><output data-testid="value">{JSON.stringify(value)}</output></>;
}
it('keeps repeated option IDs stable on reorder and warns when selected answers are removed',()=>{
  render(<NewForm activity={{id:'m',type:'multi_select',prompt:'Chọn M',audioUrl:'',imageUrl:'',
    options:[{id:'m1',text:'M',audioUrl:'',imageUrl:''},{id:'m2',text:'M',audioUrl:'',imageUrl:''}],correctAnswer:['m1','m2']}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Đưa lựa chọn 1.2 lên'}));
  let value=JSON.parse(screen.getByTestId('value').textContent!);
  expect(value.activities[0].options.map((o:{id:string})=>o.id)).toEqual(['m2','m1']);
  expect(value.activities[0].correctAnswer).toEqual(['m1','m2']);
  fireEvent.click(screen.getByRole('button',{name:'Xóa lựa chọn 1.1'}));
  value=JSON.parse(screen.getByTestId('value').textContent!);
  expect(value.activities[0].correctAnswer).toEqual(['m1']);
  expect(screen.getByText(/Kiểm tra lại đáp án sau/)).toBeInTheDocument();
});
it('leaves all mappings unassigned when their group is deleted',()=>{
  render(<NewForm activity={{id:'g',type:'group_sort',prompt:'Nhóm',audioUrl:'',imageUrl:'',
    options:[{id:'me',text:'mẹ',audioUrl:'',imageUrl:''},{id:'meo',text:'mèo',audioUrl:'',imageUrl:''}],
    groups:[{id:'m',label:'M'},{id:'b',label:'B'}],correctAnswer:{me:'m',meo:'m'}}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Xóa nhóm 1.1'}));
  const value=JSON.parse(screen.getByTestId('value').textContent!);
  expect(value.activities[0].correctAnswer).toEqual({me:'',meo:''});
  expect(screen.getByText(/Cần phân nhóm lại/)).toBeInTheDocument();
});
it('does not reinterpret a removed slot marker or invent accepted variants',()=>{
  render(<NewForm activity={{id:'f',type:'fill_blanks',prompt:'Điền',audioUrl:'',imageUrl:'',template:'Bé {{v}} {{o}}.',
    blankSlots:[{id:'v',label:'Hành động',acceptedAnswers:['đọc']},{id:'o',label:'Đồ vật',acceptedAnswers:['sách']}]}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Xóa ô 1.1'}));
  const value=JSON.parse(screen.getByTestId('value').textContent!);
  expect(value.activities[0].template).toBe('Bé {{v}} {{o}}.');
  expect(value.activities[0].blankSlots).toEqual([{id:'o',label:'Đồ vật',acceptedAnswers:['sách']}]);
  expect(screen.getByText(/Sửa marker/)).toBeInTheDocument();
});
it('requires explicit type-change confirmation and preserves common fields only',()=>{
  render(<NewForm activity={{id:'m',type:'multi_select',prompt:'Giữ hướng dẫn',audioUrl:'/a.mp3',imageUrl:'/a.png',hints:['Gợi ý'],
    options:[{id:'a',text:'A',audioUrl:'',imageUrl:''}],correctAnswer:['a']}}/>);
  fireEvent.change(screen.getByLabelText('Loại hoạt động 1'),{target:{value:'follow_steps'}});
  expect(screen.getByRole('dialog')).toHaveTextContent(/dữ liệu riêng/);
  fireEvent.click(screen.getByRole('button',{name:'Hủy'}));
  expect(JSON.parse(screen.getByTestId('value').textContent!).activities[0].type).toBe('multi_select');
  fireEvent.change(screen.getByLabelText('Loại hoạt động 1'),{target:{value:'follow_steps'}});
  fireEvent.click(screen.getByRole('button',{name:'Đổi loại'}));
  const next=JSON.parse(screen.getByTestId('value').textContent!).activities[0];
  expect(next).toMatchObject({id:'m',type:'follow_steps',prompt:'Giữ hướng dẫn',audioUrl:'/a.mp3',imageUrl:'/a.png',hints:['Gợi ý']});
  expect(next.options).toBeUndefined(); expect(next.correctAnswer).toBeUndefined();
});
