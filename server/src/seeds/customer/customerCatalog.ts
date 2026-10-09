import { parseDraft } from '../../modules/content/content.validation.js';
import type { ContentKind, ContentPayloadMap, EditorialNote, SourceRef, LessonContent } from '../../modules/content/content.types.js';
import { stories as seedStories, culture as seedCulture } from '../catalog.js';
import { plainLine, sourceRef, sourceSections, verifyCustomerSources } from './customerSource.js';

export type CustomerEntry = { [K in ContentKind]: {
  kind: K; key: string; payload: ContentPayloadMap[K]; source: SourceRef; editorialNotes: EditorialNote[];
  stageOrder?: number; order?: number;
} }[ContentKind];
const note = (field: string, reason: EditorialNote['reason'], message: string): EditorialNote => ({ field, reason, message });
type Activity = LessonContent['activities'][number];
const card = (word: string): Partial<Activity> => ({ type: 'word_card', prompt: word, targetWord: word });
const choose = (prompt: string, options: string[]): Partial<Activity> => ({ type: 'listen_choose', prompt, options: options.map((text, index) => ({ id: `option-${index}`, text, imageUrl: '', audioUrl: '' })), correctAnswer: 'option-0' });
const match = (pairs: [string, string][]): Partial<Activity> => ({ type: 'drag_match', prompt: 'Ghép từ', pairs: pairs.map(([left, right]) => ({ left, right })) });
const fill = (sentence: string, options: string[]): Partial<Activity> => ({ ...choose(sentence, options), type: 'fill_blank', blanks: [{ sentence, missing: options[0] }] });
const sort = (orderedItems: string[]): Partial<Activity> => ({ type: 'sort_order', prompt: 'Sắp xếp câu', orderedItems, correctAnswer: orderedItems });
const speak = (word: string): Partial<Activity> => ({ type: 'record_voice', prompt: 'Đọc cùng Lí Lắc', targetWord: word });
const sourceSteps: Partial<Activity> = { type: 'follow_steps', prompt: 'Bé tự xác nhận đã thực hiện', steps: [
  { id: 'step-stand', text: 'Bé đứng lên.' }, { id: 'step-walk', text: 'Bé đi đến bàn.' }, { id: 'step-sit', text: 'Bé ngồi xuống.' },
] };
const sourceMulti: Partial<Activity> = { type: 'multi_select', prompt: 'Tìm chữ M.',
  options: ['A', 'M', 'B', 'M', 'C', 'M'].map((text, index) => ({ id: `letter-${index + 1}`, text, audioUrl: '', imageUrl: '' })),
  correctAnswer: ['letter-2', 'letter-4', 'letter-6'],
};
const sourceGroups: Partial<Activity> = { type: 'group_sort', prompt: 'Ghép nhóm M và nhóm B',
  groups: [{ id: 'group-m', label: 'M' }, { id: 'group-b', label: 'B' }],
  options: [['item-me', 'mẹ'], ['item-meo', 'mèo'], ['item-mu', 'mũ'], ['item-ba', 'bà'], ['item-be', 'bé'], ['item-bong', 'bóng']]
    .map(([id, text]) => ({ id, text, audioUrl: '', imageUrl: '' })),
  correctAnswer: { 'item-me': 'group-m', 'item-meo': 'group-m', 'item-mu': 'group-m', 'item-ba': 'group-b', 'item-be': 'group-b', 'item-bong': 'group-b' },
};
const lessonWords: string[][] = [
  ['mẹ', 'bố', 'ông', 'bà', 'anh', 'chị', 'em', 'bạn'], ['sách', 'vở', 'bút', 'cặp', 'bàn', 'ghế'], ['chó', 'mèo', 'gà', 'cá', 'trâu', 'chim'], ['ăn', 'uống', 'ngủ', 'chơi', 'đọc', 'chạy', 'đi', 'ngồi'],
  ['A', 'B', 'M'], ['mẹ', 'mèo', 'mũ', 'bà', 'bé', 'bóng'], ['ba', 'bà', 'bá', 'bả', 'bã', 'bạ'], ['bàn', 'lan', 'cá', 'mẹ'], ['b', 'a', 'm', 'e', 'c', 'ch', 'tr', 'nh', 'ph'], ['con cá', 'cái bàn', 'mẹ bé'], ['cá', 'mẹ'], ['mẹ', 'cá', 'bà', 'bé'], [], [], [], [], [], [], [], [],
];
const events = ['Bé thức dậy.', 'Bé đánh răng.', 'Bé ăn sáng.', 'Bé đi học.'];
const lessonActivities: Partial<Activity>[][] = [
  [choose('Đây là mẹ.', ['mẹ', 'bố', 'bà']), card('MẸ'), match([['MẸ', 'người chăm sóc bé'], ['BỐ', 'bố của bé'], ['BÀ', 'bà của bé']]), choose('Mẹ đang nấu cơm.', ['Mẹ đang nấu cơm.', 'Bố đang ngủ.', 'Bé đang chơi.'])],
  [...['sách', 'bút', 'cặp'].map(card), choose('Bé lấy quyển sách.', ['sách', 'bút', 'cặp']), match([['sách', 'đồ dùng để đọc'], ['bút', 'đồ dùng để viết'], ['cặp', 'đồ dùng để đựng sách vở']]), fill('Bé viết bằng __.', ['bút'])],
  [card('CON MÈO'), match([['con mèo', 'mèo'], ['con cá', 'cá'], ['con chim', 'chim']]), fill('Con __ đang bơi.', ['cá']), choose('Con nào sống dưới nước?', ['cá']), choose('Con nào có thể bay?', ['chim'])],
  [...lessonWords[3].map(card), choose('Bé đang đọc sách.', ['đọc', 'ngủ', 'chạy']), sort(['Bé', 'đang', 'chơi.']), sourceSteps],
  [...['A', 'B', 'M'].map(card), choose('/m/', ['M', 'B', 'A']), match([['M', 'mẹ'], ['B', 'bà'], ['C', 'cá']]), sourceMulti],
  [...['mẹ', 'mèo', 'mũ'].map(card), choose('mẹ', ['mèo', 'cá', 'bà']), sourceGroups],
  [choose('bà', ['huyền', 'ngang', 'sắc']), match([['ba', 'ngang'], ['bà', 'huyền'], ['bá', 'sắc']]), speak('bà')],
  [choose('bàn', ['lan', 'cá', 'mẹ'])],
  [sort(['b', 'a']), sort(['m', 'e']), sort(['c', 'a'])],
  [sort(['con', 'cá']), sort(['cái', 'bàn']), sort(['mẹ', 'bé']), choose('con cá', ['con cá']), fill('Con __ đang bơi.', ['cá'])],
  [fill('__á', ['c', 'b', 'm']), fill('__ẹ', ['m'])],
  [...['mẹ', 'cá', 'bà', 'bé', 'mẹ của bé', 'con cá', 'cái bàn', 'Bé đang đọc sách.', 'Mẹ đang nấu cơm.'].map(card), speak('Bé đang đọc sách.'), speak('Mẹ đang nấu cơm.')],
  [sort(['Bé', 'đọc sách.']), sort(['Mẹ', 'nấu cơm.']), sort(['Bố', 'uống nước.']), speak('Bé đang đọc sách.')],
  [sort(events), speak(events.join(' '))],
  [],
  [speak('Con tên là Khánh.'), speak('Con thích đọc truyện.'), speak('Đây là cái bàn.')],
  [card('Sáng nay, bé Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo nhỏ bên cửa hàng.'), choose('Lan đi đâu?', ['đi chợ']), choose('Lan đi cùng ai?', ['mẹ']), choose('Lan nhìn thấy con gì?', ['mèo'])],
  [fill('Bé uống __.', ['nước', 'sách', 'chạy']), fill('Mẹ đang __ cơm.', ['nấu']), sort(['Bé', 'đang', 'đọc', 'sách.'])],
  [choose('Con gì kêu meo meo?', ['mèo', 'chó', 'gà'])],
  [],
];

