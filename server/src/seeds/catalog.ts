import type { IActivity } from '../models/Lesson.js';

// Chương trình bám theo tài liệu thiết kế "VIETVERSE WEBSITE": 5 chặng, mỗi chặng 4 bài.
// Tài liệu có hai chỗ đặt tên khác nhau — phần "Cấu Trúc TỔNG QUAN" và phần "Chi Tiết Các
// Chặng". Lấy theo bản TỔNG QUAN vì trang "Tiến độ học tập" cũng dùng đúng bộ tên ấy, nên
// hai trên ba chỗ trong tài liệu thống nhất. Nội dung bên trong mỗi bài soạn theo phần CHI
// TIẾT, chỗ nêu rõ từ vựng, ngữ liệu và đáp án.
export const stages = [
  ['lam-quen-tieng-viet', 'Làm quen với tiếng Việt', 'Nghe và hiểu tiếng Việt quanh em: người thân, đồ vật, con vật và việc bé làm.'],
  ['kham-pha-am-va-chu', 'Khám phá âm và chữ', 'Nhận biết chữ cái, âm đầu, sáu thanh điệu và nhịp điệu đồng dao.'],
  ['ghep-tieng-doc-tu', 'Ghép tiếng, đọc từ', 'Ghép chữ thành tiếng, ghép tiếng thành từ rồi đọc câu ngắn.'],
  ['noi-va-ke-chuyen', 'Nói và kể chuyện', 'Nói câu theo mẫu, kể chuyện theo thứ tự và trò chuyện cùng Lí Lắc.'],
  ['doc-hieu-van-dung', 'Đọc hiểu và vận dụng', 'Đọc hiểu đoạn ngắn, hoàn thành câu, giải câu đố và vận dụng tiếng Việt.'],
].map(([slug, title, goal], index) => ({ order: index + 1, slug, title: `Chặng ${index + 1}: ${title}`, goal, description: goal, status: 'active' as const }));

