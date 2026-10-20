/**
 * Explore curriculum — the 20 lessons of the customer's "Khám phá" tab, ready to publish.
 *
 * This module is DATA. It carries no DB, publish or CLI logic (that lives in
 * `publishExploreCurriculum.ts`). It reads the Vietnamese questions and their reviewed
 * five-language translations straight from the customer source via the existing parser
 * `loadCustomerTranslationsSource()` (docs/customer-source/2026-10-18/explore.md), so no
 * translation is transcribed by hand and nothing drifts from the document. Content the
 * document only describes in general terms (missing questions, choices, answers, the B11
 * slots, the B15 story questions and the B20 challenges) is composed here, close to the
 * lesson's description, vocabulary and story; the worker report lists every composed piece.
 *
 * Rules honoured:
 * - Production content: no "mẫu/demo/nháp/tự soạn/biên soạn/giả định" anywhere, no editorialNotes.
 * - Every activity has a Vietnamese `prompt` plus `promptTranslations` in all five support languages.
 * - Every activity has a Vietnamese `wrongHint` plus `wrongHintTranslations` in all five languages.
 * - Every option has `text`; every vocabulary word has `meaning`.
 * - No `audioUrl` (left empty for the later TTS pass); option/vocabulary images come from the Phase 04 map.
 * - "Nghe và thực hiện" → follow_steps; "Kể lại / Thực hành nói / Nói chuyện" → record_voice.
 */
import { parseDraft } from '../../modules/content/content.validation.js';
import type { LessonContent } from '../../modules/content/content.types.js';
import type { ActivityType } from '../../models/Lesson.js';
import { SUPPORT_LANGUAGES, type SupportLanguage } from '../../models/contentTranslations.js';
import { loadCustomerTranslationsSource } from './customerTranslationsSource.js';
import { imageUrlFor } from './exploreCurriculumImages.js';

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------
type Tr = Record<SupportLanguage, string>;
/** Build a translation map in the canonical support-language order (en, ja, ko, zh, fr). */
const tr = (en: string, ja: string, ko: string, zh: string, fr: string): Tr => ({ en, ja, ko, zh, fr });

const catalog = loadCustomerTranslationsSource();
const blocks = new Map(catalog.blocks.map((block) => [block.key, block]));

/** The reviewed five-language translations of a source block (throws if incomplete). */
function blockTr(key: string): Tr {
  const block = blocks.get(key);
  if (!block) throw new Error(`Explore source block not found: ${key}`);
  const out = {} as Tr;
  for (const lang of SUPPORT_LANGUAGES) {
    const value = block.translations[lang];
    if (!value) throw new Error(`Explore source block ${key} missing ${lang}`);
    out[lang] = value.text;
  }
  return out;
}
/** The verbatim Vietnamese text of a source block (throws if the document has none). */
function blockVi(key: string): string {
  const block = blocks.get(key);
  if (!block?.vi) throw new Error(`Explore source block ${key} has no Vietnamese text`);
  return block.vi.text;
}

interface Prompt { prompt: string; promptTranslations: Tr }
/** Prompt whose Vietnamese text and translations both come verbatim from the source block. */
const P = (key: string): Prompt => ({ prompt: blockVi(key), promptTranslations: blockTr(key) });
/** Prompt with a composed Vietnamese question but the source block's reviewed translations. */
const Pt = (vi: string, key: string): Prompt => ({ prompt: vi, promptTranslations: blockTr(key) });
/** Fully composed prompt (Vietnamese question + five translations authored here). */
const Pa = (vi: string, translations: Tr): Prompt => ({ prompt: vi, promptTranslations: translations });

interface Hint { wrongHint: string; wrongHintTranslations: Record<SupportLanguage, { wrongHint: string }> }
const asHint = (vi: string, translations: Tr): Hint => ({
  wrongHint: vi,
  wrongHintTranslations: Object.fromEntries(
    SUPPORT_LANGUAGES.map((lang) => [lang, { wrongHint: translations[lang] }]),
  ) as Record<SupportLanguage, { wrongHint: string }>,
});
/** When-wrong hint taken verbatim from a source hint block. */
const H = (key: string): Hint => asHint(blockVi(key), blockTr(key));
/** When-wrong hint joined from several source hint rows (keeps each row's exact text). */
const Hj = (keys: string[]): Hint => {
  const vi = keys.map(blockVi).join(' · ');
  const joined = {} as Tr;
  for (const lang of SUPPORT_LANGUAGES) joined[lang] = keys.map((key) => blockTr(key)[lang]).join(' · ');
  return asHint(vi, joined);
};
/** Composed when-wrong hint (used where the document gives only a gloss or nothing). */
const Ha = (vi: string, translations: Tr): Hint => asHint(vi, translations);

// ---------------------------------------------------------------------------
// Reusable key-word glosses and supportive hints
// ---------------------------------------------------------------------------
const G_me = tr('mom', 'お母さん', '엄마', '妈妈', 'maman');
const G_ca = tr('fish', '魚', '물고기', '鱼', 'poisson');
const G_meo = tr('cat', '猫', '고양이', '猫', 'chat');
const G_chim = tr('bird', '鳥', '새', '鸟', 'oiseau');
const G_sach = tr('book', '本', '책', '书', 'livre');
const G_cap = tr('schoolbag', '通学かばん', '책가방', '书包', 'cartable');
const G_doc = tr('read', '読む', '읽다', '阅读', 'lire');
const G_docSach = tr('read a book', '本を読む', '책을 읽다', '看书', 'lire un livre');
const G_viet = tr('write', '書く', '쓰다', '写字', 'écrire');
const G_nuoc = tr('water', '水', '물', '水', 'eau');
const G_nau = tr('cook', '料理する', '요리하다', '做饭', 'cuisiner');
const G_nauCom = tr('cook rice', 'ご飯を作る', '밥을 하다', '做饭', 'préparer le repas');
const G_boi = tr('swim', '泳ぐ', '헤엄치다', '游泳', 'nager');
const G_thich = tr('like', '好き', '좋아하다', '喜欢', 'aimer');
const G_caiBan = tr('table', 'テーブル', '책상', '桌子', 'table');
const G_uong = tr('drink', '飲む', '마시다', '喝', 'boire');
const G_dauTien = tr('first', '最初', '처음', '首先', 'en premier');
const G_diCho = tr('go to the market', '市場に行く', '시장에 가다', '去市场', 'aller au marché');
const G_tenLa = tr('My name is…', '私の名前は…です', '제 이름은 …이에요', '我的名字是……', 'Je m’appelle…');
const G_taiSao = tr('why', 'なぜ', '왜', '为什么', 'pourquoi');
const G_mua = tr('rain', '雨', '비', '雨', 'pluie');

