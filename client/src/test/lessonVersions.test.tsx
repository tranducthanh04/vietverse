import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';
import { useLessonSessionStore } from '../store/lessonSessionStore.js';
import { LessonPlayerPage } from '../features/lesson-player/LessonPlayerPage.js';
import { CultureDetailPage } from '../features/culture/CultureDetailPage.js';
import { PendingSubmissions } from '../features/lesson-player/PendingSubmissions.js';
import { set } from 'idb-keyval';

const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('canvas-confetti', () => ({ default: () => {} }));
vi.mock('idb-keyval', () => ({ get: async (key: string) => cache.get(key), set: vi.fn(async (key: string, value: unknown) => { cache.set(key, value); }), del: async (key: string) => { cache.delete(key); } }));
const original = api.defaults.adapter;
let client: QueryClient;
let calls: Array<{ url?: string; method?: string; body: any }>;
let respond: (url: string, method: string) => unknown;
const cached = { lessonId: 'lesson', childId: 'child', contentVersion: 0, currentStepIndex: 0, answers: [], hearts: 3, startTime: 1 };
beforeEach(() => {
  cache.clear(); localStorage.clear(); calls = [];
  useAuthStore.setState({ user: { id: 'parent', email: '', displayName: '', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: { _id: 'child', parentId: 'parent', name: 'Child', ageGroup: '5-6', companionLanguage: 'en', avatarId: '', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0 } });
  useLessonSessionStore.setState({ currentSession: null });
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  respond = url => ({ _id: 'lesson', contentVersion: url.includes('contentVersion=0') ? 0 : 2, activities: [{ id: 'card', type: 'word_card', prompt: url.includes('contentVersion=0') ? 'Old lesson' : 'New lesson', targetWord: 'A' }] });
  api.defaults.adapter = async config => {
    calls.push({ url: config.url, method: config.method, body: config.data ? JSON.parse(config.data) : undefined });
    return { data: { data: await respond(config.url!, config.method!) }, status: 200, statusText: 'OK', headers: {}, config };
  };
});
afterEach(() => { cleanup(); client.clear(); api.defaults.adapter = original; vi.restoreAllMocks(); });
function show(path = '/lesson/lesson') {
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path="/lesson/:lessonId" element={<LessonPlayerPage />} /><Route path="/culture/:id" element={<CultureDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('versioned learning client', () => {
  it('requests capability2 and persists unsent selection across remount without local grading', async () => {
    respond = () => ({ _id:'lesson',contentVersion:2,activities:[{id:'m',type:'multi_select',prompt:'Chọn M',
      options:[{id:'m1',text:'M'},{id:'m2',text:'M'}]}] });
    show(); await screen.findByText('Chọn M');
    expect(calls[0].url).toContain('activityContract=2');
    fireEvent.click(screen.getByRole('checkbox',{name:'Chữ M, vị trí 1'}));
    await waitFor(() => expect(cache.get('vietverse_session_child_lesson')).toMatchObject({partialInputs:{m:['m1']},answers:[]}));
    cleanup(); show(); await screen.findByText('Chọn M');
    expect(screen.getByRole('checkbox',{name:'Chữ M, vị trí 1'})).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox',{name:'Chữ M, vị trí 2'}));
    fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
    await screen.findByText('Đã ghi câu trả lời');
    expect(useLessonSessionStore.getState().currentSession?.hearts).toBe(3);
    expect(useLessonSessionStore.getState().currentSession?.answers).toEqual([{activityId:'m',userAnswer:['m1','m2']}]);
    respond = () => ({stars:0,pointsEarned:0,totalPoints:0,passed:false});
    fireEvent.click(screen.getByRole('button',{name:'Hoàn thành bài'}));
    await waitFor(() => expect(calls.find(call=>call.method==='post')?.body).toEqual({childId:'child',contentVersion:2,answers:[{activityId:'m',userAnswer:['m1','m2']}]}));
  });
  it('retains input and disables advance until failed storage is retried', async () => {
    respond = () => ({_id:'lesson',contentVersion:2,activities:[{id:'f',type:'fill_blanks',prompt:'Điền',template:'Bé {{v}} {{o}}.',blankSlots:[{id:'v',label:'Hành động'},{id:'o',label:'Đồ vật'}]}]});
    show(); await screen.findByText('Điền');
    vi.mocked(set).mockRejectedValueOnce(new Error('quota'));
    fireEvent.change(screen.getByRole('textbox',{name:'Hành động'}),{target:{value:'đọc'}});
    expect(await screen.findByRole('alert')).toHaveTextContent(/Chưa lưu được câu trả lời/);
    expect(screen.getByRole('textbox',{name:'Hành động'})).toHaveValue('đọc');
    expect(screen.getByRole('button',{name:'Hoàn thành bài'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Thử lưu lại'}));
    await waitFor(()=>expect(cache.get('vietverse_session_child_lesson')).toMatchObject({partialInputs:{f:{v:'đọc'}}}));
  });
  it('does not reset a pinned session when capability update is required', async () => {
    cache.set('vietverse_session_child_lesson',{...cached,partialInputs:{m:['m1']}});
    respond=()=>{throw {response:{status:409,data:{error:{code:'ACTIVITY_CLIENT_UPDATE_REQUIRED',message:'Cập nhật trang để học hoạt động mới'}}}};};
    show(); expect(await screen.findByRole('alert')).toHaveTextContent('Cập nhật trang');
    expect(screen.queryByRole('button',{name:/Bắt đầu lại/i})).not.toBeInTheDocument();
    expect(cache.get('vietverse_session_child_lesson')).toMatchObject({contentVersion:0,partialInputs:{m:['m1']}});
  });
  it('keeps legacy immediate wrong feedback and heart deduction', async () => {
    respond=()=>({_id:'lesson',contentVersion:0,activities:[{id:'q',type:'review',prompt:'Chọn',options:[{id:'a',text:'A'},{id:'b',text:'B'}],correctAnswer:'a'}]});
    show(); await screen.findByText('Chọn');
    fireEvent.click(screen.getByRole('button',{name:/B$/}));
    await waitFor(()=>expect(useLessonSessionStore.getState().currentSession?.hearts).toBe(2));
    expect(useLessonSessionStore.getState().currentSession?.answers[0]).toMatchObject({isCorrect:false,userAnswer:'b'});
  });
  it('restores self-reported answer acknowledgement without pretending it was verified',async()=>{
    cache.set('vietverse_session_child_lesson',{...cached,answers:[{activityId:'s',userAnswer:['stand']}]});
    respond=()=>({_id:'lesson',contentVersion:0,activities:[{id:'s',type:'follow_steps',prompt:'Thực hiện',steps:[{id:'stand',text:'Đứng lên'}]}]});
    show(); await screen.findByText('Đã ghi xác nhận của bé');
    expect(screen.getByRole('checkbox',{name:'Bước 1: Đứng lên'})).toBeChecked();
    expect(screen.getByRole('button',{name:'Hoàn thành bài'})).toBeEnabled();
    expect(useLessonSessionStore.getState().currentSession?.hearts).toBe(3);
  });
  it('does not start a fresh session from an old current-version query cache', async () => {
    client.setQueryData(['lesson', 'lesson', 'child', 'current'], { _id: 'lesson', contentVersion: 1, activities: [{ id: 'old', type: 'word_card', prompt: 'Stale cached content', targetWord: 'B' }] });
    show();
    await screen.findByText('New lesson');
    expect(cache.get('vietverse_session_child_lesson')).toMatchObject({ contentVersion: 2 });
  });
  it('creates a persistent pinned session when playing again after a confirmed completion', async () => {
    show(); await screen.findByText('New lesson');
    respond = () => ({ stars: 3, pointsEarned: 10, totalPoints: 10, passed: true });
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));
    const again = await screen.findByRole('button', { name: /học lại|chơi lại|làm lại/i });
    expect(cache.has('vietverse_session_child_lesson')).toBe(false);
    fireEvent.click(again);
    await waitFor(() => expect(cache.get('vietverse_session_child_lesson')).toMatchObject({ contentVersion: 2, answers: [] }));
  });
  it('shows pending state only for the current child/account and never exposes answers', () => {
    localStorage.setItem('vietverse_offline_completions', JSON.stringify([
      { id: 'one', userId: 'parent', childId: 'child', lessonId: 'lesson', savedAt: 1, status: 'needs_attention', errorCode: 'HTTP_403', answers: ['private answer'] },
      { id: 'two', userId: 'other', childId: 'child', lessonId: 'lesson', savedAt: 1, answers: ['other account'] },
      { id: 'three', userId: 'parent', childId: 'other-child', lessonId: 'lesson', savedAt: 1, answers: ['other child'] },
    ]));
    render(<PendingSubmissions childId="child" />);
    expect(screen.getByText('1 bài chưa xác nhận kết quả trên máy chủ')).toBeInTheDocument();
    expect(screen.getByText(/HTTP_403/)).toBeInTheDocument();
    expect(screen.queryByText('private answer')).not.toBeInTheDocument();
  });
  it('loads the cached version before rendering and submits that exact version', async () => {
    cache.set('vietverse_session_child_lesson', cached);
    show(); await screen.findByText('Old lesson');
    expect(calls[0].url).toContain('contentVersion=0');
    expect(client.getQueryCache().getAll().some(query => query.queryKey.includes(0))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));
    await waitFor(() => expect(calls.some(call => call.method === 'post' && call.body.contentVersion === 0)).toBe(true));
  });
  it('keeps legacy answers and blocks until the user explicitly restarts', async () => {
    cache.set('vietverse_session_child_lesson', { ...cached, contentVersion: undefined, answers: [{ activityId: 'old', isCorrect: true }] });
    show();
    expect(await screen.findByText(/không xác định được phiên bản/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    expect(cache.get('vietverse_session_child_lesson')).toMatchObject({ answers: [{ activityId: 'old' }] });
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu lại/i }));
    await screen.findByText('New lesson');
    expect(cache.get('vietverse_session_child_lesson')).toMatchObject({ contentVersion: 2, answers: [] });
  });
  it('retains the session and shows an error when both network and local outbox storage fail', async () => {
    show(); await screen.findByText('New lesson');
    respond = () => { throw { code: 'ERR_NETWORK' }; };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/chưa lưu/i);
    expect(cache.get('vietverse_session_child_lesson')).toBeDefined();
    expect(screen.queryByText(/đang chờ đồng bộ/i)).not.toBeInTheDocument();
  });
  it('submits culture with the version currently displayed', async () => {
    respond = () => ({ _id: 'article', title: 'Culture', intro: 'Intro', contentVersion: 3, funFacts: ['Fact'], quiz: [{ question: 'Question?', options: ['A', 'B'], correctAnswer: 0 }] });
    show('/culture/article'); await screen.findByText(/Question\?/);
    fireEvent.click(screen.getByText('A'));
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đáp án & Nhận điểm' }));
    await waitFor(() => expect(calls.some(call => call.method === 'post' && call.body.contentVersion === 3)).toBe(true));
  });
});
