import { createHash } from 'node:crypto';
import { customerCatalog, type CustomerEntry } from './customerCatalog.js';
import { parseDraft, validatePublish } from '../../modules/content/content.validation.js';
import type { LessonContent } from '../../modules/content/content.types.js';

// Separate from immutable source snapshots and from the legacy demo seed.
export const bootstrapId = (key: string) => createHash('sha256').update(`vietverse:customer-bootstrap:v1:${key}`).digest('hex').slice(0, 24);
type Activity = LessonContent['activities'][number];
type Exercise = {
  reading: string; words: [string, string][]; question: string; choices: [string, string, string];
  blank: [string, string, string, string]; sequence: string[];
};
const exercises: Exercise[] = [
  { reading: 'Mẹ nấu cơm. Bố đọc sách. Bé chào ông bà khi đi học về.', words: [['mẹ', 'Người thân trong gia đình của bé.'], ['bạn', 'Người cùng học hoặc cùng chơi với bé.']], question: 'Trong đoạn đọc, ai nấu cơm?', choices: ['Mẹ', 'Bố', 'Bé'], blank: ['Bé chào ông __.', 'bà', 'bàn', 'bát'], sequence: ['Bé', 'chào', 'ông bà.'] },
  { reading: 'Bé dùng bút để viết. Bé đọc sách rồi cất sách vào cặp.', words: [['bút', 'Đồ dùng để viết hoặc vẽ.'], ['cặp', 'Đồ dùng để đựng sách vở.']], question: 'Bé dùng gì để viết?', choices: ['Bút', 'Ghế', 'Cặp'], blank: ['Bé viết bằng __.', 'bút', 'cặp', 'ghế'], sequence: ['Bé', 'đọc', 'sách.'] },
  { reading: 'Mèo kêu meo meo. Cá bơi dưới nước. Chim bay trên trời.', words: [['cá', 'Con vật sống dưới nước và thở bằng mang.'], ['chim', 'Con vật có lông vũ, thường có thể bay.']], question: 'Con nào trong đoạn đọc bơi dưới nước?', choices: ['Cá', 'Mèo', 'Chim'], blank: ['Con __ kêu meo meo.', 'mèo', 'cá', 'gà'], sequence: ['Con cá', 'đang', 'bơi.'] },
  { reading: 'Bé ăn cơm, uống nước và đọc sách. Bé chạy ở sân chơi an toàn.', words: [['đọc', 'Nhìn chữ và hiểu hoặc nói thành tiếng.'], ['ngồi', 'Đặt thân mình lên ghế hoặc một chỗ thích hợp.']], question: 'Việc nào bé làm với quyển sách?', choices: ['Đọc', 'Uống', 'Ngủ'], blank: ['Bé __ nước.', 'uống', 'đọc', 'chạy'], sequence: ['Bé', 'đang', 'chơi.'] },
  { reading: 'Đây là ba chữ cái: A, B, M. Chữ M xuất hiện ở đầu tiếng mẹ.', words: [['A', 'Một chữ cái trong bảng chữ cái tiếng Việt.'], ['M', 'Chữ cái đứng đầu tiếng mẹ.']], question: 'Tiếng mẹ bắt đầu bằng chữ nào?', choices: ['M', 'A', 'B'], blank: ['__ẹ', 'M', 'B', 'C'], sequence: ['M', 'Ẹ'] },
  { reading: 'Mẹ, mèo, mũ bắt đầu bằng m. Bà, bé, bóng bắt đầu bằng b.', words: [['âm đầu', 'Âm đứng ở đầu một tiếng.'], ['mũ', 'Đồ dùng đội trên đầu.']], question: 'Tiếng nào bắt đầu bằng m?', choices: ['mèo', 'bà', 'cá'], blank: ['__óng', 'b', 'm', 'c'], sequence: ['m', 'ẹ'] },
  { reading: 'Tiếng Việt có sáu thanh: ngang, huyền, sắc, hỏi, ngã, nặng. Cùng đọc: ba, bà, bá, bả, bã, bạ.', words: [['thanh huyền', 'Thanh thường được viết bằng dấu huyền, như trong bà.'], ['thanh sắc', 'Thanh thường được viết bằng dấu sắc, như trong bá.']], question: 'Tiếng bà có thanh nào?', choices: ['Huyền', 'Sắc', 'Ngang'], blank: ['Tiếng bá có thanh __.', 'sắc', 'huyền', 'nặng'], sequence: ['b', 'à'] },
  { reading: 'Cùng đọc hai dòng trích từ đồng dao: Dung dăng dung dẻ / Dắt trẻ đi chơi.', words: [['đồng dao', 'Lời thơ dân gian thường được trẻ đọc theo nhịp khi chơi.'], ['đi chơi', 'Tham gia hoạt động vui chơi.']], question: 'Hai dòng vừa đọc nói đến việc gì?', choices: ['Đi chơi', 'Ăn cơm', 'Đi ngủ'], blank: ['Dắt trẻ đi __.', 'chơi', 'ngủ', 'học'], sequence: ['Dung dăng', 'dung dẻ'] },
  { reading: 'Ghép b với a thành ba. Ghép m với ẹ thành mẹ. Ghép c với á thành cá.', words: [['ba', 'Một cách gọi bố.'], ['cá', 'Con vật sống dưới nước.']], question: 'Ghép b với a được tiếng nào?', choices: ['ba', 'mẹ', 'cá'], blank: ['c__', 'á', 'ẹ', 'ì'], sequence: ['b', 'a'] },
  { reading: 'Ghép con và cá được con cá. Ghép cái và bàn được cái bàn. Bé đọc từng tiếng rồi đọc cả cụm từ.', words: [['con cá', 'Cách gọi một con vật sống dưới nước.'], ['cái bàn', 'Đồ dùng có mặt phẳng để đặt đồ, học hoặc làm việc.']], question: 'Ghép con và cá được cụm từ nào?', choices: ['con cá', 'cái bàn', 'con mèo'], blank: ['Con __ đang bơi.', 'cá', 'bàn', 'sách'], sequence: ['cái', 'bàn'] },
  { reading: 'Điền một chữ để hoàn thành tiếng: c__ thành cá; __ẹ thành mẹ. Mỗi ô trong bài này chỉ thiếu một chữ.', words: [['chữ', 'Kí hiệu dùng để viết tiếng và từ.'], ['mẹ', 'Người thân trong gia đình của bé.']], question: 'Tiếng mẹ còn thiếu chữ nào trong __ẹ?', choices: ['m', 'b', 'c'], blank: ['c__', 'á', 'ẹ', 'ì'], sequence: ['m', 'ẹ'] },
  { reading: 'Mẹ của bé đọc sách. Bé ngồi cạnh mẹ. Hai mẹ con cùng đọc một câu ngắn.', words: [['đọc sách', 'Nhìn và tìm hiểu nội dung trong sách.'], ['cạnh', 'Ở bên hoặc gần một người hay vật.']], question: 'Bé ngồi cạnh ai?', choices: ['Mẹ', 'Ông', 'Bạn'], blank: ['Mẹ của bé đọc __.', 'sách', 'nước', 'ghế'], sequence: ['Bé', 'đọc', 'sách.'] },
  { reading: 'Bé đọc sách. Mẹ nấu cơm. Bố uống nước. Mỗi câu cho biết một người đang làm gì.', words: [['nấu', 'Làm thức ăn chín bằng nhiệt.'], ['uống', 'Đưa nước hoặc đồ uống vào miệng.']], question: 'Mẹ làm gì trong đoạn đọc?', choices: ['Nấu cơm', 'Đọc sách', 'Uống nước'], blank: ['Bố __ nước.', 'uống', 'nấu', 'đọc'], sequence: ['Mẹ', 'nấu', 'cơm.'] },
  { reading: 'Buổi sáng, bé thức dậy. Bé đánh răng, ăn sáng rồi đi học.', words: [['trước', 'Xảy ra sớm hơn một việc khác.'], ['sau', 'Xảy ra muộn hơn một việc khác.']], question: 'Bé làm gì đầu tiên?', choices: ['Thức dậy', 'Đi học', 'Ăn sáng'], blank: ['Bé đánh __.', 'răng', 'sách', 'cơm'], sequence: ['Bé thức dậy.', 'Bé đánh răng.', 'Bé ăn sáng.', 'Bé đi học.'] },
  { reading: 'Bản kể ngắn biên soạn lại theo truyện dân gian Bánh chưng, bánh giầy: Vua muốn chọn người nối ngôi. Lang Liêu làm bánh chưng hình vuông và bánh giầy hình tròn từ gạo. Chàng dâng bánh lên vua để bày tỏ lòng biết ơn trời đất và cha mẹ. Vua chọn Lang Liêu.', words: [['bánh chưng', 'Bánh truyền thống thường có hình vuông, làm từ gạo nếp.'], ['bánh giầy', 'Bánh truyền thống hình tròn, làm từ gạo nếp giã nhuyễn.']], question: 'Ai làm bánh chưng và bánh giầy trong bản kể?', choices: ['Lang Liêu', 'Chú Cuội', 'Thằng Bờm'], blank: ['Bánh chưng có hình __.', 'vuông', 'tròn', 'tam giác'], sequence: ['Lang Liêu làm bánh.', 'Lang Liêu dâng bánh.', 'Vua chọn Lang Liêu.'] },
  { reading: 'Bạn hỏi: Bạn tên là gì? Bé đáp: Mình tên là An. Bạn hỏi: Bạn thích làm gì? Bé đáp: Mình thích đọc truyện.', words: [['giới thiệu', 'Nói cho người khác biết một vài điều về mình.'], ['lịch sự', 'Cư xử và nói năng tôn trọng người khác.']], question: 'Khi được hỏi tên, câu nào phù hợp?', choices: ['Mình tên là An.', 'Đây là cái bàn.', 'Trời đang mưa.'], blank: ['Mình thích đọc __.', 'truyện', 'ghế', 'nước'], sequence: ['Mình', 'tên là', 'An.'] },
  { reading: 'Sáng nay, bé Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo nhỏ bên cửa hàng.', words: [['chợ', 'Nơi mọi người mua và bán hàng.'], ['cửa hàng', 'Nơi bán một hoặc nhiều loại hàng.']], question: 'Lan đi cùng ai?', choices: ['Mẹ', 'Bố', 'Ông'], blank: ['Lan nhìn thấy một chú __ nhỏ.', 'mèo', 'cá', 'chim'], sequence: ['Lan', 'cùng mẹ', 'đi chợ.'] },
  { reading: 'Bé uống nước. Mẹ đang nấu cơm. Bé đang đọc sách. Chọn từ đúng để câu có nghĩa.', words: [['nước', 'Chất lỏng cần thiết cho sự sống.'], ['cơm', 'Món ăn được nấu từ gạo.']], question: 'Từ nào điền vào Bé uống __?', choices: ['nước', 'sách', 'chạy'], blank: ['Mẹ đang __ cơm.', 'nấu', 'đọc', 'uống'], sequence: ['Bé', 'đang', 'đọc', 'sách.'] },
  { reading: 'Đố bé: Con gì kêu meo meo? Con gì sáng sớm thường gáy ò ó o? Cùng tìm đáp án từ những con vật quen thuộc.', words: [['câu đố', 'Câu hỏi dùng dấu hiệu để người nghe tìm đáp án.'], ['gà trống', 'Con gà thường gáy ò ó o.']], question: 'Con gì kêu meo meo?', choices: ['Mèo', 'Chó', 'Gà'], blank: ['Gà trống gáy __.', 'ò ó o', 'meo meo', 'gâu gâu'], sequence: ['Con mèo', 'kêu', 'meo meo.'] },
  { reading: 'Bé ôn lại các chặng qua năm thử thách: từ quen thuộc, chữ và thanh, ghép tiếng, thứ tự câu chuyện và đọc hiểu.', words: [['báu vật', 'Vật có giá trị được giữ gìn và trân trọng.'], ['tiếng Việt', 'Ngôn ngữ giúp bé giao tiếp, đọc và kể chuyện bằng tiếng Việt.']], question: 'Đồ dùng nào để viết?', choices: ['Bút', 'Cặp', 'Ghế'], blank: ['Tiếng bá có thanh __.', 'sắc', 'huyền', 'nặng'], sequence: ['con', 'cá'] },
];