const HINT_ORDER = tr(
  'Read again and put the words in the correct order.',
  'もう一度読んで、言葉を正しい順番に並べてね。',
  '다시 읽고 낱말을 올바른 순서로 배열해 보세요.',
  '再读一遍，把词语按正确的顺序排好。',
  'Relis et remets les mots dans le bon ordre.',
);
const HINT_SYLLABLE = tr(
  'Join the first letter with the next to make the syllable.',
  '前の文字と後の文字を組み合わせて音節を作ってね。',
  '앞 글자와 뒤 글자를 합쳐 음절을 만들어 보세요.',
  '把前面的字母和后面的字母组合成音节。',
  'Assemble la première lettre avec la suivante pour former la syllabe.',
);
const HINT_TONE = tr(
  'Listen carefully to the tone of the syllable.',
  '音節の声調をよく聞いてね。',
  '음절의 성조를 잘 들어 보세요.',
  '请仔细听音节的声调。',
  'Écoute bien le ton de la syllabe.',
);
const HINT_LISTEN = tr(
  'Listen again and notice the key word.',
  'もう一度聞いて、大切な言葉に注目してね。',
  '다시 듣고 중요한 낱말에 집중해 보세요.',
  '再听一遍，注意关键词。',
  'Écoute à nouveau et repère le mot clé.',
);
const HINT_SPEAK = tr(
  'Speak freely — it is okay to make mistakes!',
  '気楽に話してね。間違えても大丈夫だよ！',
  '편하게 말해 보세요. 틀려도 괜찮아요!',
  '放心大胆地说，说错也没关系！',
  'Parle librement — ce n’est pas grave de se tromper !',
);
const HINT_READ = tr(
  'Read each word slowly.',
  '一文字ずつゆっくり読んでね。',
  '한 글자씩 천천히 읽어 보세요.',
  '一个字一个字慢慢读。',
  'Lis chaque mot lentement.',
);
const HINT_GROUP = tr(
  'Group the words that begin with the same sound.',
  '同じ音で始まる言葉を同じグループに入れてね。',
  '같은 소리로 시작하는 낱말끼리 모아 보세요.',
  '把开头发音相同的词放在一组。',
  'Regroupe les mots qui commencent par le même son.',
);
const HINT_FIND_M = tr(
  'The letter M looks the same each time — find them all.',
  '文字 M は毎回同じ形だよ。全部見つけてね。',
  '글자 M은 모양이 같아요. 모두 찾아보세요.',
  '字母 M 每次都一样，把它们全找出来。',
  'La lettre M a toujours la même forme — trouve-les toutes.',
);
const HINT_MATCH = tr(
  'Match each card with the one that goes with it.',
  'それぞれのカードを、合うものと結びつけてね。',
  '각 카드를 알맞은 것과 연결해 보세요.',
  '把每张卡片和与它相配的连起来。',
  'Associe chaque carte à celle qui lui correspond.',
);

// ---------------------------------------------------------------------------
// Activity constructors
// ---------------------------------------------------------------------------
export interface ExploreOption { id: string; text: string }
export interface ExploreActivity {
  type: ActivityType;
  prompt: string;
  promptTranslations: Tr;
  wrongHint: string;
  wrongHintTranslations: Record<SupportLanguage, { wrongHint: string }>;
  options?: ExploreOption[];
  correctAnswer?: unknown;
  pairs?: { left: string; right: string }[];
  blanks?: { sentence: string; missing: string }[];
  orderedItems?: string[];
  targetWord?: string;
  groups?: { id: string; label: string }[];
  template?: string;
  blankSlots?: { id: string; label: string; acceptedAnswers: string[] }[];
  steps?: { id: string; text: string }[];
}

const opts = (texts: string[]): ExploreOption[] => texts.map((text, i) => ({ id: `opt-${i}`, text }));
/** listen_choose / review: first text is the correct answer unless `correct` says otherwise. */
const choose = (p: Prompt, h: Hint, texts: string[], correct = 0, type: 'listen_choose' | 'review' = 'listen_choose'): ExploreActivity =>
  ({ ...p, ...h, type, options: opts(texts), correctAnswer: `opt-${correct}` });
/** fill_blank: a sentence with one "__" marker; the correct option text equals `missing`. */
const fill = (p: Prompt, h: Hint, sentence: string, missing: string, texts: string[], correct = 0): ExploreActivity =>
  ({ ...p, ...h, type: 'fill_blank', options: opts(texts), correctAnswer: `opt-${correct}`, blanks: [{ sentence, missing }] });
const match = (p: Prompt, h: Hint, pairs: [string, string][]): ExploreActivity =>
  ({ ...p, ...h, type: 'drag_match', pairs: pairs.map(([left, right]) => ({ left, right })) });
const order = (p: Prompt, h: Hint, items: string[]): ExploreActivity =>
  ({ ...p, ...h, type: 'sort_order', orderedItems: items, correctAnswer: items });
const cardWord = (p: Prompt, h: Hint, targetWord: string): ExploreActivity =>
  ({ ...p, ...h, type: 'word_card', targetWord });
const voice = (p: Prompt, h: Hint, targetWord: string): ExploreActivity =>
  ({ ...p, ...h, type: 'record_voice', targetWord });
const multi = (p: Prompt, h: Hint, items: [string, string][], correct: string[]): ExploreActivity =>
  ({ ...p, ...h, type: 'multi_select', options: items.map(([id, text]) => ({ id, text })), correctAnswer: correct });
const groupSort = (p: Prompt, h: Hint, groups: [string, string][], items: [string, string, string][]): ExploreActivity =>
  ({ ...p, ...h, type: 'group_sort', groups: groups.map(([id, label]) => ({ id, label })),
    options: items.map(([id, text]) => ({ id, text })), correctAnswer: Object.fromEntries(items.map(([id, , g]) => [id, g])) });
const followSteps = (p: Prompt, h: Hint, items: [string, string][]): ExploreActivity =>
  ({ ...p, ...h, type: 'follow_steps', steps: items.map(([id, text]) => ({ id, text })) });

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------
export interface ExploreLesson {
  order: number;
  stageOrder: number;
  title: string;
  description: string;
  vocabulary: { word: string; meaning: string }[];
  activities: ExploreActivity[];
}

const B1: ExploreLesson = {
  order: 1, stageOrder: 1, title: 'Bài 1: Người xung quanh em',
  description: 'Bé cùng Sao Lí Lắc gặp gỡ những người thân quen quanh mình và tập hiểu các câu nói đơn giản trong nhà.',
  vocabulary: [
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'bố', meaning: 'Người đàn ông sinh ra và chăm sóc bé.' },
    { word: 'ông', meaning: 'Bố của bố hoặc của mẹ.' },
    { word: 'bà', meaning: 'Mẹ của bố hoặc của mẹ.' },
    { word: 'anh', meaning: 'Người con trai lớn hơn bé trong nhà.' },
    { word: 'chị', meaning: 'Người con gái lớn hơn bé trong nhà.' },
    { word: 'em', meaning: 'Người con nhỏ hơn bé trong nhà.' },
    { word: 'bạn', meaning: 'Người cùng chơi và cùng học với bé.' },
  ],
  activities: [
    choose(P('b01.activity-1.prompt'), H('b01.activity-1.hint'), ['mẹ', 'bố', 'bà']),
    cardWord(P('b01.activity-2.prompt'), Ha('Mẹ là người sinh ra và chăm sóc bé.', G_me), 'MẸ'),
    match(P('b01.activity-3.prompt'), Ha('Hãy nối mỗi từ với đúng người thân trong nhà nhé.', HINT_MATCH),
      [['MẸ', 'người chăm sóc bé'], ['BỐ', 'bố của bé'], ['BÀ', 'bà của bé']]),
    choose(P('b01.activity-4.prompt'), Ha('Mẹ đang nấu cơm nghĩa là mẹ đang chuẩn bị bữa ăn.', G_nauCom),
      ['Mẹ đang nấu cơm.', 'Bố đang ngủ.', 'Bé đang chơi.']),
    choose(Pa('Ai là người chăm sóc và yêu thương bé trong nhà?',
      tr('Who in the family takes care of you and loves you?', '家族の中で、あなたを世話して大切にしてくれるのは誰ですか？',
        '가족 중에서 누가 너를 돌보고 사랑해 주나요?', '家里谁照顾你、爱护你？', 'Qui, dans la famille, prend soin de toi et t’aime ?')),
      Ha('Mẹ là người chăm sóc và yêu thương bé trong nhà.', G_me), ['mẹ', 'bàn', 'cá'], 0, 'review'),
  ],
};

