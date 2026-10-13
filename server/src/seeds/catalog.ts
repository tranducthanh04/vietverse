import type { IActivity } from '../models/Lesson.js';

// Original editorial exercises; production voice recordings require content-team review.
export const stages = [
  ['khu-rung-chu-cai', 'Làm quen tiếng Việt', 'Chào hỏi, gia đình, đồ vật và thiên nhiên quanh bé.'],
  ['dong-song-ghep-van', 'Âm, chữ, thanh và vần', 'Nhận biết chữ cái, phân biệt thanh và ghép vần đơn giản.'],
  ['canh-dong-tu-ngu', 'Ghép tiếng và tập đọc', 'Ghép tiếng, đọc từ và câu ngắn có nghĩa.'],
  ['ngoi-lang-cau-chuyen', 'Nói và kể chuyện', 'Nói lời lịch sự, tả sự vật và kể chuyện theo trình tự.'],
  ['vuong-quoc-bau-vat', 'Hiểu và vận dụng', 'Đọc hiểu, lựa chọn hành động và vận dụng tiếng Việt.'],
].map(([slug, title, goal], index) => ({ order: index + 1, slug, title: `Chặng ${index + 1}: ${title}`, goal, description: goal, status: 'active' as const }));

type Exercise = { title: string; words: [string, string][]; reading: string; question: string; choices: [string, string, string]; blank: [string, string, string, string]; order: string[]; speak: string };
const exercises: Exercise[] = [
  { title: 'Xin chào, bạn mới!', words: [['chào', 'Lời nói khi gặp nhau'], ['bạn', 'Người cùng học, cùng chơi']], reading: 'An gặp bạn mới. An nói: Xin chào bạn!', question: 'An nói gì khi gặp bạn?', choices: ['Xin chào bạn!', 'Tạm biệt!', 'Chúc ngủ ngon!'], blank: ['Xin __ bạn!', 'chào', 'ngủ', 'ăn'], order: ['Xin', 'chào', 'bạn'], speak: 'Bé chào một người bạn và nói tên của mình.' },
  { title: 'Gia đình của bé', words: [['mẹ', 'Người thân chăm sóc bé'], ['bà', 'Người thân thuộc thế hệ trước bố mẹ']], reading: 'Bà kể chuyện. Bé ngồi bên bà và lắng nghe.', question: 'Ai kể chuyện cho bé?', choices: ['Bà', 'Con mèo', 'Cây bàng'], blank: ['Bé yêu __.', 'bà', 'bàn', 'bát'], order: ['Bé', 'yêu', 'bà'], speak: 'Bé nói một câu yêu thương với người thân.' },
  { title: 'Góc nhỏ gọn gàng', words: [['bàn', 'Đồ dùng để ngồi học'], ['sách', 'Có trang để đọc']], reading: 'Bé đặt sách lên bàn. Góc học tập thật gọn.', question: 'Bé đặt sách ở đâu?', choices: ['Trên bàn', 'Dưới ao', 'Trên cây'], blank: ['Bé đọc __.', 'sách', 'cát', 'lá'], order: ['Bé', 'đọc', 'sách'], speak: 'Bé gọi tên hai đồ dùng trong góc học tập.' },
  { title: 'Khu vườn buổi sáng', words: [['hoa', 'Phần nhiều màu của cây'], ['chim', 'Con vật có cánh và lông vũ']], reading: 'Nắng lên. Chim hót bên khóm hoa.', question: 'Con vật nào hót trong vườn?', choices: ['Chim', 'Cá', 'Cua'], blank: ['__ hót trong vườn.', 'Chim', 'Cá', 'Cua'], order: ['Chim', 'hót', 'vui'], speak: 'Bé kể một điều bé nhìn thấy ngoài thiên nhiên.' },
  { title: 'Âm a và chữ a', words: [['a', 'Chữ a trong tiếng ba'], ['ba', 'Một cách gọi bố']], reading: 'Ba và An ra sân. Tiếng ba có âm a.', question: 'Tiếng nào có âm a?', choices: ['ba', 'bé', 'bò'], blank: ['b__', 'a', 'e', 'o'], order: ['b', 'a'], speak: 'Bé đọc: a, ba.' },
  { title: 'Chữ b, chữ m', words: [['b', 'Chữ đầu của tiếng ba'], ['m', 'Chữ đầu của tiếng mẹ']], reading: 'Bé mời mẹ ăn. Tiếng mẹ bắt đầu bằng chữ m.', question: 'Chữ nào đứng đầu tiếng mẹ?', choices: ['m', 'b', 'c'], blank: ['__ẹ', 'm', 'b', 'c'], order: ['m', 'ẹ'], speak: 'Bé đọc chậm: ba, mẹ.' },
  { title: 'Thanh điệu đổi tiếng', words: [['ma', 'Tiếng không có dấu thanh'], ['má', 'Tiếng có dấu sắc, cũng là cách gọi mẹ']], reading: 'Ma, má, mà, mả, mã, mạ: cùng m và a, khác thanh điệu.', question: 'Tiếng nào có dấu sắc?', choices: ['má', 'mà', 'mạ'], blank: ['Bé gọi mẹ là __.', 'má', 'mả', 'mã'], order: ['m', 'á'], speak: 'Bé đọc chậm: ma, má, mà, mả, mã, mạ.' },
  { title: 'Vần an và em', words: [['an', 'Vần trong tiếng bàn'], ['em', 'Vần trong tiếng kem']], reading: 'An có em. Em thích ăn kem.', question: 'Tiếng nào có vần em?', choices: ['kem', 'bàn', 'cá'], blank: ['k__', 'em', 'an', 'on'], order: ['k', 'em'], speak: 'Bé đọc hai tiếng: bàn, kem.' },
  { title: 'Ghép tiếng cá', words: [['cá', 'Con vật sống dưới nước'], ['ca', 'Đồ dùng đựng nước']], reading: 'Bé thấy cá bơi. Cá quẫy đuôi dưới nước.', question: 'Cá sống ở đâu?', choices: ['Dưới nước', 'Trong tổ chim', 'Trên bàn'], blank: ['Con __ bơi.', 'cá', 'gà', 'mèo'], order: ['c', 'á'], speak: 'Bé đọc: Con cá bơi.' },
  { title: 'Đọc từ trong vườn', words: [['lá', 'Phần thường có màu xanh của cây'], ['nụ', 'Hoa còn chưa nở']], reading: 'Cây có lá xanh. Bên lá có một nụ hoa.', question: 'Hoa chưa nở được gọi là gì?', choices: ['Nụ', 'Quả', 'Rễ'], blank: ['__ xanh trên cành.', 'Lá', 'Cá', 'Đá'], order: ['Lá', 'xanh'], speak: 'Bé đọc: Cây có lá xanh.' },
  { title: 'Đọc câu về bữa cơm', words: [['cơm', 'Món ăn nấu từ gạo'], ['mời', 'Nói lịch sự trước khi cùng ăn']], reading: 'Bé rửa tay. Bé mời cả nhà ăn cơm.', question: 'Bé làm gì trước khi ăn?', choices: ['Rửa tay', 'Nghịch đất', 'Giấu bát'], blank: ['Bé __ cả nhà ăn cơm.', 'mời', 'ném', 'giấu'], order: ['Bé', 'ăn', 'cơm'], speak: 'Bé đọc: Bé mời cả nhà ăn cơm.' },
  { title: 'Đọc chuyện bạn mèo', words: [['mèo', 'Con vật thường kêu meo meo'], ['ngủ', 'Nghỉ ngơi và nhắm mắt']], reading: 'Mèo nằm bên cửa. Nắng ấm làm mèo ngủ ngon.', question: 'Mèo nằm ở đâu?', choices: ['Bên cửa', 'Dưới ao', 'Trong cặp'], blank: ['Mèo __ ngon.', 'ngủ', 'bơi', 'bay'], order: ['Mèo', 'ngủ', 'ngon'], speak: 'Bé đọc hai câu về bạn mèo.' },
  { title: 'Lời mời cùng chơi', words: [['mời', 'Rủ ai đó một cách lịch sự'], ['lượt', 'Phần đến phiên một người']], reading: 'An rủ Bình cùng chơi. Hai bạn chờ đến lượt của mình.', question: 'Khi bạn đang chơi, An nên làm gì?', choices: ['Chờ đến lượt', 'Chen lên', 'Giành đồ chơi'], blank: ['Mình __ bạn cùng chơi.', 'mời', 'đẩy', 'giấu'], order: ['Mời', 'bạn', 'chơi'], speak: 'Bé nói một lời mời bạn cùng chơi và nhắc cách chờ lượt.' },
  { title: 'Kể về người thân', words: [['kể', 'Nói để người khác biết một việc'], ['giúp', 'Cùng làm để người khác đỡ vất vả']], reading: 'Ông tưới cây. Bé giúp ông lấy chiếc ca nhỏ.', question: 'Bé giúp ông lấy gì?', choices: ['Chiếc ca', 'Chiếc thuyền', 'Chiếc trống'], blank: ['Bé __ ông tưới cây.', 'giúp', 'quên', 'giấu'], order: ['Ông', 'tưới', 'cây'], speak: 'Bé kể hai câu: người thân của bé là ai và bé cùng người ấy làm gì.' },
  { title: 'Kể theo trình tự', words: [['trước', 'Việc xảy ra đầu tiên'], ['sau', 'Việc xảy ra tiếp theo']], reading: 'Mai gieo hạt. Mai tưới nước. Một mầm xanh nhú lên.', question: 'Mai làm gì đầu tiên?', choices: ['Gieo hạt', 'Hái quả', 'Ngắt hoa'], blank: ['Mai tưới __ cho cây.', 'nước', 'muối', 'cát'], order: ['Gieo', 'Tưới', 'Nảy mầm'], speak: 'Bé kể lại ba việc bằng các từ: đầu tiên, tiếp theo, cuối cùng.' },
  { title: 'Kể chuyện sẻ nhỏ', words: [['sẻ', 'Một loài chim nhỏ'], ['chia sẻ', 'Cho người khác cùng dùng hoặc cùng vui']], reading: 'Sẻ tìm được hạt thóc. Sẻ gọi bạn đến cùng ăn. Hai bạn ríu rít vui vẻ.', question: 'Sẻ làm gì khi tìm được thóc?', choices: ['Gọi bạn cùng ăn', 'Đuổi bạn đi', 'Giấu hết thóc'], blank: ['Sẻ gọi __ cùng ăn.', 'bạn', 'đá', 'mưa'], order: ['Tìm thóc', 'Gọi bạn', 'Cùng ăn'], speak: 'Bé kể lại chuyện sẻ nhỏ và nói điều bé thích ở sẻ.' },
  { title: 'Hiểu lời nhắc', words: [['nhẹ', 'Không mạnh, không gây ồn'], ['thư viện', 'Nơi có sách để đọc hoặc mượn']], reading: 'Trong thư viện, Lan nói nhỏ và lật sách nhẹ. Bạn bên cạnh vẫn đọc được yên tĩnh.', question: 'Vì sao Lan nói nhỏ?', choices: ['Để mọi người đọc yên tĩnh', 'Để sách bay đi', 'Để làm ồn hơn'], blank: ['Bé lật sách __.', 'nhẹ', 'rách', 'mạnh'], order: ['Bé', 'nói', 'nhỏ'], speak: 'Bé nói một lời nhắc lịch sự khi cùng bạn đọc sách.' },
  { title: 'Cùng giữ sân sạch', words: [['sạch', 'Không có rác hoặc vết bẩn'], ['thùng rác', 'Nơi bỏ rác đúng chỗ']], reading: 'Nam ăn chuối ở sân. Nam bỏ vỏ chuối vào thùng rác để không ai trượt chân.', question: 'Nam nên bỏ vỏ chuối ở đâu?', choices: ['Trong thùng rác', 'Giữa lối đi', 'Dưới ghế'], blank: ['Bỏ rác __ chỗ.', 'đúng', 'sai', 'lung'], order: ['Sân', 'sạch', 'đẹp'], speak: 'Bé giải thích vì sao cần bỏ rác đúng chỗ.' },
  { title: 'Lời cảm ơn và xin lỗi', words: [['cảm ơn', 'Lời nói khi nhận được sự giúp đỡ'], ['xin lỗi', 'Lời nói khi làm điều gây phiền cho người khác']], reading: 'Hà làm rơi bút. Bình nhặt giúp. Hà cảm ơn Bình.', question: 'Hà nên nói gì với Bình?', choices: ['Cảm ơn bạn!', 'Tránh ra!', 'Đưa ngay!'], blank: ['Mình __ bạn đã giúp.', 'cảm ơn', 'giấu', 'quên'], order: ['Cảm', 'ơn', 'bạn'], speak: 'Bé nói lời cảm ơn khi được giúp và lời xin lỗi khi lỡ va vào bạn.' },
  { title: 'Báu vật tiếng Việt', words: [['hạt', 'Có thể nảy thành cây khi đủ điều kiện'], ['chăm sóc', 'Quan tâm và làm việc giúp cây hoặc người khỏe hơn']], reading: 'Bé gieo hạt, tưới nước và chờ mầm xanh. Bé nhờ bạn cùng chăm cây.', question: 'Làm gì để cùng chăm cây tốt hơn?', choices: ['Chia nhau tưới vừa đủ nước', 'Giẫm lên mầm', 'Bẻ hết lá'], blank: ['Tiếng má có dấu __.', 'sắc', 'huyền', 'nặng'], order: ['Bé', 'chăm', 'cây'], speak: 'Bé kể hai câu về một việc tốt đã làm và mời bạn cùng tham gia.' },
];