type Exercise = { title: string; words: [string, string][]; reading: string; question: string; choices: [string, string, string]; blank: [string, string, string, string]; order: string[]; speak: string };
const exercises: Exercise[] = [
  // ---- Chặng 1: Làm quen với tiếng Việt ----------------------------------
  { title: 'Người xung quanh em', words: [['mẹ', 'Người sinh ra và chăm sóc bé'], ['ông', 'Bố của bố hoặc của mẹ']], reading: 'Nhà bé có ông, bà, bố, mẹ và anh. Ai cũng thương bé.', question: 'Ai là bố của bố bé?', choices: ['Ông', 'Anh', 'Bạn'], blank: ['Bé thương __ lắm.', 'mẹ', 'mèo', 'mây'], order: ['Bé', 'thương', 'mẹ'], speak: 'Bé kể tên những người trong nhà mình.' },
  { title: 'Đồ vật quanh em', words: [['sách', 'Có nhiều trang để đọc'], ['cặp', 'Túi đựng sách vở khi đi học']], reading: 'Bé xếp sách, vở và bút vào cặp. Cặp để trên bàn, cạnh chiếc ghế.', question: 'Bé đựng sách vở vào đâu?', choices: ['Cặp', 'Nồi', 'Chậu'], blank: ['Bé bỏ bút vào __.', 'cặp', 'cá', 'cây'], order: ['Bé', 'bỏ', 'bút', 'vào', 'cặp'], speak: 'Bé gọi tên ba đồ vật trong cặp của mình.' },
  { title: 'Con vật quanh em', words: [['mèo', 'Con vật kêu meo meo'], ['trâu', 'Con vật to, giúp người kéo cày']], reading: 'Trong sân có gà và chó. Dưới ao có cá. Trên trời có chim bay.', question: 'Con vật nào bơi dưới ao?', choices: ['Cá', 'Gà', 'Chim'], blank: ['Con __ kêu meo meo.', 'mèo', 'trâu', 'gà'], order: ['Con', 'cá', 'bơi'], speak: 'Bé kể tên hai con vật bé từng thấy và nói chúng sống ở đâu.' },
  { title: 'Bé làm gì?', words: [['uống', 'Đưa nước vào miệng'], ['ngồi', 'Đặt mình xuống ghế hoặc xuống sàn']], reading: 'Buổi sáng bé ăn và uống sữa. Bé ngồi đọc sách rồi ra sân chạy chơi.', question: 'Bé làm gì ngoài sân?', choices: ['Chạy chơi', 'Ngủ', 'Nấu cơm'], blank: ['Bé __ sữa.', 'uống', 'ngủ', 'ngồi'], order: ['Bé', 'ngồi', 'đọc', 'sách'], speak: 'Bé nói ba việc bé đã làm hôm nay.' },

  // ---- Chặng 2: Khám phá âm và chữ ---------------------------------------
  { title: 'Khu rừng chữ cái', words: [['a', 'Chữ cái có trong tiếng ba'], ['b', 'Chữ cái đứng đầu tiếng bé']], reading: 'Trong khu rừng chữ cái có a, b, c. Tiếng ba có chữ a. Tiếng bé có chữ b.', question: 'Tiếng ba có chữ cái nào?', choices: ['a', 'e', 'o'], blank: ['b__', 'a', 'e', 'o'], order: ['b', 'a'], speak: 'Bé đọc ba chữ cái: a, b, c.' },
  { title: 'Âm đầu', words: [['âm đầu', 'Âm đứng ở đầu một tiếng'], ['c', 'Âm đầu của tiếng cá']], reading: 'Cá, cam, cua đều bắt đầu bằng âm c. Mẹ, mèo, mưa đều bắt đầu bằng âm m.', question: 'Tiếng nào bắt đầu bằng âm m?', choices: ['mèo', 'cá', 'bà'], blank: ['__èo', 'm', 'c', 'b'], order: ['c', 'á'], speak: 'Bé tìm hai tiếng cùng bắt đầu bằng âm c.' },
  { title: 'Sáu thanh điệu', words: [['thanh điệu', 'Dấu làm tiếng đổi giọng và đổi nghĩa'], ['bà', 'Tiếng ba thêm dấu huyền']], reading: 'Ba, bà, bá, bả, bã, bạ. Sáu tiếng cùng chữ, chỉ khác thanh điệu.', question: 'Tiếng nào có dấu huyền?', choices: ['bà', 'bá', 'ba'], blank: ['Bé thương __ nội.', 'bà', 'bá', 'bã'], order: ['b', 'à'], speak: 'Bé đọc chậm sáu tiếng: ba, bà, bá, bả, bã, bạ.' },
  { title: 'Đồng dao cùng Lí Lắc', words: [['đồng dao', 'Bài đọc có vần dành cho trẻ em'], ['nhịp', 'Cách đọc đều đặn theo phách']], reading: 'Lí Lắc đọc đồng dao: Nu na nu nống. Bé đọc theo và vỗ tay đúng nhịp.', question: 'Bé làm gì khi đọc đồng dao cùng Lí Lắc?', choices: ['Đọc theo và vỗ tay đúng nhịp', 'Chạy ra ngoài', 'Nằm ngủ'], blank: ['Bé vỗ tay theo __.', 'nhịp', 'nhà', 'nhớ'], order: ['Nu', 'na', 'nu', 'nống'], speak: 'Bé đọc một câu đồng dao bé thuộc.' },

  // ---- Chặng 3: Ghép tiếng, đọc từ ---------------------------------------
  { title: 'Ghép chữ thành tiếng', words: [['ghép', 'Đặt các phần lại với nhau'], ['ch', 'Hai chữ đi liền nhau thành một âm đầu']], reading: 'b ghép với a thành ba. m ghép với e thành me. c ghép với a thành ca.', question: 'Chữ b ghép với chữ a thành tiếng gì?', choices: ['ba', 'me', 'ca'], blank: ['m ghép với e thành __.', 'me', 'ma', 'mo'], order: ['b', 'a'], speak: 'Bé ghép rồi đọc to: ba, me, ca.' },
  { title: 'Ghép tiếng thành từ', words: [['con cá', 'Cụm từ gọi một con cá'], ['cái bàn', 'Cụm từ gọi một chiếc bàn']], reading: 'Con cá bơi dưới ao. Cái bàn kê bên cửa sổ.', question: 'Cụm từ nào gọi con vật bơi dưới nước?', choices: ['Con cá', 'Cái bàn', 'Mẹ bé'], blank: ['Con __ đang bơi.', 'cá', 'bàn', 'bút'], order: ['Con', 'cá', 'đang', 'bơi'], speak: 'Bé đọc hai cụm từ: con cá, cái bàn.' },
  { title: 'Chữ nào đang trốn?', words: [['trốn', 'Nấp đi để người khác không thấy'], ['thiếu', 'Không đủ, còn khuyết một phần']], reading: 'Một chữ đang trốn trong từ. Tìm chữ ấy thì từ đầy đủ trở lại: _á là cá, _ẹ là mẹ.', question: 'Chữ nào đang trốn trong _á để thành cá?', choices: ['c', 'b', 'm'], blank: ['__ẹ', 'm', 'b', 'c'], order: ['c', 'á'], speak: 'Bé đọc hai từ vừa tìm được: cá, mẹ.' },
  { title: 'Đọc cùng Lí Lắc', words: [['đọc', 'Nhìn chữ rồi phát ra thành tiếng'], ['câu', 'Chuỗi từ nói trọn một ý']], reading: 'Bé đang đọc sách. Mẹ đang nấu cơm.', question: 'Mẹ đang làm gì?', choices: ['Nấu cơm', 'Đọc sách', 'Quét sân'], blank: ['Bé đang __ sách.', 'đọc', 'nấu', 'chạy'], order: ['Bé', 'đang', 'đọc', 'sách'], speak: 'Bé đọc to hai câu cùng Lí Lắc rồi thu âm lại.' },

  // ---- Chặng 4: Nói và kể chuyện -----------------------------------------
  { title: 'Ai đang làm gì?', words: [['nấu', 'Làm chín thức ăn bằng lửa'], ['uống', 'Đưa nước vào miệng']], reading: 'Bé đọc sách. Mẹ nấu cơm. Bố uống nước.', question: 'Ai đang nấu cơm?', choices: ['Mẹ', 'Bé', 'Bố'], blank: ['Bố __ nước.', 'uống', 'đọc', 'nấu'], order: ['Mẹ', 'nấu', 'cơm'], speak: 'Bé nói ba câu theo mẫu: ai đang làm gì.' },
  { title: 'Nhìn tranh kể chuyện', words: [['thức dậy', 'Tỉnh giấc và rời giường'], ['đầu tiên', 'Việc xảy ra trước nhất']], reading: 'Bé thức dậy, đánh răng, ăn sáng rồi đi học.', question: 'Việc gì xảy ra đầu tiên?', choices: ['Thức dậy', 'Đi học', 'Ăn sáng'], blank: ['__ tiên bé thức dậy.', 'Đầu', 'Sau', 'Cuối'], order: ['Thức dậy', 'Đánh răng', 'Ăn sáng', 'Đi học'], speak: 'Bé kể lại buổi sáng của mình, dùng ba từ nối: đầu tiên, sau đó, cuối cùng.' },
  { title: 'Sự tích Bánh Chưng, Bánh Giầy', words: [['bánh chưng', 'Bánh vuông gói lá dong, làm từ gạo nếp'], ['bánh giầy', 'Bánh tròn màu trắng, làm từ gạo nếp giã nhuyễn']], reading: 'Lang Liêu làm bánh chưng vuông và bánh giầy tròn dâng vua cha. Vua chọn bánh của chàng.', question: 'Ai làm bánh chưng và bánh giầy?', choices: ['Lang Liêu', 'Thạch Sanh', 'Chú Cuội'], blank: ['Bánh chưng có hình __.', 'vuông', 'tròn', 'dài'], order: ['Lang Liêu', 'làm', 'bánh'], speak: 'Bé kể lại chuyện Lang Liêu bằng vài câu ngắn.' },
  { title: 'Nhập vai nhân vật', words: [['nhập vai', 'Đóng làm một nhân vật'], ['giới thiệu', 'Nói cho người khác biết về mình']], reading: 'Lí Lắc hỏi: Con tên là gì? Bé đáp: Con tên là Khánh. Con thích đọc truyện.', question: 'Khi được hỏi tên, bé nên trả lời thế nào?', choices: ['Con tên là…', 'Không nói gì', 'Hỏi lại ngay'], blank: ['Con __ là Khánh.', 'tên', 'thích', 'đọc'], order: ['Con', 'tên', 'là', 'Khánh'], speak: 'Bé tự giới thiệu: tên bé là gì và bé thích làm gì.' },

  // ---- Chặng 5: Đọc hiểu và vận dụng -------------------------------------
  { title: 'Đọc và tìm thông tin', words: [['chợ', 'Nơi mọi người mua và bán'], ['nhìn thấy', 'Trông thấy bằng mắt']], reading: 'Sáng nay, bé Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo nhỏ bên cửa hàng.', question: 'Lan đi đâu?', choices: ['Đi chợ', 'Đi học', 'Đi bơi'], blank: ['Lan đi cùng __.', 'mẹ', 'bố', 'bạn'], order: ['Lan', 'đi', 'chợ'], speak: 'Bé đọc đoạn văn rồi nói Lan nhìn thấy con gì.' },
  { title: 'Đọc và hoàn thành câu', words: [['hoàn thành', 'Làm cho đầy đủ, cho xong'], ['đang', 'Đang làm việc gì đó ngay lúc này']], reading: 'Bé uống nước. Mẹ đang nấu cơm. Bé đang đọc sách.', question: 'Bé uống gì?', choices: ['Nước', 'Sách', 'Chạy'], blank: ['Mẹ đang __ cơm.', 'nấu', 'đọc', 'chạy'], order: ['Bé', 'đang', 'đọc', 'sách'], speak: 'Bé đọc câu Bé đang đọc sách rồi tự đặt một câu tương tự.' },
  { title: 'Câu đố dân gian', words: [['câu đố', 'Câu hỏi vui để đoán ra một vật'], ['dân gian', 'Do người xưa truyền lại']], reading: 'Lí Lắc đố: Con gì kêu meo meo? Bé nghĩ một lát rồi đoán.', question: 'Con gì kêu meo meo?', choices: ['Mèo', 'Chó', 'Gà'], blank: ['Con mèo kêu __.', 'meo meo', 'gâu gâu', 'ò ó o'], order: ['Con', 'gì', 'kêu', 'meo', 'meo'], speak: 'Bé đọc một câu đố bé biết rồi mời người khác đoán.' },
  { title: 'Báu vật Nước Nam', words: [['báu vật', 'Vật quý được giữ gìn'], ['thử thách', 'Việc khó cần vượt qua']], reading: 'Bé vượt năm thử thách: nghe, âm, đọc, nói và vận dụng. Vượt xong, Báu vật Nước Nam hiện ra.', question: 'Bé phải vượt qua mấy thử thách?', choices: ['Năm', 'Hai', 'Mười'], blank: ['Bé vượt __ thử thách.', 'năm', 'ba', 'bảy'], order: ['Nghe', 'Âm', 'Đọc', 'Nói', 'Vận dụng'], speak: 'Bé kể lại thử thách bé thích nhất và nói vì sao.' },
];