const B2: ExploreLesson = {
  order: 2, stageOrder: 1, title: 'Bài 2: Đồ vật quanh em',
  description: 'Bé nhận ra các đồ vật quen thuộc như sách, bút, cặp và dùng từ đúng với từng đồ vật.',
  vocabulary: [
    { word: 'sách', meaning: 'Tập giấy có chữ và hình để đọc.' },
    { word: 'vở', meaning: 'Tập giấy trắng để bé viết bài.' },
    { word: 'bút', meaning: 'Đồ dùng để viết chữ.' },
    { word: 'cặp', meaning: 'Túi để đựng sách vở khi đi học.' },
    { word: 'bàn', meaning: 'Đồ dùng có mặt phẳng để ngồi học hoặc ăn.' },
    { word: 'ghế', meaning: 'Đồ dùng để ngồi.' },
  ],
  activities: [
    choose(P('b02.activity-1.prompt'), H('b02.activity-1.hint'), ['sách', 'bút', 'cặp'], 1),
    choose(P('b02.activity-2.prompt'), Ha('Sách là đồ dùng có nhiều trang để đọc.', G_sach), ['sách', 'bút', 'cặp']),
    match(Pt('Nối mỗi đồ vật với công dụng của nó nhé!', 'b02.activity-3.prompt'),
      Ha('Hãy nối mỗi đồ vật với việc ta dùng nó để làm.', HINT_MATCH),
      [['sách', 'đồ dùng để đọc'], ['bút', 'đồ dùng để viết'], ['cặp', 'đồ dùng để đựng sách vở']]),
    fill(P('b02.activity-4.prompt'), Ha('Bé dùng bút để viết chữ.', G_viet), 'Bé viết bằng __.', 'bút', ['bút', 'sách', 'phấn']),
    fill(Pt('Từ nào hoàn thành câu?', 'b02.activity-5.prompt'), Ha('Cặp là chiếc túi để đựng sách vở.', G_cap),
      'Bé có một __.', 'cặp', ['cặp', 'bà', 'mèo']),
  ],
};

const B3: ExploreLesson = {
  order: 3, stageOrder: 1, title: 'Bài 3: Con vật quanh em',
  description: 'Bé làm quen với các con vật gần gũi, nghe tên gọi và tìm hiểu nơi chúng sống.',
  vocabulary: [
    { word: 'chó', meaning: 'Con vật nuôi trong nhà, kêu gâu gâu.' },
    { word: 'mèo', meaning: 'Con vật nuôi trong nhà, kêu meo meo.' },
    { word: 'gà', meaning: 'Con vật có cánh, đẻ trứng, kêu cục tác.' },
    { word: 'cá', meaning: 'Con vật sống dưới nước, bơi bằng vây.' },
    { word: 'trâu', meaning: 'Con vật to khỏe, giúp nhà nông kéo cày.' },
    { word: 'chim', meaning: 'Con vật có cánh, biết bay và hót.' },
  ],
  activities: [
    choose(P('b03.activity-1.prompt'), Ha('Mèo là con vật kêu meo meo.', G_meo), ['mèo', 'chó', 'gà']),
    choose(P('b03.activity-2.prompt'), Ha('Mèo là con vật nuôi trong nhà, kêu meo meo.', G_meo), ['mèo', 'cá', 'gà']),
    match(Pt('Nối mỗi cụm từ với từ đúng nhé!', 'b03.activity-3.prompt'),
      Ha('Hãy nối mỗi cụm từ với từ gọi tên con vật.', HINT_MATCH),
      [['con mèo', 'mèo'], ['con cá', 'cá'], ['con chim', 'chim']]),
    fill(P('b03.activity-4.prompt'), Ha('Con cá đang bơi dưới nước.', G_boi), 'Con __ đang bơi.', 'cá', ['cá', 'gà', 'chim']),
    choose(P('b03.activity-5.prompt-1'), Ha('Cá sống dưới nước và bơi bằng vây.', G_ca), ['cá', 'chim', 'gà']),
    choose(P('b03.activity-5.prompt-2'), Ha('Chim có cánh nên có thể bay.', G_chim), ['chim', 'cá', 'trâu']),
  ],
};

const B4: ExploreLesson = {
  order: 4, stageOrder: 1, title: 'Bài 4: Bé làm gì?',
  description: 'Bé học các từ chỉ hành động và tập ghép thành câu kể về việc mình làm trong ngày.',
  vocabulary: [
    { word: 'ăn', meaning: 'Đưa thức ăn vào miệng.' },
    { word: 'uống', meaning: 'Đưa nước vào miệng.' },
    { word: 'ngủ', meaning: 'Nhắm mắt nghỉ ngơi.' },
    { word: 'chơi', meaning: 'Làm những việc vui vẻ.' },
    { word: 'đọc', meaning: 'Nhìn chữ và phát thành tiếng.' },
    { word: 'chạy', meaning: 'Di chuyển nhanh bằng hai chân.' },
    { word: 'đi', meaning: 'Bước bằng hai chân.' },
    { word: 'ngồi', meaning: 'Đặt mình xuống ghế hoặc sàn.' },
  ],
  activities: [
    choose(P('b04.activity-1.prompt'), Ha('Đọc là nhìn chữ và phát thành tiếng.', G_doc), ['đọc', 'chạy', 'ngồi']),
    choose(P('b04.activity-2.prompt'), Ha('Bé đang đọc sách.', G_docSach), ['đọc', 'ngủ', 'chạy']),
    fill(P('b04.activity-3.prompt'), Ha('Bé đang đọc sách — sách có nhiều trang để đọc.', G_sach),
      'Bé đang __ sách.', 'đọc', ['đọc', 'ăn', 'chạy']),
    order(P('b04.activity-4.prompt'),
      Ha('Trong câu tiếng Việt, từ chỉ người thường đứng trước từ chỉ hành động.',
        tr('In Vietnamese, the word for the person usually comes before the action word.',
          'ベトナム語では、人を表す言葉がふつう動作の言葉より前に来るよ。',
          '베트남어에서는 사람을 가리키는 낱말이 보통 동작 낱말보다 앞에 와요.',
          '在越南语里，表示人的词通常放在表示动作的词前面。',
          'En vietnamien, le mot qui désigne la personne vient d’habitude avant le mot d’action.')),
      ['Bé', 'đang', 'chơi']),
    followSteps(P('b04.activity-5.prompt'), Hj(['b04.activity-5.hint-1', 'b04.activity-5.hint-2', 'b04.activity-5.hint-3']),
      [['step-stand', 'Bé đứng lên.'], ['step-walk', 'Bé đi đến bàn.'], ['step-sit', 'Bé ngồi xuống.']]),
  ],
};