// Mở rộng chương trình: 4 bài nữa cho mỗi chặng, nối tiếp thứ tự 21–40.
// Chặng phải ghi tường minh. Bài 1–20 lấy chặng từ `Math.floor(index / 4) + 1`; nếu nối thêm
// vào cùng mảng thì bài 21 rơi vào chặng 6 — một chặng không tồn tại — và seed sẽ bỏ qua lặng
// lẽ vì nó `continue` khi không tra được stageId.
type ExtraExercise = Exercise & { stage: number };
const extraExercises: ExtraExercise[] = [
  // Chặng 1 — Làm quen tiếng Việt
  { stage: 1, title: 'Chào cô, chào bác', words: [['cô', 'Cách gọi người phụ nữ lớn tuổi hơn bé'], ['ạ', 'Tiếng thêm vào cuối câu cho lễ phép']], reading: 'Bé gặp cô giáo ở cổng. Bé khoanh tay và nói: Con chào cô ạ!', question: 'Bé nói gì khi gặp cô giáo?', choices: ['Con chào cô ạ!', 'Đi ra chỗ khác!', 'Không nói gì cả'], blank: ['Con chào cô __.', 'ạ', 'à', 'a'], order: ['Con', 'chào', 'cô'], speak: 'Bé chào một người lớn mà bé quen, nhớ thêm tiếng ạ ở cuối câu.' },
  { stage: 1, title: 'Đồ dùng trong bếp', words: [['bát', 'Đồ dùng để đựng cơm hoặc canh'], ['đũa', 'Hai que dài dùng để gắp thức ăn']], reading: 'Mẹ dọn cơm. Bé xếp bát và đũa ngay ngắn lên bàn.', question: 'Bé xếp những gì lên bàn?', choices: ['Bát và đũa', 'Giày và dép', 'Bút và vở'], blank: ['Bé xếp __ lên bàn.', 'bát', 'bóng', 'bút'], order: ['Bé', 'xếp', 'bát'], speak: 'Bé gọi tên ba đồ dùng bé thấy trong bếp nhà mình.' },
  { stage: 1, title: 'Con vật quanh nhà', words: [['gà', 'Con vật thường gáy vào buổi sáng'], ['chó', 'Con vật trông nhà, hay vẫy đuôi']], reading: 'Sáng sớm, gà gáy vang. Chó chạy ra sân đón bé.', question: 'Con vật nào gáy vào buổi sáng?', choices: ['Gà', 'Cá', 'Ốc'], blank: ['Con __ gáy sáng sớm.', 'gà', 'cá', 'cua'], order: ['Con', 'gà', 'gáy'], speak: 'Bé kể tên một con vật bé từng thấy và nói con vật ấy kêu thế nào.' },
  { stage: 1, title: 'Trời nắng trời mưa', words: [['nắng', 'Khi có ánh sáng mặt trời chiếu xuống'], ['mưa', 'Khi nước từ trên trời rơi xuống']], reading: 'Trời nắng, bé đội mũ. Trời mưa, bé mang áo mưa.', question: 'Trời mưa thì bé mang gì?', choices: ['Áo mưa', 'Quạt giấy', 'Kính râm'], blank: ['Trời nắng bé đội __.', 'mũ', 'mưa', 'mây'], order: ['Trời', 'mưa', 'rồi'], speak: 'Bé nói hôm nay trời thế nào và bé cần mang theo thứ gì.' },

  // Chặng 2 — Âm, chữ, thanh và vần
  { stage: 2, title: 'Chữ c và chữ h', words: [['c', 'Chữ đầu của tiếng cá'], ['h', 'Chữ đầu của tiếng hoa']], reading: 'Cá bơi dưới ao. Hoa nở trên bờ. Tiếng cá có chữ c, tiếng hoa có chữ h.', question: 'Chữ nào đứng đầu tiếng hoa?', choices: ['h', 'c', 'm'], blank: ['__oa', 'h', 'c', 'b'], order: ['h', 'oa'], speak: 'Bé đọc chậm hai tiếng: cá, hoa.' },
  { stage: 2, title: 'Dấu huyền và dấu nặng', words: [['bà', 'Tiếng có dấu huyền'], ['bạ', 'Tiếng có dấu nặng']], reading: 'Ba, bà, bá, bạ: cùng chữ b và a, chỉ khác dấu thanh.', question: 'Tiếng nào có dấu huyền?', choices: ['bà', 'bá', 'ba'], blank: ['Bé thương __ lắm.', 'bà', 'bá', 'bạ'], order: ['b', 'à'], speak: 'Bé đọc chậm: ba, bà, bá, bạ.' },
  { stage: 2, title: 'Vần on và ôn', words: [['on', 'Vần trong tiếng con'], ['ôn', 'Vần trong tiếng bốn']], reading: 'Con mèo có bốn chân. Tiếng con có vần on, tiếng bốn có vần ôn.', question: 'Tiếng nào có vần ôn?', choices: ['bốn', 'con', 'cá'], blank: ['b__', 'ôn', 'on', 'an'], order: ['b', 'ốn'], speak: 'Bé đọc hai tiếng: con, bốn.' },
  { stage: 2, title: 'Vần ao và eo', words: [['ao', 'Vần trong tiếng sao'], ['eo', 'Vần trong tiếng mèo']], reading: 'Mèo nằm nhìn sao. Tiếng sao có vần ao, tiếng mèo có vần eo.', question: 'Tiếng nào có vần eo?', choices: ['mèo', 'sao', 'bàn'], blank: ['m__', 'èo', 'ao', 'an'], order: ['s', 'ao'], speak: 'Bé đọc hai tiếng: sao, mèo.' },

  // Chặng 3 — Ghép tiếng và tập đọc
  { stage: 3, title: 'Ghép tiếng bà, bé', words: [['bà', 'Người thân thế hệ trước bố mẹ'], ['bé', 'Cách gọi trẻ nhỏ']], reading: 'Bà dắt bé đi chơi. Bé nắm tay bà thật chặt.', question: 'Ai dắt bé đi chơi?', choices: ['Bà', 'Mèo', 'Gà'], blank: ['__ dắt bé đi chơi.', 'Bà', 'Bàn', 'Bát'], order: ['Bà', 'dắt', 'bé'], speak: 'Bé đọc: Bà dắt bé đi chơi.' },
  { stage: 3, title: 'Đọc từ về bữa sáng', words: [['xôi', 'Món ăn nấu từ gạo nếp'], ['sữa', 'Thức uống màu trắng, thường uống buổi sáng']], reading: 'Sáng nay bé ăn xôi. Bé uống thêm một cốc sữa.', question: 'Bé uống gì vào buổi sáng?', choices: ['Sữa', 'Nước ao', 'Mực'], blank: ['Bé ăn __ buổi sáng.', 'xôi', 'xe', 'xô'], order: ['Bé', 'ăn', 'xôi'], speak: 'Bé kể bữa sáng hôm nay bé ăn gì.' },
  { stage: 3, title: 'Đọc câu ngoài sân', words: [['sân', 'Khoảng đất trống trước nhà'], ['bóng', 'Quả tròn dùng để chơi']], reading: 'Bé ra sân chơi bóng. Bé chuyền bóng cho bạn.', question: 'Bé chơi gì ngoài sân?', choices: ['Chơi bóng', 'Nấu cơm', 'Đọc báo'], blank: ['Bé chuyền __ cho bạn.', 'bóng', 'bàn', 'bát'], order: ['Bé', 'chơi', 'bóng'], speak: 'Bé đọc: Bé ra sân chơi bóng.' },
  { stage: 3, title: 'Đọc đoạn về lớp học', words: [['lớp', 'Nơi các bạn cùng học'], ['bảng', 'Tấm phẳng để cô giáo viết chữ']], reading: 'Lớp bé có bảng xanh. Cô viết chữ a lên bảng. Cả lớp cùng đọc.', question: 'Cô viết chữ gì lên bảng?', choices: ['Chữ a', 'Chữ số 9', 'Hình con cá'], blank: ['Cô viết lên __.', 'bảng', 'bàn', 'bát'], order: ['Cả', 'lớp', 'cùng', 'đọc'], speak: 'Bé kể hai câu về lớp học của bé.' },

  // Chặng 4 — Nói và kể chuyện
  { stage: 4, title: 'Hỏi đường lịch sự', words: [['làm ơn', 'Lời nói lịch sự khi nhờ ai đó'], ['chỉ', 'Cho người khác biết hướng hoặc chỗ']], reading: 'Bé muốn tìm nhà sách. Bé hỏi: Bác làm ơn chỉ giúp cháu đường tới nhà sách ạ.', question: 'Bé nên nói gì khi nhờ người lớn?', choices: ['Bác làm ơn chỉ giúp cháu ạ', 'Chỉ ngay đi', 'Không hỏi, cứ đi bừa'], blank: ['Bác __ ơn chỉ giúp cháu.', 'làm', 'lấy', 'lăn'], order: ['Bác', 'chỉ', 'giúp', 'cháu'], speak: 'Bé hỏi đường tới một nơi quen thuộc bằng lời lịch sự.' },
  { stage: 4, title: 'Tả con vật em thích', words: [['lông', 'Phần phủ ngoài thân nhiều con vật'], ['đuôi', 'Phần dài phía sau thân con vật']], reading: 'Mèo nhà bé có bộ lông vàng. Đuôi mèo dài và hay ngoe nguẩy.', question: 'Bộ lông mèo nhà bé màu gì?', choices: ['Màu vàng', 'Màu xanh lá', 'Trong suốt'], blank: ['Mèo có bộ __ vàng.', 'lông', 'lá', 'lưng'], order: ['Mèo', 'có', 'lông', 'vàng'], speak: 'Bé tả một con vật bé thích: màu gì, to hay nhỏ, kêu thế nào.' },
  { stage: 4, title: 'Kể một ngày của bé', words: [['buổi sáng', 'Khoảng thời gian đầu ngày'], ['buổi tối', 'Khoảng thời gian cuối ngày']], reading: 'Buổi sáng bé đi học. Buổi chiều bé chơi với bạn. Buổi tối bé nghe mẹ đọc truyện.', question: 'Buổi tối bé làm gì?', choices: ['Nghe mẹ đọc truyện', 'Đi học', 'Chơi bóng ngoài sân'], blank: ['__ sáng bé đi học.', 'Buổi', 'Bưởi', 'Buồn'], order: ['Sáng', 'Chiều', 'Tối'], speak: 'Bé kể ba việc trong ngày hôm nay theo thứ tự sáng, chiều, tối.' },
  { stage: 4, title: 'Kể chuyện kiến và lá', words: [['kiến', 'Con vật rất nhỏ, thường đi thành hàng'], ['trôi', 'Bị nước đưa đi']], reading: 'Kiến rơi xuống vũng nước. Một chiếc lá trôi tới. Kiến bò lên lá và vào bờ an toàn.', question: 'Nhờ đâu kiến vào được bờ?', choices: ['Nhờ chiếc lá', 'Nhờ cơn mưa', 'Nhờ hòn đá'], blank: ['Kiến bò lên chiếc __.', 'lá', 'là', 'lạ'], order: ['Kiến', 'bò', 'lên', 'lá'], speak: 'Bé kể lại chuyện con kiến và nói bé học được điều gì.' },

  // Chặng 5 — Hiểu và vận dụng
  { stage: 5, title: 'Hiểu biển báo quen thuộc', words: [['vạch', 'Đường kẻ trắng để người đi bộ qua đường'], ['đèn đỏ', 'Tín hiệu báo phải dừng lại']], reading: 'Đèn đỏ bật lên. Mọi người dừng lại. Khi đèn xanh, bé đi trên vạch cùng người lớn.', question: 'Thấy đèn đỏ thì phải làm gì?', choices: ['Dừng lại', 'Chạy thật nhanh', 'Nhắm mắt đi tiếp'], blank: ['Đèn đỏ thì phải __.', 'dừng', 'chạy', 'nhảy'], order: ['Đèn', 'đỏ', 'dừng', 'lại'], speak: 'Bé nói bé làm gì khi qua đường cùng người lớn.' },
  { stage: 5, title: 'Chọn việc an toàn', words: [['nóng', 'Có nhiệt độ cao, chạm vào sẽ bỏng'], ['nhờ', 'Xin người khác giúp một việc']], reading: 'Nồi canh còn nóng. Bé không tự bê mà nhờ người lớn giúp.', question: 'Thấy nồi canh nóng, bé nên làm gì?', choices: ['Nhờ người lớn giúp', 'Tự bê một mình', 'Thò tay vào nồi'], blank: ['Bé __ người lớn giúp.', 'nhờ', 'nhớ', 'nhà'], order: ['Bé', 'nhờ', 'người', 'lớn'], speak: 'Bé kể một việc bé cần nhờ người lớn giúp cho an toàn.' },
  { stage: 5, title: 'Giúp bạn khi bạn buồn', words: [['buồn', 'Cảm thấy không vui'], ['an ủi', 'Nói hoặc làm điều gì đó cho người khác đỡ buồn']], reading: 'Lan làm rơi hộp màu và thấy buồn. Bé tới ngồi cạnh, nhặt giúp và nói: Mình giúp bạn nhé.', question: 'Bé làm gì khi thấy bạn buồn?', choices: ['Ngồi cạnh và giúp bạn', 'Cười chê bạn', 'Bỏ đi chỗ khác'], blank: ['Mình __ bạn nhé.', 'giúp', 'giấu', 'giành'], order: ['Mình', 'giúp', 'bạn'], speak: 'Bé nói một câu an ủi khi bạn buồn.' },
  { stage: 5, title: 'Giữ lời hứa', words: [['hứa', 'Nói chắc rằng mình sẽ làm một việc'], ['trả', 'Đưa lại đồ cho người đã cho mượn']], reading: 'Bé mượn bút của bạn và hứa trả sau giờ học. Tan học, bé nhớ trả bút và nói cảm ơn.', question: 'Mượn đồ của bạn thì bé nên làm gì?', choices: ['Trả lại đúng hẹn', 'Giữ luôn không trả', 'Cho người khác mượn tiếp'], blank: ['Bé __ bút cho bạn.', 'trả', 'trèo', 'trốn'], order: ['Bé', 'trả', 'bút'], speak: 'Bé kể một lần bé đã giữ đúng lời hứa.' },
];