export const lessons = exercises.map((exercise, index) => {
  const order = index + 1;
  const choice = (type: 'listen_choose' | 'review', prompt: string, choices: string[]): IActivity => ({ id: '', type, prompt, options: choices.map((text, i) => ({ id: `option-${i}`, text })), correctAnswer: 'option-0', audioUrl: '' });
  const reading: IActivity = { id: '', type: 'word_card', prompt: 'Cùng đọc và tìm hiểu.', targetWord: exercise.reading, audioUrl: '' };
  const listen = choice('listen_choose', `Nghe đoạn đọc: ${exercise.reading} ${exercise.question}`, exercise.choices);
  const match: IActivity = { id: '', type: 'drag_match', prompt: 'Nối từ với lời giải thích.', pairs: exercise.words.map(([left, right]) => ({ left, right })) };
  const fill: IActivity = { id: '', type: 'fill_blank', prompt: 'Chọn phần còn thiếu.', blanks: [{ sentence: exercise.blank[0], missing: exercise.blank[1] }], options: exercise.blank.slice(1).map((text, i) => ({ id: `part-${i}`, text })), correctAnswer: exercise.blank[1] };
  const sort: IActivity = { id: '', type: 'sort_order', prompt: `Xếp để đọc: ${exercise.order.join(' ')}.`, orderedItems: exercise.order, correctAnswer: exercise.order };
  const speak: IActivity = { id: '', type: 'record_voice', prompt: exercise.speak, targetWord: exercise.reading, audioUrl: '' };
  const review = choice('review', exercise.question, exercise.choices);
  // Bài 20 là nhiệm vụ tổng kết "Báu vật Nước Nam": tài liệu mô tả đúng năm thử thách
  // (nghe, âm, đọc, nói, vận dụng), nên bỏ thẻ từ mở đầu để còn đúng năm hoạt động.
  const activities = order === 20 ? [listen, fill, sort, speak, review] : [reading, listen, index % 2 ? match : fill, sort, speak, review];
  activities.forEach((activity, i) => { activity.id = `act-${order}-${i + 1}`; });
  return { stageOrder: Math.floor(index / 4) + 1, order, title: `Bài ${order}: ${exercise.title}`, description: `Bài mẫu biên soạn cho trẻ 5–8 tuổi. ${exercise.reading}`, vocabulary: exercise.words.map(([word, meaning]) => ({ word, meaning, audioUrl: '' })), freeInStarterPlan: index < 4, totalActivities: activities.length, activities };
});