const B5: ExploreLesson = {
  order: 5, stageOrder: 2, title: 'Bài 5: Khu rừng chữ cái',
  description: 'Bé bước vào khu chữ cái, nhận mặt chữ và nối chữ với âm đầu quen thuộc.',
  vocabulary: [
    { word: 'A', meaning: 'Chữ A, có trong các tiếng ba, cá.' },
    { word: 'B', meaning: 'Chữ B, có trong các tiếng bà, bé.' },
    { word: 'M', meaning: 'Chữ M, có trong các tiếng mẹ, mèo.' },
    { word: 'C', meaning: 'Chữ C, có trong các tiếng cá, cơm.' },
  ],
  activities: [
    choose(P('b05.activity-1.prompt'),
      Ha('Chữ M có trong tiếng mẹ.', tr('The letter M is in the word “mẹ”.', '文字 M は「mẹ」という言葉の中にあるよ。',
        '글자 M은 ‘mẹ’라는 낱말에 들어 있어요.', '字母 M 在“mẹ”这个词里。', 'La lettre M se trouve dans le mot « mẹ ».')),
      ['A', 'B', 'M'], 2),
    choose(P('b05.activity-2.prompt'),
      Ha('Nghe lại âm /m/ và liên hệ với từ mẹ nhé.',
        tr('Listen to the sound /m/ again and link it to the word “mẹ”.', 'もう一度 /m/ の音を聞いて、「mẹ」という言葉と結びつけてね。',
          '/m/ 소리를 다시 듣고 ‘mẹ’라는 낱말과 연결해 보세요.', '再听一次 /m/ 的音，把它和“mẹ”这个词联系起来。',
          'Écoute à nouveau le son /m/ et relie-le au mot « mẹ ».')),
      ['M', 'B', 'A']),
    multi(P('b05.activity-3.prompt'), Ha('Chữ M xuất hiện ở ba vị trí, con tìm cho đủ nhé.', HINT_FIND_M),
      [['letter-1', 'A'], ['letter-2', 'M'], ['letter-3', 'B'], ['letter-4', 'M'], ['letter-5', 'C'], ['letter-6', 'M']],
      ['letter-2', 'letter-4', 'letter-6']),
    choose(P('b05.activity-4.prompt'), Ha('Mẹ bắt đầu bằng chữ M.', G_me), ['M', 'B', 'C']),
    choose(Pa('Âm /b/ là chữ nào?',
      tr('Which letter makes the sound /b/?', '/b/ の音はどの文字ですか？', '/b/ 소리는 어떤 글자인가요?',
        '/b/ 这个音是哪个字母？', 'Quelle lettre fait le son /b/ ?')),
      Ha('Âm /b/ ứng với chữ B, như trong từ bà.',
        tr('The sound /b/ matches the letter B, as in “bà”.', '/b/ の音は文字 B にあたるよ。「bà」のようにね。',
          '/b/ 소리는 글자 B에 해당해요. ‘bà’처럼요.', '/b/ 这个音对应字母 B，就像“bà”。',
          'Le son /b/ correspond à la lettre B, comme dans « bà ».')),
      ['B', 'M', 'C'], 0, 'review'),
  ],
};

const B6: ExploreLesson = {
  order: 6, stageOrder: 2, title: 'Bài 6: Âm đầu',
  description: 'Bé lắng nghe và nhận ra những tiếng có cùng âm đầu, tập phân nhóm theo âm.',
  vocabulary: [
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'mèo', meaning: 'Con vật nuôi trong nhà, kêu meo meo.' },
    { word: 'mũ', meaning: 'Vật đội trên đầu để che nắng, che mưa.' },
    { word: 'bà', meaning: 'Mẹ của bố hoặc của mẹ.' },
    { word: 'bé', meaning: 'Em nhỏ, chính là con.' },
    { word: 'bóng', meaning: 'Quả tròn để chơi, lăn và nảy được.' },
  ],
  activities: [
    choose(P('b06.activity-1.prompt'),
      Ha('Mẹ, mèo, mũ đều bắt đầu bằng âm /m/.',
        tr('The words “mẹ”, “mèo”, “mũ” all begin with the sound /m/.', '「mẹ」「mèo」「mũ」はどれも /m/ の音で始まるよ。',
          '‘mẹ’, ‘mèo’, ‘mũ’는 모두 /m/ 소리로 시작해요.', '“mẹ”“mèo”“mũ”都以 /m/ 的音开头。',
          'Les mots « mẹ », « mèo », « mũ » commencent tous par le son /m/.')),
      ['Có', 'Không']),
    choose(P('b06.activity-2.prompt'),
      Ha('Mẹ và mèo đều bắt đầu bằng âm /m/.',
        tr('Both “mẹ” (mom) and “mèo” (cat) begin with the sound /m/.', '「mẹ」(お母さん)も「mèo」(猫)も /m/ の音で始まるよ。',
          '‘mẹ’(엄마)와 ‘mèo’(고양이)는 모두 /m/ 소리로 시작해요.', '“mẹ”(妈妈)和“mèo”(猫)都以 /m/ 的音开头。',
          'Les mots « mẹ » (maman) et « mèo » (chat) commencent tous deux par le son /m/.')),
      ['mèo', 'cá', 'bà']),
    groupSort(P('b06.activity-3.prompt'), Ha('Xếp các từ cùng âm đầu vào chung một nhóm nhé.', HINT_GROUP),
      [['group-m', 'Âm /m/'], ['group-b', 'Âm /b/']],
      [['item-me', 'mẹ', 'group-m'], ['item-meo', 'mèo', 'group-m'], ['item-mu', 'mũ', 'group-m'],
        ['item-ba', 'bà', 'group-b'], ['item-be', 'bé', 'group-b'], ['item-bong', 'bóng', 'group-b']]),
    choose(P('b06.activity-4.prompt'),
      Ha('Nghe lại từ và chú ý âm đầu tiên nhé.',
        tr('Listen again and notice the first sound.', 'もう一度聞いて、最初の音に注目してね。',
          '다시 듣고 첫소리에 집중해 보세요.', '再听一遍，注意开头的音。', 'Écoute à nouveau et repère le premier son.')),
      ['m', 'c', 'b']),
  ],
};

const B7: ExploreLesson = {
  order: 7, stageOrder: 2, title: 'Bài 7: Sáu thanh điệu',
  description: 'Bé nghe và phân biệt sáu thanh điệu của tiếng Việt qua các tiếng gần giống nhau.',
  vocabulary: [
    { word: 'ba', meaning: 'Tiếng ba, thanh ngang (không dấu).' },
    { word: 'bà', meaning: 'Tiếng bà, thanh huyền; cũng là bà của bé.' },
    { word: 'bá', meaning: 'Tiếng bá, thanh sắc.' },
    { word: 'bả', meaning: 'Tiếng bả, thanh hỏi.' },
    { word: 'bã', meaning: 'Tiếng bã, thanh ngã.' },
    { word: 'bạ', meaning: 'Tiếng bạ, thanh nặng.' },
  ],
  activities: [
    choose(P('b07.activity-1.prompt'), Ha('Hãy nghe thật kỹ thanh điệu của tiếng nhé.', HINT_TONE), ['ba', 'bà', 'bá']),
    choose(P('b07.activity-2.prompt'),
      Ha('Tiếng bà mang thanh huyền.',
        tr('The syllable “bà” has the falling (huyền) tone.', '「bà」は「フエン（huyền）」の声調だよ。',
          '‘bà’는 ‘후옌(huyền)’ 성조예요.', '“bà”带有“huyền（玄声）”声调。',
          'La syllabe « bà » porte le ton descendant (huyền).')),
      ['ngang', 'huyền', 'sắc'], 1),
    match(P('b07.activity-3.prompt'), Ha('Hãy nối mỗi tiếng với đúng thanh điệu của nó.', HINT_TONE),
      [['ba', 'thanh ngang'], ['bà', 'thanh huyền'], ['bá', 'thanh sắc']]),
    voice(P('b07.activity-4.prompt'), Ha('Con cứ đọc theo thật thoải mái nhé.', HINT_SPEAK), 'ba, bà, bá, bả, bã, bạ'),
  ],
};