const stageDefinitions = [
  ['lam-quen-tieng-viet', 'LÀM QUEN VỚI TIẾNG VIỆT', 'Nhận biết người, đồ vật, con vật và hoạt động quen thuộc.'],
  ['kham-pha-am-va-chu', 'KHÁM PHÁ ÂM VÀ CHỮ', 'Nhận biết chữ cái, âm đầu, sáu thanh và nhịp đồng dao.'],
  ['ghep-tieng-doc-tu', 'GHÉP TIẾNG, ĐỌC TỪ', 'Ghép chữ thành tiếng, ghép tiếng và đọc câu ngắn.'],
  ['noi-va-ke-chuyen', 'NÓI VÀ KỂ CHUYỆN', 'Hiểu câu, kể theo thứ tự và luyện lời giao tiếp lịch sự.'],
  ['doc-hieu-va-van-dung', 'ĐỌC HIỂU VÀ VẬN DỤNG', 'Tìm thông tin, hoàn thành câu, giải đố và ôn tập.'],
];

function choice(prompt: string, choices: string[], answer: string, rotation: number, type: 'review' | 'fill_blank' = 'review'): Partial<Activity> {
  const arranged = [...choices.slice(rotation % choices.length), ...choices.slice(0, rotation % choices.length)];
  const options = arranged.map((text, i) => ({ id: `option-${i + 1}`, text, imageUrl: '', audioUrl: '' }));
  return { type, prompt, options, correctAnswer: options.find(o => o.text === answer)!.id };
}
const sort = (orderedItems: string[], prompt = 'Sắp xếp để được câu hoặc tiếng vừa đọc.'): Partial<Activity> => ({ type: 'sort_order', prompt, orderedItems, correctAnswer: orderedItems });
function sequencing(items: string[], rotation: number, prompt = 'Chọn thứ tự các mảnh để được câu hoặc tiếng vừa đọc.'): Partial<Activity> {
  if (items.length <= 3 && items.every(item => item.length <= 3)) return sort(items, prompt);
  // The deployed sorting renderer has small fixed tiles. For longer phrases,
  // show numbered fragments in the prompt and select their order as short text.
  const numbered = [...items].reverse();
  const expected = numbered.map((_, i) => String(numbered.length - i));
  const alternatives = [expected.join(' → '), [...expected].reverse().join(' → ')];
  if (items.length > 2) alternatives.push([...expected.slice(1), expected[0]].join(' → '));
  return choice(`${prompt}\n${numbered.map((item, i) => `${i + 1}: ${item}`).join('\n')}`, alternatives, alternatives[0], rotation);
}