function buildLessons(): CustomerEntry[] {
  return sourceSections('explore').map(section => {
    const index = section.number - 1;
    const notes = [
      note('audioUrl', 'missing_source', 'Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.'),
      note('description', 'normalization', 'Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.'),
      note('vocabulary', 'missing_source', 'Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.'),
      note('activities', 'normalization', 'Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.'),
    ];
    if ([1, 5, 6, 7, 8, 12, 13, 14, 15, 16, 19, 20].includes(section.number)) notes.push(note('activities', 'missing_source', 'Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.'));
    if ([2, 4].includes(section.number)) notes.push(note('activities', 'unsupported_activity', 'Kéo từ vào câu chưa có renderer riêng; không tự thay bằng thao tác khác. Cần quyết định biên tập trước xuất bản.'));
    if (section.number === 4) notes.push(note('activities', 'normalization', 'Ba bước nguyên văn dùng follow_steps, chỉ là bé tự xác nhận; chưa có audio nguồn, không xác minh động tác.'));
    if (section.number === 5) notes.push(note('activities', 'normalization', 'A–M–B–M–C–M dùng multi_select; ba chữ M có ID riêng, chọn đủ cả ba. Các yêu cầu thiếu ngữ liệu khác vẫn cần biên tập.'));
    if (section.number === 6) notes.push(note('activities', 'normalization', 'group_sort giữ nhóm M: mẹ/mèo/mũ và nhóm B: bà/bé/bóng. Yêu cầu chọn âm đầu từ audio vẫn chưa có ngữ liệu hoàn chỉnh.'));
    if (section.number === 11) notes.push(note('activities', 'unsupported_activity', 'Nguồn c_ _ → cá chưa xác định rõ từng slot. Chưa ánh xạ fill_blanks hoặc tự bịa acceptedAnswers; content owner cần duyệt cấu trúc.'));
    if ([5, 14, 15, 16].includes(section.number)) notes.push(note('title', 'variant', 'Tên ở sơ đồ tổng quan khác heading giáo án chi tiết; nháp chọn heading chi tiết, không tự đổi live.'));
    if ([9, 10, 13, 16].includes(section.number)) notes.push(note('activities', 'normalization', 'Giả định ánh xạ: thẻ ghép có thứ tự dùng sort_order; câu nói mẫu dùng record_voice, không chấm phát âm bằng AI. Cần admin duyệt sự tương đương thao tác.'));
    return { kind: 'lesson', key: `lesson-${String(section.number).padStart(2, '0')}`, order: section.number, stageOrder: Math.ceil(section.number / 4), source: sourceRef('explore', section.heading), editorialNotes: notes,
      payload: parseDraft('lesson', { title: section.heading, order: section.number, description: section.lines.map(plainLine).join('\n').trim(), vocabulary: lessonWords[index].map(word => ({ word, meaning: '' })), activities: lessonActivities[index].map((activity, at) => ({ ...activity, id: `source-${section.number}-${at + 1}` })) }) };
  });
}
function buildStories(): CustomerEntry[] {
  return sourceSections('stories').map(section => {
    let lines = section.lines;
    if (section.number === 6) lines = lines.slice(0, lines.findIndex(line => line.includes('Bản 2:')));
    if (section.number === 13) {
      const second = lines.findIndex((line, index) => index > 1 && plainLine(line) === 'Kéo cưa lừa xẻ');
      if (second > 0) lines = lines.slice(0, second);
    }
    const lyrics = lines.map(plainLine).filter(line => line && !/^Bản (1|phổ biến):/.test(line)).map(text => ({ text, timeSec: 0 }));
    const notes = [note('audioUrl', 'missing_source', 'Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.'), note('author', 'attribution', 'Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.')];
    if ([6, 13].includes(section.number)) notes.push(note('lyrics', 'variant', 'Giả định chọn dị bản đầu tiên hiển thị; dị bản còn lại giữ nguyên trong snapshot nguồn, không ghép hai bản.'));
    if (section.number === 21) notes.push(note('author', 'attribution', 'Giữ nhãn Nhạc rừng / Thanh Lan / Thơ đúng nguồn; tác giả và thể loại chưa được xác minh độc lập.'));
    return { kind: 'story', key: seedStories[section.number - 1].seedKey, source: sourceRef('stories', section.heading), editorialNotes: notes,
      payload: parseDraft('story', { title: seedStories[section.number - 1].title, type: section.number === 21 ? 'tho' : 'dong_dao', author: section.number === 21 ? 'Thanh Lan' : '', lyrics, ageGroups: ['5-6'] }) };
  });
}
function buildCulture(): CustomerEntry[] {
  const titles = ['TẾT NGUYÊN ĐÁN', 'BÁNH CHƯNG', 'ÁO DÀI', 'Phong tục', 'Lễ hội', 'NÓN LÁ', 'Thiên nhiên Việt Nam', 'Trò chơi dân gian'];
  const intros = ['Vì sao người Việt lại đón Tết?', 'Vì sao bánh chưng thường xuất hiện vào ngày Tết?', 'Áo dài là trang phục như thế nào?', '', '', 'Vì sao chiếc nón lại có hình chóp?', '', ''];
  return seedCulture.map((item, index) => ({ kind: 'culture', key: item.seedKey, source: sourceRef('culture', titles[index]),
    payload: parseDraft('culture', { category: item.category, title: titles[index], intro: intros[index], funFacts: [], quiz: index === 1 ? [{ question: 'Bánh chưng thường xuất hiện vào dịp nào?', options: ['Tết', 'Trung thu', 'Sinh nhật'], correctAnswer: 0 }] : [] }),
    editorialNotes: [note('intro', 'missing_source', 'Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.'), note('funFacts', 'missing_source', 'Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.'), note('quiz', 'missing_source', index === 1 ? 'Đã nhập câu có đủ lựa chọn/đáp án; câu thứ hai chỉ có đáp án Bánh chưng, chưa có lựa chọn.' : 'Chưa có bộ câu hỏi và đáp án cho nhóm này.'), note('audioUrl', 'missing_source', 'Chưa có file audio.')],
  }));
}
verifyCustomerSources();
export const customerCatalog: CustomerEntry[] = [...buildLessons(), ...buildStories(), ...buildCulture()];
export const customerCoverage = customerCatalog.map(entry => ({ key: entry.key, heading: entry.source.heading, mappedFields: Object.keys(entry.payload), notes: entry.editorialNotes }));