const B8: ExploreLesson = {
  order: 8, stageOrder: 2, title: 'Bài 8: Đồng dao cùng Lí Lắc',
  description: 'Bé nghe đồng dao cùng Sao Lí Lắc, tìm vần và đọc theo nhịp vui tai.',
  vocabulary: [
    { word: 'cá', meaning: 'Con vật sống dưới nước, bơi bằng vây.' },
    { word: 'lan', meaning: 'Hoa lan, một loài hoa đẹp và thơm.' },
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'nhà', meaning: 'Nơi gia đình cùng chung sống.' },
  ],
  activities: [
    cardWord(P('b08.activity-1.prompt'), Ha('Hãy đọc chậm từng câu đồng dao nhé.', HINT_READ), 'Nu na nu nống'),
    fill(P('b08.activity-2.prompt'),
      Ha('Nghe lại câu đồng dao và tìm từ còn thiếu nhé.',
        tr('Listen to the rhyme again and find the missing word.', 'もう一度わらべ歌を聞いて、抜けている言葉を探してね。',
          '다시 동요를 듣고 빠진 낱말을 찾아 보세요.', '再听一遍童谣，找出缺少的词。',
          'Écoute à nouveau la comptine et trouve le mot manquant.')),
      'Nu na nu __', 'nống', ['nống', 'nhà', 'nhớ']),
    order(P('b08.activity-3.prompt'), Ha('Đọc lại và xếp các câu theo đúng thứ tự nhé.', HINT_ORDER),
      ['Nu na nu nống', 'Cái cống nằm trong', 'Con ong nằm ngoài']),
    choose(P('b08.activity-4.prompt'),
      Ha('Từ cùng vần với bàn có phần vần -an, như lan.',
        tr('A word that rhymes with “bàn” ends in “-an”, like “lan”.', '「bàn」と韻を踏む言葉は「-an」で終わるよ。「lan」みたいにね。',
          '‘bàn’과 운이 같은 낱말은 ‘-an’으로 끝나요. ‘lan’처럼요.', '与“bàn”押韵的词以“-an”结尾，比如“lan”。',
          'Un mot qui rime avec « bàn » finit par « -an », comme « lan ».')),
      ['lan', 'cá', 'mẹ']),
    voice(P('b08.activity-5.prompt'), Ha('Con cứ đọc theo thật thoải mái nhé.', HINT_SPEAK), 'Nu na nu nống'),
  ],
};

const B9: ExploreLesson = {
  order: 9, stageOrder: 3, title: 'Bài 9: Ghép chữ thành tiếng',
  description: 'Bé ghép chữ cái lại thành tiếng và nối chữ viết với âm thanh vừa nghe.',
  vocabulary: [
    { word: 'ba', meaning: 'Tiếng ba, nghĩa là bố.' },
    { word: 'me', meaning: 'Quả me, có vị chua.' },
    { word: 'ca', meaning: 'Cái ca dùng để uống nước.' },
    { word: 'b', meaning: 'Chữ b, có trong các tiếng ba, bà.' },
    { word: 'a', meaning: 'Chữ a, có trong các tiếng ba, ca.' },
  ],
  activities: [
    order(P('b09.activity-1.prompt'), Ha('Chữ đầu đứng trước, chữ sau đứng sau để tạo thành tiếng.', HINT_SYLLABLE), ['b', 'a']),
    choose(P('b09.activity-2.prompt'),
      Ha('Tiếng ba được ghép từ chữ b và chữ a.',
        tr('The syllable “ba” is made from the letters b and a.', '音節「ba」は文字 b と a でできているよ。',
          '음절 ‘ba’는 글자 b와 a로 만들어져요.', '音节“ba”由字母 b 和 a 组成。',
          'La syllabe « ba » est formée des lettres b et a.')),
      ['ba', 'me', 'ca']),
    choose(P('b09.activity-3.prompt'), Ha('Chọn tổ hợp chữ hợp với âm con vừa nghe nhé.', HINT_SYLLABLE), ['ch', 'tr', 'nh']),
  ],
};

const B10: ExploreLesson = {
  order: 10, stageOrder: 3, title: 'Bài 10: Ghép tiếng thành từ',
  description: 'Bé ghép các tiếng thành từ, thành cụm từ và dùng chúng trong câu ngắn.',
  vocabulary: [
    { word: 'cá', meaning: 'Con vật sống dưới nước, bơi bằng vây.' },
    { word: 'bàn', meaning: 'Đồ dùng có mặt phẳng để ngồi học hoặc ăn.' },
    { word: 'bút', meaning: 'Đồ dùng để viết chữ.' },
    { word: 'con cá', meaning: 'Cách gọi đầy đủ của con vật bơi dưới nước.' },
    { word: 'cái bàn', meaning: 'Chiếc bàn để ngồi học hoặc để ăn.' },
  ],
  activities: [
    order(P('b10.activity-1.prompt'), Ha('Ghép các tiếng theo đúng thứ tự để tạo thành cụm từ nhé.', HINT_SYLLABLE), ['con', 'cá']),
    choose(P('b10.activity-2.prompt'), Ha('Con cá là con vật bơi dưới nước.', G_ca), ['con cá', 'cái bàn', 'mẹ bé']),
    fill(P('b10.activity-3.prompt'), Ha('Con cá đang bơi dưới nước.', G_boi), 'Con __ đang bơi.', 'cá', ['cá', 'bàn', 'bút']),
  ],
};

const B11: ExploreLesson = {
  order: 11, stageOrder: 3, title: 'Bài 11: Chữ nào đang trốn?',
  description: 'Bé tìm chữ còn thiếu để hoàn thiện các từ quen thuộc như cá và mẹ.',
  vocabulary: [
    { word: 'c', meaning: 'Chữ c, có trong các tiếng cá, cơm.' },
    { word: 'b', meaning: 'Chữ b, có trong các tiếng bà, bé.' },
    { word: 'm', meaning: 'Chữ m, có trong các tiếng mẹ, mèo.' },
    { word: 'á', meaning: 'Chữ a có dấu sắc, như trong tiếng cá.' },
  ],
  activities: [
    fill(P('b11.activity-1.prompt'), Ha('Thêm chữ c để tạo thành từ cá.', G_ca), '__á', 'c', ['c', 'b', 'm']),
    fill(P('b11.activity-2.prompt'), Ha('Thêm chữ m để tạo thành từ mẹ.', G_me), '__ẹ', 'm', ['m', 'b', 'c']),
    fill(Pt('Hoàn thiện nốt các chữ còn thiếu để được từ cá nhé!', 'b11.activity-3.prompt'),
      Ha('Hoàn thiện các chữ còn thiếu để được từ cá.', G_ca), 'c__', 'á', ['á', 'e', 'o']),
  ],
};