const storyReadings = [
  ['Trồng nụ trồng hoa', 'Bé ngắm nụ hoa nhỏ. Bé tưới nhẹ quanh gốc và chờ hoa nở.', 'nụ', 'hoa'],
  ['Rồng rắn lên mây', 'Các bạn xếp thành hàng. Cả nhóm cùng bước chậm và giữ khoảng cách an toàn.', 'hàng', 'bạn'],
  ['Hai bàn tay', 'Hai bàn tay bé rửa thật sạch. Bé dùng tay mở sách và giúp xếp đồ chơi.', 'tay', 'sạch'],
  ['Dung dăng dung dẻ', 'Bé cùng bạn đi dạo. Cả nhóm nhìn hoa bên đường và chào người quen.', 'đi dạo', 'chào'],
  ['Nu na nu nống', 'Các bạn ngồi thành vòng. Bé nghe nhịp đọc rồi chờ đến lượt mình.', 'vòng', 'nhịp'],
  ['Lộn cầu vồng', 'Bé nhìn cầu vồng sau mưa. Những dải màu nối nhau trên bầu trời.', 'cầu vồng', 'màu'],
  ['Cái ngủ mày ngủ cho lâu', 'Đêm đã đến. Bé cất đồ chơi, nghe lời ru và nằm nghỉ bên người thân.', 'ngủ', 'đêm'],
  ['Gánh gánh gồng gồng', 'Bé thấy đôi quang gánh trong tranh. Hai đầu gánh cần cân bằng khi mang đồ.', 'gánh', 'cân bằng'],
  ['Con công hay múa', 'Bé xem tranh con công. Chiếc đuôi xòe rộng có nhiều màu đẹp.', 'công', 'đuôi'],
  ['Rềnh rềnh ràng ràng', 'Bé vỗ tay theo nhịp chậm. Bạn đáp lại bằng một nhịp vỗ đều.', 'vỗ tay', 'đều'],
  ['Con cua mà có hai càng', 'Cua bò bên bờ nước. Bé quan sát từ xa, không đưa tay chạm vào càng cua.', 'cua', 'càng'],
  ['Lúa ngô là cô đậu nành', 'Bé ngắm lúa, ngô và đậu trong tranh. Mỗi cây cho một loại hạt khác nhau.', 'lúa', 'ngô'],
  ['Kéo cưa lừa xẻ', 'Hai bạn ngồi đối diện và cùng đếm nhịp. Các bạn chơi nhẹ nhàng, không kéo mạnh.', 'kéo', 'nhẹ'],
  ['Chi chi chành chành', 'Bé nghe một nhịp đọc vui. Bé và bạn thống nhất luật trước khi chơi.', 'luật', 'chơi'],
  ['Ông sảo ông sao', 'Trời tối, bé tìm sao qua cửa sổ. Những chấm sáng ở xa làm bé tò mò.', 'sao', 'sáng'],
  ['Ông giẳng ông giăng', 'Bé nhìn trăng trên cao. Có đêm trăng tròn, có đêm chỉ thấy một phần.', 'trăng', 'tròn'],
  ['Chú Cuội ngồi gốc cây đa', 'Bé nhìn tranh cây đa và vầng trăng. Bé tưởng tượng một chuyến đi thăm bầu trời.', 'cây đa', 'tưởng tượng'],
  ['Bà còng đi chợ trời mưa', 'Bé thấy người lớn chuẩn bị áo mưa. Đường ướt, mọi người đi chậm để tránh trượt.', 'mưa', 'chậm'],
  ['Cái bống là cái bống bang', 'Bé phụ người thân xếp rau vào rổ. Một việc nhỏ cũng làm cả nhà vui.', 'rổ', 'giúp'],
  ['Thằng Bờm có cái quạt mo', 'Bé xem chiếc quạt làm từ mo cau. Bé hỏi người thân cách người xưa dùng quạt.', 'quạt', 'mo cau'],
  ['Nhạc rừng', 'Bé lắng nghe tiếng lá và tiếng chim. Bé giữ yên lặng để nghe thiên nhiên rõ hơn.', 'lá', 'lắng nghe'],
];

