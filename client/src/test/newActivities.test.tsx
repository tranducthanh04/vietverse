import React, { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MultiSelectActivity } from '../features/lesson-player/activities/MultiSelectActivity.js';
import { GroupSortActivity } from '../features/lesson-player/activities/GroupSortActivity.js';
import { FillBlanksActivity } from '../features/lesson-player/activities/FillBlanksActivity.js';
import { FollowStepsActivity } from '../features/lesson-player/activities/FollowStepsActivity.js';
import { getActivityComponent } from '../features/lesson-player/activityRegistry.js';
import type { NewActivityInput, NewActivityProps, NewLearnerActivity } from '../features/lesson-player/activities/newActivity.types.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function mount(Component: React.FC<NewActivityProps>, activity: NewLearnerActivity, initial: NewActivityInput = []) {
  const submit = vi.fn();
  function Harness() {
    const [value, onChange] = useState(initial);
    const [disabled, setDisabled] = useState(false);
    return <Component activity={activity} value={value} onChange={onChange} disabled={disabled}
      onSubmit={result => { submit(result); setDisabled(true); }} />;
  }
  return { ...render(<Harness />), submit };
}
it('submits repeated text by selected IDs only after explicit submit', () => {
  const { submit } = mount(MultiSelectActivity, { id: 'm', type: 'multi_select', prompt: 'Chọn M',
    options: ['A','M','B','M','C','M'].map((text,i) => ({ id: `letter-${i+1}`, text })) });
  for (const position of [2,4,6]) fireEvent.click(screen.getByRole('checkbox', { name: `Chữ M, vị trí ${position}` }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chữ M, vị trí 4' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chữ M, vị trí 4' }));
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi câu trả lời' }));
  expect(submit).toHaveBeenCalledWith({ status: 'submitted', userAnswer: ['letter-2','letter-6','letter-4'] });
  expect(screen.getByRole('button', { name: 'Gửi câu trả lời' })).toBeDisabled();
});
it('allows many-to-one grouping and reassignment without a drag gesture', () => {
  const { submit } = mount(GroupSortActivity, { id: 'g', type: 'group_sort', prompt: 'Phân nhóm',
    options: [{ id: 'me', text: 'mẹ' }, { id: 'meo', text: 'mèo' }], groups: [{ id: 'm', label: 'M' }, { id: 'b', label: 'B' }] }, {});
  expect(screen.getByRole('button', { name: 'Gửi câu trả lời' })).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Nhóm của mẹ, vị trí 1' }), { target: { value: 'b' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Nhóm của mèo, vị trí 2' }), { target: { value: 'm' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Nhóm của mẹ, vị trí 1' }), { target: { value: 'm' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi câu trả lời' }));
  expect(submit).toHaveBeenCalledWith({ status: 'submitted', userAnswer: { me: 'm', meo: 'm' } });
});
it('preserves every sentence segment while accepting independently labelled slot input', () => {
  const { submit, container } = mount(FillBlanksActivity, { id: 'f', type: 'fill_blanks', prompt: 'Điền',
    template: 'Bé {{verb}} {{object}}. Hết.', blankSlots: [{ id: 'verb', label: 'Hành động' }, { id: 'object', label: 'Đồ vật' }] }, {});
  expect(container.textContent).toContain('Bé');
  expect(container.textContent).toContain('. Hết.');
  fireEvent.change(screen.getByRole('textbox', { name: 'Hành động' }), { target: { value: 'ĐỌC' } });
  expect(screen.getByRole('button', { name: 'Gửi câu trả lời' })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Đồ vật' }), { target: { value: 'sách' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi câu trả lời' }));
  expect(submit).toHaveBeenCalledWith({ status: 'submitted', userAnswer: { verb: 'ĐỌC', object: 'sách' } });
  expect(container.querySelector('input[type=hidden]')).toBeNull();
});
it('records ordered self-report rather than completion boolean or click order', () => {
  const { submit } = mount(FollowStepsActivity, { id: 's', type: 'follow_steps', prompt: 'Thực hiện',
    steps: [{ id: 'stand', text: 'Đứng lên' }, { id: 'sit', text: 'Ngồi xuống' }] });
  expect(screen.getByText('Bé tự xác nhận đã thực hiện')).toBeInTheDocument();
  expect(screen.getByText(/Chưa có audio/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bước 2: Ngồi xuống' }));
  expect(screen.getByRole('button', { name: 'Gửi xác nhận' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bước 1: Đứng lên' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bước 2: Ngồi xuống' }));
  expect(screen.getByRole('button', { name: 'Gửi xác nhận' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bước 2: Ngồi xuống' }));
  fireEvent.click(screen.getByRole('button', { name: 'Gửi xác nhận' }));
  expect(submit).toHaveBeenCalledWith({ status: 'self_reported', userAnswer: ['stand','sit'] });
});
it('keeps instructions readable after media failure without autoplay', () => {
  const { container } = mount(FollowStepsActivity, { id: 's', type: 'follow_steps', prompt: 'Thực hiện',
    audioUrl: '/audio/source.mp3', steps: [{ id: 'stand', text: 'Đứng lên' }] });
  const audio = container.querySelector('audio')!;
  expect(audio.autoplay).toBe(false);
  expect(audio.controls).toBe(true);
  fireEvent.error(audio);
  expect(screen.getByRole('alert')).toHaveTextContent('Chưa phát được audio');
  expect(screen.getByRole('checkbox', { name: 'Bước 1: Đứng lên' })).toBeInTheDocument();
});
it('fails closed when renderer input is incomplete', () => {
  mount(FillBlanksActivity, { id:'f',type:'fill_blanks',prompt:'Điền',template:'{{missing}}',blankSlots:[] }, {});
  expect(screen.getByRole('alert')).toHaveTextContent('chưa đủ dữ liệu');
  expect(screen.queryByRole('button', { name: 'Gửi câu trả lời' })).not.toBeInTheDocument();
});
it('unknown registry type cannot grant completion', () => {
  const Unknown = getActivityComponent('unknown');
  const onComplete = vi.fn();
  render(<Unknown activity={{id:'x',prompt:'Unknown'}} onComplete={onComplete}/>);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