const B12: ExploreLesson = {
  order: 12, stageOrder: 3, title: 'Bài 12: Đọc cùng Lí Lắc',
  description: 'Bé đọc cùng Sao Lí Lắc từ từng từ, từng cụm đến câu ngắn rồi thu âm giọng đọc của mình.',
  vocabulary: [
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'cá', meaning: 'Con vật sống dưới nước, bơi bằng vây.' },
    { word: 'bà', meaning: 'Mẹ của bố hoặc của mẹ.' },
    { word: 'bé', meaning: 'Em nhỏ, chính là con.' },
  ],
  activities: [
    choose(P('b12.step-1.prompt'), Ha('Chọn từ đúng với âm thanh con vừa nghe nhé.', HINT_LISTEN), ['mẹ', 'cá', 'bà']),
    choose(P('b12.step-2.prompt'), Ha('Con cá là con vật bơi dưới nước.', G_ca), ['con cá', 'mẹ của bé', 'cái bàn']),
    choose(P('b12.step-3.prompt'),
      Ha('Nghe lại câu và chú ý ai đang làm gì nhé.',
        tr('Listen again and notice who is doing what.', 'もう一度聞いて、誰が何をしているかに注目してね。',
          '다시 듣고 누가 무엇을 하는지 살펴보세요.', '再听一遍，注意谁在做什么。',
          'Écoute à nouveau et remarque qui fait quoi.')),
      ['Bé đang đọc sách.', 'Mẹ đang nấu cơm.']),
    voice(Pa('Con nhìn câu, đọc cùng Sao Lí Lắc rồi thu âm nhé!',
      tr('Look at the sentence, read it with Sao Lí Lắc, then record your voice!',
        '文を見て、サオ・リーラックと一緒に読んで、録音してみよう！',
        '문장을 보고 사오 리락과 함께 읽은 뒤 녹음해 보세요!', '看着句子，和萨奥·李乐一起读，然后录音吧！',
        'Regarde la phrase, lis-la avec Sao Lí Lắc puis enregistre ta voix !')),
      Ha('Con cứ đọc thật thoải mái nhé.', HINT_SPEAK), 'Bé đang đọc sách.'),
  ],
};

const B13: ExploreLesson = {
  order: 13, stageOrder: 4, title: 'Bài 13: Ai đang làm gì?',
  description: 'Bé ghép người với hành động để tạo thành câu và kể ai đang làm gì.',
  vocabulary: [
    { word: 'bé', meaning: 'Em nhỏ, chính là con.' },
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'bố', meaning: 'Người đàn ông sinh ra và chăm sóc bé.' },
    { word: 'đọc sách', meaning: 'Nhìn chữ trong sách và đọc thành tiếng.' },
    { word: 'nấu cơm', meaning: 'Làm chín gạo thành cơm để ăn.' },
    { word: 'uống nước', meaning: 'Đưa nước vào miệng khi khát.' },
  ],
  activities: [
    match(P('b13.activity-1.prompt'),
      Ha('Ghép người thực hiện với hành động của họ nhé.',
        tr('Match each person with their action.', 'それぞれの人を、その動作と結びつけてね。',
          '각 사람을 그 사람의 동작과 연결해 보세요.', '把每个人和他的动作连起来。', 'Associe chaque personne à son action.')),
      [['Bé', 'đọc sách'], ['Mẹ', 'nấu cơm'], ['Bố', 'uống nước']]),
    choose(P('b13.activity-2.prompt'), Ha('Mẹ là người đang nấu cơm.', G_nauCom), ['Mẹ', 'Bé', 'Bố']),
    choose(P('b13.activity-3.prompt'), Ha('Bé đang đọc sách.', G_docSach), ['đọc sách', 'nấu cơm', 'uống nước']),
    fill(Pt('Từ chỉ hành động nào hoàn thành câu?', 'b13.activity-4.prompt'),
      Ha('Bé đang đọc — đọc là nhìn chữ và phát thành tiếng.', G_doc), 'Bé đang __.', 'đọc', ['đọc', 'ngủ', 'chạy']),
    voice(Pa('Con nghe rồi nói lại câu nhé!',
      tr('Listen, then say the sentence back!', '聞いてから、その文を言ってみてね！', '듣고 나서 문장을 따라 말해 보세요!',
        '听完以后，把句子说出来吧！', 'Écoute puis répète la phrase !')),
      Ha('Con cứ nói thật thoải mái nhé.', HINT_SPEAK), 'Bé đang đọc sách.'),
  ],
};

const B14: ExploreLesson = {
  order: 14, stageOrder: 4, title: 'Bài 14: Nhìn tranh kể chuyện',
  description: 'Bé sắp xếp các việc trong ngày theo đúng thứ tự và tập kể lại câu chuyện quen thuộc.',
  vocabulary: [
    { word: 'thức dậy', meaning: 'Ngủ xong, mở mắt dậy.' },
    { word: 'đánh răng', meaning: 'Dùng bàn chải làm sạch răng.' },
    { word: 'ăn sáng', meaning: 'Bữa ăn vào buổi sáng.' },
    { word: 'đi học', meaning: 'Đến trường để học bài.' },
  ],
  activities: [
    order(P('b14.activity-1.prompt'), Ha('Hãy nghĩ xem việc nào xảy ra trước, việc nào xảy ra sau nhé.', HINT_ORDER),
      ['Bé thức dậy', 'Bé đánh răng', 'Bé ăn sáng', 'Bé đi học']),
    choose(P('b14.activity-2.prompt'), Ha('Việc xảy ra trước nhất gọi là việc đầu tiên.', G_dauTien),
      ['Bé thức dậy', 'Bé ăn sáng', 'Bé đi học']),
    voice(P('b14.activity-3.prompt'), Hj(['b14.activity-3.hint-1', 'b14.activity-3.hint-2', 'b14.activity-3.hint-3']),
      'Bé thức dậy, đánh răng, ăn sáng rồi đi học.'),
  ],
};

const B15: ExploreLesson = {
  order: 15, stageOrder: 4, title: 'Bài 15: Sự tích Bánh Chưng, Bánh Giầy',
  description: 'Bé nghe câu chuyện Sự tích Bánh Chưng, Bánh Giầy, nhận ra nhân vật, bối cảnh và trình tự sự việc.',
  vocabulary: [
    { word: 'bánh chưng', meaning: 'Bánh vuông gói lá, làm từ gạo nếp, đậu xanh và thịt; ăn vào ngày Tết.' },
    { word: 'bánh giầy', meaning: 'Bánh tròn, màu trắng, làm từ gạo nếp giã nhuyễn.' },
    { word: 'Lang Liêu', meaning: 'Hoàng tử đã làm bánh chưng, bánh giầy dâng vua.' },
    { word: 'Vua Hùng', meaning: 'Vị vua thời xưa, người đứng đầu nước ta.' },
  ],
  activities: [
    cardWord(P('b15.activity-1.prompt'), Ha('Hãy nghe và đọc chậm từng câu của truyện nhé.', HINT_READ),
      'Ngày xưa, vua Hùng muốn chọn người nối ngôi. Hoàng tử Lang Liêu làm bánh chưng vuông và bánh giầy tròn dâng vua. Vua quý tấm lòng của chàng nên truyền ngôi cho Lang Liêu.'),
    choose(P('b15.activity-2.prompt'),
      Ha('Nhân vật chính trong truyện là hoàng tử Lang Liêu.',
        tr('The main character in the story is prince Lang Liêu.', 'お話の主人公はラン・リウ王子だよ。',
          '이야기의 주인공은 랑리에우 왕자예요.', '故事的主人公是郎僚王子。',
          'Le personnage principal de l’histoire est le prince Lang Liêu.')),
      ['Lang Liêu', 'Sơn Tinh', 'Thánh Gióng']),
    choose(P('b15.activity-3.prompt'),
      Ha('Câu chuyện xảy ra ở nước Văn Lang thời vua Hùng.',
        tr('The story takes place in the land of Văn Lang, in the time of the Hùng kings.',
          'お話は、フン王の時代のヴァンラン国で起こるよ。', '이야기는 훙 왕 시대의 반랑 나라에서 일어나요.',
          '故事发生在雄王时期的文郎国。', 'L’histoire se déroule au pays de Văn Lang, à l’époque des rois Hùng.')),
      ['Nước Văn Lang', 'Trên biển', 'Trong rừng']),
    choose(P('b15.activity-4.prompt'),
      Ha('Vua ra điều kiện truyền ngôi trước, rồi Lang Liêu mới làm bánh.',
        tr('First the king sets the condition, then Lang Liêu makes the cakes.', 'まず王が条件を出し、それからラン・リウが餅を作るよ。',
          '먼저 왕이 조건을 내고, 그다음에 랑리에우가 떡을 만들어요.', '先是国王提出条件，然后郎僚才做糕。',
          'D’abord le roi pose la condition, puis Lang Liêu prépare les gâteaux.')),
      ['Vua ra điều kiện truyền ngôi', 'Lang Liêu được truyền ngôi']),
    choose(P('b15.activity-5.prompt'),
      Ha('Lang Liêu được một vị thần báo mộng chỉ cách làm bánh.',
        tr('A god appears in Lang Liêu’s dream and tells him how to make the cakes.',
          '神さまがラン・リウの夢に現れ、餅の作り方を教えるよ。', '한 신이 랑리에우의 꿈에 나타나 떡 만드는 법을 알려줘요.',
          '一位神仙出现在郎僚的梦里，告诉他做糕的方法。',
          'Un génie apparaît dans le rêve de Lang Liêu et lui explique comment faire les gâteaux.')),
      ['Vị thần', 'Lang Liêu', 'Vua Hùng']),
    choose(P('b15.activity-6.prompt'),
      Ha('Cuối truyện, Lang Liêu được vua truyền ngôi.',
        tr('At the end, Lang Liêu is chosen to be the next king.', '最後に、ラン・リウが次の王に選ばれるよ。',
          '마지막에 랑리에우가 다음 왕으로 뽑혀요.', '故事最后，郎僚被选为下一任国王。',
          'À la fin, Lang Liêu est choisi pour devenir le prochain roi.')),
      ['Lang Liêu được truyền ngôi', 'Lang Liêu bỏ đi', 'Nhà vua tức giận']),
    voice(P('b15.activity-7.prompt'), Ha('Con cứ kể thật thoải mái nhé.', HINT_SPEAK),
      'Vua Hùng chọn người nối ngôi. Lang Liêu làm bánh chưng, bánh giầy dâng vua và được truyền ngôi.'),
  ],
};