export const stories = storyReadings.map(([title, reading, ...vocab], index) => ({
  seedKey: `story-${String(index + 1).padStart(2, '0')}`,
  title, type: (title === 'Nhạc rừng' ? 'tho' : 'dong_dao') as 'tho' | 'dong_dao',
  description: 'Bài đọc minh họa do Vietverse biên soạn theo chủ đề nhan đề; không phải nguyên tác, lời đồng dao hoặc lời bài hát. Chờ biên tập xác minh văn bản, thể loại, tác giả và bản quyền trước khi phát hành tác phẩm. Chưa có audio thu âm.',
  author: 'Vietverse — bài đọc minh họa', lyrics: [{ timeSec: 0, text: reading }], audioUrl: '', durationSec: 0, ageGroups: ['5-6', '6-8'], vocab, quiz: [],
}));

const cultureCategoryKeys: Record<string, string> = {
  tet: 'tet', food: 'am_thuc', clothing: 'trang_phuc', customs: 'phong_tuc',
  festivals: 'le_hoi', objects_symbols: 'vat_dung', nature: 'thien_nhien', folk_games: 'tro_choi_dan_gian',
};
export const culture = [
  { category: 'tet', title: 'Tết và lời chúc đầu năm', intro: 'Tết là dịp nhiều gia đình sum họp và chúc nhau điều tốt lành.', funFacts: ['Nhiều gia đình dọn nhà trước Tết.', 'Bánh chưng và bánh tét là những món ăn quen thuộc vào dịp Tết.', 'Bé có thể chúc người thân mạnh khỏe và vui vẻ.'], question: 'Bé có thể chúc ông bà điều gì?', options: ['Mạnh khỏe, vui vẻ', 'Luôn mệt mỏi', 'Làm rơi đồ chơi'] },
  { category: 'food', title: 'Món ăn từ hạt gạo', intro: 'Từ hạt gạo, người Việt làm được nhiều món ăn khác nhau.', funFacts: ['Cơm được nấu từ gạo và nước.', 'Gạo có thể xay thành bột để làm bánh.', 'Phở thường có bánh phở, nước dùng và nhiều loại nguyên liệu tùy cách nấu.'], question: 'Cơm được nấu từ gì?', options: ['Gạo', 'Cát', 'Sỏi'] },
  { category: 'clothing', title: 'Áo dài và trang phục Việt', intro: 'Bé khám phá một trang phục quen thuộc trong nhiều dịp lễ.', funFacts: ['Áo dài thường có hai tà áo.', 'Áo dài được mặc cùng quần dài.', 'Các cộng đồng ở Việt Nam có nhiều trang phục truyền thống khác nhau.'], question: 'Áo dài thường có mấy tà?', options: ['Hai tà', 'Không có tà', 'Mười tà'] },
  { category: 'customs', title: 'Lời chào trong gia đình', intro: 'Lời chào giúp bé thể hiện sự quan tâm và kính trọng.', funFacts: ['Bé có thể chào người thân khi đi học về.', 'Nhiều gia đình mời nhau trước bữa ăn.', 'Cảm ơn khi được giúp là một cách nói lịch sự.'], question: 'Khi được giúp, bé nói gì?', options: ['Cảm ơn', 'Đi đi', 'Không cần nói gì'] },
  { category: 'festivals', title: 'Đêm hội Trung thu', intro: 'Trung thu là dịp nhiều bạn nhỏ vui chơi cùng gia đình.', funFacts: ['Tết Trung thu vào ngày rằm tháng tám âm lịch.', 'Một số nơi tổ chức rước đèn và múa lân.', 'Đèn ông sao thường có năm cánh.'], question: 'Đồ vật nào thường được mang đi rước đèn?', options: ['Đèn ông sao', 'Nồi cơm', 'Chổi quét nhà'] },
  { category: 'objects_symbols', title: 'Nón lá và trống đồng', intro: 'Đồ vật và hình ảnh giúp bé tìm hiểu đời sống, lịch sử Việt Nam.', funFacts: ['Nón lá có thể che nắng và mưa nhẹ.', 'Trống đồng là hiện vật gắn với các nền văn hóa cổ, trong đó có Đông Sơn.', 'Trên nhiều mặt trống đồng có hoa văn hình người và chim.'], question: 'Vật nào thường dùng để đội che nắng?', options: ['Nón lá', 'Trống đồng', 'Cái bát'] },
  { category: 'nature', title: 'Thiên nhiên Việt Nam', intro: 'Việt Nam có núi, đồng bằng, sông và biển với nhiều cảnh quan.', funFacts: ['Ruộng lúa có thể thấy ở nhiều vùng đồng bằng.', 'Rừng là nơi sống của nhiều loài cây và động vật.', 'Không xả rác giúp bảo vệ sông, biển và nơi bé sống.'], question: 'Bé làm gì để giữ thiên nhiên sạch?', options: ['Bỏ rác đúng chỗ', 'Ném rác xuống sông', 'Bẻ cành cây'] },
  { category: 'folk_games', title: 'Cùng chơi trò dân gian', intro: 'Trò chơi dân gian giúp bé vận động và hợp tác với bạn.', funFacts: ['Ô ăn quan thường dùng các ô vẽ và những viên sỏi nhỏ.', 'Rồng rắn lên mây là trò chơi theo nhóm.', 'Chọn chỗ chơi an toàn và thống nhất luật trước khi bắt đầu.'], question: 'Trước khi chơi cùng nhóm, bé nên làm gì?', options: ['Thống nhất luật và chọn chỗ an toàn', 'Đẩy bạn ra', 'Chạy ra lòng đường'] },
].map(({ question, options, ...article }) => ({ ...article, seedKey: `culture-${cultureCategoryKeys[article.category]}`, category: cultureCategoryKeys[article.category], audioUrl: '', tags: ['Bài mẫu biên soạn'], quiz: [{ question, options, correctAnswer: 0, explanation: options[0] }] }));