const buildLesson = (exercise: Exercise, order: number, stageOrder: number, variant: number, freeInStarterPlan: boolean) => {
  const choice = (type: 'listen_choose' | 'review', prompt: string, choices: string[]): IActivity => ({ id: '', type, prompt, options: choices.map((text, i) => ({ id: `option-${i}`, text })), correctAnswer: 'option-0', audioUrl: '' });
  const reading: IActivity = { id: '', type: 'word_card', prompt: 'Cùng đọc và tìm hiểu.', targetWord: exercise.reading, audioUrl: '' };
  const listen = choice('listen_choose', `Nghe đoạn đọc: ${exercise.reading} ${exercise.question}`, exercise.choices);
  const match: IActivity = { id: '', type: 'drag_match', prompt: 'Nối từ với lời giải thích.', pairs: exercise.words.map(([left, right]) => ({ left, right })) };
  const fill: IActivity = { id: '', type: 'fill_blank', prompt: 'Chọn phần còn thiếu.', blanks: [{ sentence: exercise.blank[0], missing: exercise.blank[1] }], options: exercise.blank.slice(1).map((text, i) => ({ id: `part-${i}`, text })), correctAnswer: exercise.blank[1] };
  const sort: IActivity = { id: '', type: 'sort_order', prompt: `Xếp để đọc: ${exercise.order.join(' ')}.`, orderedItems: exercise.order, correctAnswer: exercise.order };
  const speak: IActivity = { id: '', type: 'record_voice', prompt: exercise.speak, targetWord: exercise.reading, audioUrl: '' };
  const review = choice('review', exercise.question, exercise.choices);
  const activities = order === 20 ? [listen, fill, sort, speak, review] : [reading, listen, variant % 2 ? match : fill, sort, speak, review];
  activities.forEach((activity, i) => { activity.id = `act-${order}-${i + 1}`; });
  return { stageOrder, order, title: `Bài ${order}: ${exercise.title}`, description: `Bài mẫu biên soạn cho trẻ 5–8 tuổi. ${exercise.reading}`, vocabulary: exercise.words.map(([word, meaning]) => ({ word, meaning, audioUrl: '' })), freeInStarterPlan, totalActivities: activities.length, activities };
};

export const lessons = [
  ...exercises.map((exercise, index) => buildLesson(exercise, index + 1, Math.floor(index / 4) + 1, index, index < 4)),
  // Bài mở rộng không miễn phí ở gói Starter: 4 bài đầu của chặng 1 đã giữ vai trò dùng thử.
  ...extraExercises.map(({ stage, ...exercise }, index) => buildLesson(exercise, 21 + index, stage, index, false)),
];

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
const STAR_ASSET = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Ctext x="20" y="55" font-size="48"%3E★%3C/text%3E%3C/svg%3E';

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