const B16: ExploreLesson = {
  order: 16, stageOrder: 4, title: 'Bài 16: Nhập vai nhân vật',
  description: 'Bé trò chuyện cùng Sao Lí Lắc, tự giới thiệu và trả lời những câu hỏi quen thuộc hằng ngày.',
  vocabulary: [
    { word: 'bạn', meaning: 'Người cùng chơi và cùng học với con.' },
    { word: 'truyện', meaning: 'Sách kể chuyện có tranh và lời.' },
    { word: 'cái bàn', meaning: 'Đồ dùng có mặt phẳng để ngồi học hoặc ăn.' },
    { word: 'đi học', meaning: 'Đến trường để học bài.' },
  ],
  activities: [
    voice(P('b16.activity-1.prompt'), Ha('Khi được hỏi tên, con nói: Con tên là…', G_tenLa), 'Con tên là Khánh.'),
    voice(P('b16.activity-2.prompt'), Ha('Thích là khi con yêu và muốn làm điều gì đó.', G_thich), 'Con thích đọc truyện.'),
    voice(P('b16.activity-3.prompt'), Ha('Đây là cái bàn — nơi con ngồi học và ăn.', G_caiBan), 'Đây là cái bàn.'),
    voice(P('b16.activity-4.prompt'), Ha('Tại sao là câu hỏi hỏi về lí do.', G_taiSao), 'Con thích đi học vì có nhiều bạn.'),
    voice(Pa('Con hãy kể cho Sao Lí Lắc nghe một việc con thích làm nhé!',
      tr('Tell Sao Lí Lắc about something you like to do!', 'サオ・リーラックに、きみの好きなことを話してね！',
        '사오 리락에게 네가 좋아하는 일을 이야기해 보세요!', '给萨奥·李乐讲讲你喜欢做的一件事吧！',
        'Raconte à Sao Lí Lắc une chose que tu aimes faire !')),
      Ha('Con cứ nói thật thoải mái nhé.', HINT_SPEAK), 'Con kể một việc con thích làm.'),
  ],
};

const B17: ExploreLesson = {
  order: 17, stageOrder: 5, title: 'Bài 17: Đọc và tìm thông tin',
  description: 'Bé đọc một đoạn văn ngắn và tìm các thông tin quan trọng trong bài.',
  vocabulary: [
    { word: 'Lan', meaning: 'Tên bạn nhỏ trong đoạn văn.' },
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'chợ', meaning: 'Nơi mọi người mua và bán đồ.' },
    { word: 'mèo', meaning: 'Con vật nuôi trong nhà, kêu meo meo.' },
    { word: 'cửa hàng', meaning: 'Nơi bày bán đồ cho khách mua.' },
  ],
  activities: [
    cardWord(P('b17.activity-1.prompt'), Ha('Hãy đọc chậm từng câu để hiểu nội dung nhé.', HINT_READ),
      'Sáng nay, bé Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo nhỏ bên cửa hàng.'),
    choose(P('b17.activity-2.prompt-1'), Ha('Lan cùng mẹ đi chợ.', G_diCho), ['Đi chợ', 'Đi học', 'Đi bơi']),
    choose(P('b17.activity-2.prompt-2'), Ha('Lan đi cùng mẹ.', G_me), ['Mẹ', 'Bố', 'Bạn']),
    choose(P('b17.activity-2.prompt-3'), Ha('Lan nhìn thấy một chú mèo nhỏ.', G_meo), ['Mèo', 'Chó', 'Cá']),
    choose(Pa('Lan nhìn thấy chú mèo ở đâu?',
      tr('Where did Lan see the cat?', 'ランはどこで猫を見ましたか？', '란은 어디에서 고양이를 보았나요?',
        '兰在哪里看到了猫？', 'Où Lan a-t-elle vu le chat ?')),
      Ha('Lan nhìn thấy chú mèo nhỏ bên cửa hàng.', G_meo), ['Bên cửa hàng', 'Dưới ao', 'Trên cây'], 0, 'review'),
  ],
};

const B18: ExploreLesson = {
  order: 18, stageOrder: 5, title: 'Bài 18: Đọc và hoàn thành câu',
  description: 'Bé chọn từ phù hợp để hoàn thành câu và sắp xếp từ thành câu đúng.',
  vocabulary: [
    { word: 'nước', meaning: 'Thứ để uống, trong và mát.' },
    { word: 'sách', meaning: 'Tập giấy có chữ và hình để đọc.' },
    { word: 'cơm', meaning: 'Gạo nấu chín để ăn hằng ngày.' },
    { word: 'nấu', meaning: 'Làm chín thức ăn.' },
    { word: 'đọc', meaning: 'Nhìn chữ và phát thành tiếng.' },
  ],
  activities: [
    fill(P('b18.activity-1.prompt'), Ha('Bé uống nước cho đỡ khát.', G_nuoc), 'Bé uống __.', 'nước', ['nước', 'sách', 'chạy']),
    fill(P('b18.activity-2.prompt'), Ha('Mẹ đang nấu cơm.', G_nau), 'Mẹ đang __ cơm.', 'nấu', ['nấu', 'đọc', 'chạy']),
    order(P('b18.activity-3.prompt'), Ha('Đọc lại và xếp các từ theo đúng thứ tự nhé.', HINT_ORDER),
      ['Bé', 'đang', 'đọc', 'sách']),
  ],
};