const authoredCulture = [
  { intro: 'Tết Nguyên Đán là dịp đón năm mới theo lịch âm. Nhiều gia đình sum họp và chúc nhau điều tốt lành.', facts: ['Nhiều gia đình dọn dẹp nhà cửa trước Tết.', 'Miền Bắc thường có hoa đào; miền Nam thường có hoa mai trong dịp Tết.', 'Bé có thể chúc ông bà mạnh khỏe và vui vẻ.'], question: 'Lời chúc nào phù hợp vào dịp Tết?', options: ['Chúc ông bà mạnh khỏe!', 'Chúc ông bà luôn mệt!', 'Chúc ông bà làm rơi đồ!'] },
  { intro: 'Bánh chưng là một món bánh truyền thống thường được làm vào dịp Tết. Bánh thường có hình vuông.', facts: ['Bánh chưng thường được làm từ gạo nếp, đậu xanh và thịt lợn.', 'Bánh thường được gói bằng lá dong hoặc lá chuối tùy vùng.', 'Bánh chưng gắn với truyện dân gian Bánh chưng, bánh giầy.'], question: 'Bánh chưng thường xuất hiện vào dịp nào?', options: ['Tết', 'Trung thu', 'Sinh nhật'] },
  { intro: 'Áo dài là một trang phục quen thuộc của Việt Nam, thường được mặc trong các dịp lễ và nhiều hoạt động khác.', facts: ['Áo dài thường có hai tà áo.', 'Áo dài thường được mặc cùng quần dài.', 'Áo dài có nhiều màu sắc và kiểu dáng; cả nam và nữ đều có thể mặc.'], question: 'Áo dài thường có mấy tà?', options: ['Hai tà', 'Không có tà', 'Mười tà'] },
  { intro: 'Phong tục là những cách sinh hoạt được truyền qua nhiều thế hệ. Mỗi gia đình và cộng đồng có thể có phong tục khác nhau.', facts: ['Nhiều gia đình mời nhau trước bữa ăn.', 'Bé chào người lớn là cách thể hiện sự kính trọng.', 'Khi được giúp đỡ, bé có thể nói lời cảm ơn.'], question: 'Khi được giúp đỡ, bé nên nói gì?', options: ['Cảm ơn!', 'Đi ra!', 'Không cần nói gì.'] },
  { intro: 'Việt Nam có nhiều lễ hội ở các vùng miền. Trung thu là một dịp nhiều bạn nhỏ vui chơi cùng gia đình.', facts: ['Tết Trung thu diễn ra vào rằm tháng tám âm lịch.', 'Một số nơi tổ chức rước đèn và múa lân vào dịp Trung thu.', 'Khi đi lễ hội, bé cần đi cùng người lớn và không chen lấn.'], question: 'Khi đi lễ hội, bé nên làm gì?', options: ['Đi cùng người lớn.', 'Tự đi xa một mình.', 'Chen lấn, đẩy bạn.'] },
  { intro: 'Nón lá là đồ vật quen thuộc trong đời sống Việt Nam. Nhiều chiếc nón lá có hình chóp và được làm thủ công.', facts: ['Nón lá có thể giúp che nắng và mưa nhẹ.', 'Nón thường có khung tre và lớp lá phủ bên ngoài.', 'Quai nón giúp giữ nón trên đầu.'], question: 'Nón lá thường được dùng để làm gì?', options: ['Đội che nắng.', 'Đựng cơm nóng.', 'Viết chữ.'] },
  { intro: 'Việt Nam có núi, rừng, đồng bằng, sông và biển. Bé cùng tìm hiểu và giữ gìn thiên nhiên quanh mình.', facts: ['Rừng là nơi sống của nhiều loài cây và động vật.', 'Ruộng lúa có thể thấy ở nhiều vùng đồng bằng.', 'Bỏ rác đúng chỗ giúp giữ sạch sông, biển và nơi bé sống.'], question: 'Hành động nào giúp bảo vệ thiên nhiên?', options: ['Bỏ rác đúng chỗ.', 'Ném rác xuống sông.', 'Bẻ cành cây.'] },
  { intro: 'Trò chơi dân gian được truyền từ đời này sang đời khác. Cùng chơi giúp bé vận động và hợp tác với bạn.', facts: ['Rồng rắn lên mây là một trò chơi theo nhóm.', 'Ô ăn quan thường dùng các ô vẽ và những viên sỏi nhỏ.', 'Bé nên chọn chỗ chơi an toàn và thống nhất luật với bạn.'], question: 'Trước khi chơi cùng nhóm, bé nên làm gì?', options: ['Thống nhất luật, chọn chỗ an toàn.', 'Đẩy bạn ra.', 'Chạy ra lòng đường.'] },
];