const emojiAsset = (emoji: string, background: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="${background}"/><text x="40" y="54" font-size="40" text-anchor="middle">${emoji}</text></svg>`)}`;
const SAMPLE_NOTE = 'Vật phẩm mẫu; quà hiện vật chỉ mở khi vận hành xác nhận tồn kho và giao hàng.';
const STAR_ASSET = emojiAsset('🌟', '#FFF3C4');

// Seed is insert-only by name: existing items (and their categories) are never rewritten here;
// legacy rows get a category through `npm run migrate:shop-category -w server`.
interface SeedShopItem { name: string; type: 'virtual' | 'physical'; category?: 'badge' | 'avatar' | 'profile_decoration' | 'collectible'; costPoints: number; badgeCode?: string; stock?: number; description?: string; assetUrl?: string }
const legacyShopItems: SeedShopItem[] = [
  { name: 'Huy hiệu Sao Sáng Lí Lắc', type: 'virtual', category: 'badge', costPoints: 20, badgeCode: 'badge_star_lilac' },
  { name: 'Nón Lá Tí Hon cho Mascot', type: 'virtual', category: 'collectible', costPoints: 35, badgeCode: 'item_non_la_mascot' },
  { name: 'Áo Dài Gấm Mini cho Vivi', type: 'virtual', category: 'collectible', costPoints: 50, badgeCode: 'item_ao_dai_mini' },
  { name: 'Bộ Sticker Bảng Chữ Cái Vietverse', type: 'physical', costPoints: 80, stock: 0 },
  { name: 'Truyện Tranh Tích Xưa Nước Nam', type: 'physical', costPoints: 150, stock: 0 },
];
const categoryShopItems: SeedShopItem[] = [
  { name: 'Avatar Bé Mèo Tam Thể', type: 'virtual', category: 'avatar', costPoints: 30, description: 'Ảnh đại diện mèo tam thể cho hồ sơ của bé.', assetUrl: emojiAsset('🐱', '#FFE0B2') },
  { name: 'Avatar Chú Trâu Vàng', type: 'virtual', category: 'avatar', costPoints: 40, description: 'Ảnh đại diện chú trâu chăm chỉ của làng quê.', assetUrl: emojiAsset('🐃', '#FFF3C4') },
  { name: 'Khung Hoa Sen', type: 'virtual', category: 'profile_decoration', costPoints: 45, description: 'Khung hoa sen hồng bao quanh ảnh đại diện.', assetUrl: emojiAsset('🪷', '#FCE4EC') },
  { name: 'Khung Đèn Ông Sao', type: 'virtual', category: 'profile_decoration', costPoints: 60, description: 'Khung đèn ông sao rực rỡ mùa Trung thu.', assetUrl: emojiAsset('⭐', '#FFF8E1') },
];
export const shopItems = [
  ...legacyShopItems.map((item) => ({ ...item, active: item.type === 'virtual', assetUrl: STAR_ASSET, description: SAMPLE_NOTE })),
  ...categoryShopItems.map((item) => ({ ...item, active: true })),
];