const B19: ExploreLesson = {
  order: 19, stageOrder: 5, title: 'Bài 19: Câu đố dân gian',
  description: 'Bé nghe các câu đố dân gian vui nhộn và đoán ra con vật, đồ vật hay sự vật quanh mình.',
  vocabulary: [
    { word: 'mèo', meaning: 'Con vật nuôi trong nhà, kêu meo meo.' },
    { word: 'sách', meaning: 'Tập giấy có chữ và hình để đọc.' },
    { word: 'chim', meaning: 'Con vật có cánh, biết bay và hót.' },
    { word: 'mưa', meaning: 'Nước rơi từ trên trời xuống.' },
    { word: 'nắng', meaning: 'Ánh sáng ấm của mặt trời.' },
    { word: 'gió', meaning: 'Luồng không khí chuyển động, làm mát.' },
  ],
  activities: [
    choose(P('b19.activity-1.prompt'), Ha('Con mèo là con vật kêu meo meo.', G_meo), ['mèo', 'chó', 'gà']),
    choose(Pa('Vật gì có nhiều trang, bé mở ra để đọc?',
      tr('What has many pages that you open to read?', '何枚ものページがあって、開いて読むものは何かな？',
        '여러 장이 있어서 펼쳐 읽는 것은 무엇일까요?', '什么东西有很多页，打开来阅读？',
        'Qu’est-ce qui a beaucoup de pages et qu’on ouvre pour lire ?')),
      Ha('Sách là vật có nhiều trang để bé mở ra đọc.', G_sach), ['sách', 'bút', 'cặp']),
    choose(Pa('Con gì có cánh, biết bay và hót líu lo?',
      tr('Which animal has wings, can fly and sings?', '羽があって、飛べて、さえずる動物は何かな？',
        '날개가 있고 날 수 있으며 지저귀는 동물은 무엇일까요?', '哪种动物有翅膀，会飞又会唱歌？',
        'Quel animal a des ailes, peut voler et chante ?')),
      Ha('Chim là con vật có cánh, biết bay và hót.', G_chim), ['chim', 'cá', 'trâu']),
    choose(Pa('Thứ gì rơi từ trên trời, giúp cây cối tươi tốt?',
      tr('What falls from the sky and helps plants grow green?', '空から降ってきて、草木を元気にするものは何かな？',
        '하늘에서 내려와 나무와 풀을 잘 자라게 하는 것은 무엇일까요?', '什么从天上落下来，让花草树木长得茂盛？',
        'Qu’est-ce qui tombe du ciel et aide les plantes à pousser ?')),
      Ha('Mưa là nước rơi từ trên trời xuống.', G_mua), ['mưa', 'nắng', 'gió']),
    choose(Pa('Con mèo thường kêu thế nào?',
      tr('What sound does a cat usually make?', '猫はふつうどんな鳴き声を出すかな？', '고양이는 보통 어떻게 울까요?',
        '猫通常怎么叫？', 'Quel cri fait d’habitude le chat ?')),
      Ha('Con mèo kêu meo meo.', G_meo), ['meo meo', 'gâu gâu', 'ò ó o'], 0, 'review'),
  ],
};

const B20: ExploreLesson = {
  order: 20, stageOrder: 5, title: 'Bài 20: Báu vật Nước Nam',
  description: 'Bé vượt qua năm thử thách nghe, âm, đọc, nói và vận dụng để tìm ra Báu vật Nước Nam.',
  vocabulary: [
    { word: 'mẹ', meaning: 'Người sinh ra và chăm sóc bé.' },
    { word: 'bố', meaning: 'Người đàn ông sinh ra và chăm sóc bé.' },
    { word: 'bà', meaning: 'Mẹ của bố hoặc của mẹ.' },
    { word: 'uống', meaning: 'Đưa nước vào miệng khi khát.' },
    { word: 'nước', meaning: 'Thứ để uống, trong và mát.' },
  ],
  activities: [
    choose(P('b20.challenge-1.prompt'), Ha('Hãy nghe thật kỹ xem con vừa nghe thấy ai nhé.', HINT_LISTEN), ['mẹ', 'bố', 'bà']),
    choose(P('b20.challenge-2.prompt'), Ha('Hãy nghe thật kỹ thanh điệu của tiếng nhé.', HINT_TONE), ['ba', 'bà', 'bá']),
    order(P('b20.challenge-3.prompt'), Ha('Ghép chữ đứng trước với chữ đứng sau để tạo thành từ.', HINT_SYLLABLE), ['c', 'á']),
    voice(P('b20.challenge-4.prompt'), Ha('Con cứ kể thật thoải mái nhé.', HINT_SPEAK),
      'Con kể lại câu chuyện theo thứ tự: đầu tiên, sau đó, cuối cùng.'),
    fill(P('b20.challenge-5.prompt'), Ha('Bé uống nước cho đỡ khát.', G_uong), 'Bé __ nước.', 'uống', ['uống', 'đọc', 'chạy']),
  ],
};

export const exploreCurriculum: ExploreLesson[] = [
  B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20,
];

// ---------------------------------------------------------------------------
// Payload builder
// ---------------------------------------------------------------------------
function finalizeActivity(activity: ExploreActivity, id: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id, type: activity.type, prompt: activity.prompt,
    promptTranslations: activity.promptTranslations,
    wrongHint: activity.wrongHint, wrongHintTranslations: activity.wrongHintTranslations,
    audioUrl: '', imageUrl: '',
  };
  if (activity.options) {
    payload.options = activity.options.map((option) => ({ id: option.id, text: option.text, imageUrl: imageUrlFor(option.text), audioUrl: '' }));
  }
  if (activity.correctAnswer !== undefined) payload.correctAnswer = activity.correctAnswer;
  if (activity.pairs) payload.pairs = activity.pairs;
  if (activity.blanks) payload.blanks = activity.blanks;
  if (activity.orderedItems) payload.orderedItems = activity.orderedItems;
  if (activity.targetWord !== undefined) payload.targetWord = activity.targetWord;
  if (activity.groups) payload.groups = activity.groups;
  if (activity.template !== undefined) payload.template = activity.template;
  if (activity.blankSlots) payload.blankSlots = activity.blankSlots;
  if (activity.steps) payload.steps = activity.steps;
  return payload;
}

/**
 * Build the validated `lesson` payload for one Explore lesson. Activity IDs are deterministic
 * (`explore-<order>-<n>`) so the payload passes `parseDraft`/`validatePublish`; the publish CLI
 * blanks them before `saveDraft` so the server assigns fresh IDs on the real live document.
 * Option/vocabulary images come from the Phase 04 map (empty until the images are uploaded).
 */
export function buildExploreLessonPayload(
  lesson: ExploreLesson,
  stageId: string,
  options: { freeInStarterPlan?: boolean } = {},
): LessonContent {
  return parseDraft('lesson', {
    stageId,
    order: lesson.order,
    title: lesson.title,
    description: lesson.description,
    freeInStarterPlan: options.freeInStarterPlan ?? lesson.order <= 4,
    vocabulary: lesson.vocabulary.map((word) => ({ word: word.word, meaning: word.meaning, imageUrl: imageUrlFor(word.word), audioUrl: '' })),
    activities: lesson.activities.map((activity, index) => finalizeActivity(activity, `explore-${lesson.order}-${index + 1}`)),
  });
}

/** The reviewed VI→locale translation pairs the source parser returns (used by tests to prove coverage). */
export const exploreTranslationEntries = catalog.entries;