export function buildBootstrapCatalog() {
  const stages = stageDefinitions.map(([slug, title, goal], index) => ({ _id: bootstrapId(`stage-${index + 1}`), order: index + 1, slug, title: `Chặng ${index + 1}: ${title}`, goal, description: goal, subtitle: '', status: 'active' as const }));
  const entries: Array<CustomerEntry & { id: string }> = customerCatalog.map(source => {
    let result: CustomerEntry;
    if (source.kind === 'lesson') {
      const order = source.order!;
      const e = exercises[order - 1];
      let activities: Partial<Activity>[] = [
        { type: 'word_card', prompt: 'Cùng đọc (chưa có audio thu âm).', subPrompt: e.reading, targetWord: e.words[0][0].split(' ')[0] },
        choice(e.question, e.choices, e.choices[0], order),
        { ...choice('Chọn phần còn thiếu.', e.blank.slice(1), e.blank[1], order + 1, 'fill_blank'), blanks: [{ sentence: e.blank[0], missing: e.blank[1] }] },
        sequencing(e.sequence, order),
      ];
      // Preserve fully specified source tasks, while supplementing text-only exercises.
      const originalType = order === 4 ? 'follow_steps' : order === 5 ? 'multi_select' : order === 6 ? 'group_sort' : null;
      const original = source.payload.activities.find(a => a.type === originalType);
      if (original) activities.push({ ...original, prompt: order === 4 ? 'Bé tự xác nhận từng bước; không xác minh động tác ngoài đời.' : original.prompt });
      if (order === 20) activities = [
        choice('Thử thách 1 — Từ quen thuộc: Đồ dùng nào để viết?', e.choices, 'Bút', 1),
        choice('Thử thách 2 — Chữ và thanh: Tiếng bá có thanh nào?', ['sắc', 'huyền', 'nặng'], 'sắc', 2),
        sort(['con', 'cá'], 'Thử thách 3 — Ghép tiếng thành cụm từ con cá.'),
        sequencing(['Bé thức dậy.', 'Bé đánh răng.', 'Bé ăn sáng.', 'Bé đi học.'], 1, 'Thử thách 4 — Chọn thứ tự câu chuyện của một buổi sáng.'),
        choice('Thử thách 5 — Đọc: Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo. Lan nhìn thấy con gì?', ['mèo', 'cá', 'chim'], 'mèo', 1),
      ];
      result = { ...source, payload: parseDraft('lesson', {
        ...source.payload, stageId: stages[Math.ceil(order / 4) - 1]._id,
        description: 'Vietverse biên soạn bổ sung theo giáo án khách hàng, không phải nguyên văn Docs. Bản học qua chữ, chưa có audio/thu âm; không chấm phát âm.\n' + e.reading,
        vocabulary: e.words.map(([word, meaning]) => ({ word, meaning })), freeInStarterPlan: order <= 4,
        activities: activities.map((a, i) => ({ ...a, id: `bootstrap-${order}-${i + 1}`, pointsWeight: 1 })),
      }), editorialNotes: [
        { field: 'description', reason: 'normalization', message: 'Owner cho phép tự biên soạn phần thiếu. Reading/vocabulary/activities là bản biên soạn bổ sung theo chủ đề; source.heading dẫn tới giáo án gốc, không chứng minh mọi câu là nguyên văn.' },
        { field: 'activities', reason: 'missing_source', message: 'Không có audio/ảnh/Cloudinary nguồn: dùng đọc/chọn chữ thay bài nghe/thu âm. Đây là bản học qua chữ, không phải nghiệm thu đầy đủ giáo án đa phương tiện.' },
        ...(original ? [{ field: `activities.${activities.length - 1}`, reason: 'normalization' as const, message: 'Items/đáp án/bước trích từ Docs; nhãn thao tác bổ sung. follow_steps là tự báo cáo, không xác minh hành động.' }] : []),
      ] };
    } else if (source.kind === 'story') {
      result = { ...source, payload: parseDraft('story', { ...source.payload,
        description: 'Văn bản từ tài liệu khách hàng; giữ dị bản đã chọn trong snapshot. Chưa có audio thu âm. Attribution/quyền sử dụng chưa xác minh độc lập.',
        ageGroups: ['5-6', '6-8'],
      }) };
    } else {
      const index = customerCatalog.filter(e => e.kind === 'culture').findIndex(e => e.key === source.key);
      const article = authoredCulture[index];
      result = { ...source, payload: parseDraft('culture', { ...source.payload, intro: article.intro, funFacts: article.facts,
        tags: ['Vietverse biên soạn bổ sung'],
        quiz: [{ question: article.question, options: article.options, correctAnswer: 0, explanation: article.options[0] }],
      }), editorialNotes: [
        { field: 'intro', reason: 'normalization', message: 'Vietverse biên soạn bổ sung theo chủ đề Docs, được owner cho phép; không phải toàn văn khách hàng.' },
        { field: 'funFacts', reason: 'normalization', message: 'Nội dung bổ sung; cần content owner rà soát mức độ phù hợp lứa tuổi.' },
        { field: 'quiz', reason: 'normalization', message: index === 1 ? 'Câu hỏi bánh chưng giữ từ nguồn; explanation bổ sung.' : 'Câu hỏi, lựa chọn, đáp án do Vietverse biên soạn bổ sung.' },
        { field: 'audioUrl', reason: 'missing_source', message: 'Chưa có audio thu âm, không tạo URL giả.' },
      ] };
    }
    const issues = validatePublish(result.kind, result.payload);
    if (issues.length) throw new Error(`BOOTSTRAP_INVALID_CONTENT:${result.key}:${JSON.stringify(issues)}`);
    return { ...result, id: bootstrapId(result.key) };
  });
  const hash = createHash('sha256').update(JSON.stringify({ stages, entries })).digest('hex');
  return { stages, entries, hash };
}
