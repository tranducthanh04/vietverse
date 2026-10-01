import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';
import {
  User,
  Child,
  Stage,
  Lesson,
  Story,
  CultureArticle,
  ShopItem,
  Subscription,
  LessonProgress,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';

export async function runSeed() {
  logger.info('🌱 Starting Vietverse Seed...');
  await connectDB();

  // Clear existing collections for a clean idempotent start
  await Promise.all([
    User.deleteMany({}),
    Child.deleteMany({}),
    Stage.deleteMany({}),
    Lesson.deleteMany({}),
    Story.deleteMany({}),
    CultureArticle.deleteMany({}),
    ShopItem.deleteMany({}),
    Subscription.deleteMany({}),
    LessonProgress.deleteMany({}),
  ]);

  // 1. Seed 5 Stages
  const stagesData = [
    {
      order: 1,
      slug: 'khu-rung-chu-cai',
      title: 'Chặng 1: Khu rừng Chữ Cái',
      subtitle: 'Bắt đầu hành trình kỳ thú',
      goal: 'Làm quen bảng chữ cái tiếng Việt cơ bản (A, B, C...) và thanh điệu',
      description: 'Nơi các bạn nhỏ cùng Sao Lí Lắc khám phá những chữ cái đầu tiên qua tiếng chim ca và hoa cỏ.',
      status: 'active' as const,
    },
    {
      order: 2,
      slug: 'dong-song-ghep-van',
      title: 'Chặng 2: Dòng sông Ghép Vần',
      subtitle: 'Chèo thuyền xuôi dòng chữ',
      goal: 'Ghép phụ âm và nguyên âm đơn giản: ba, má, bé, cá...',
      description: 'Cùng dòng nước hiền hòa ghép từng con chữ thành những tiếng gọi yêu thương.',
      status: 'active' as const,
    },
    {
      order: 3,
      slug: 'canh-dong-tu-ngu',
      title: 'Chặng 3: Cánh đồng Từ Ngữ',
      subtitle: 'Mùa vàng bội thu từ vựng',
      goal: 'Mở rộng vốn từ về gia đình, đồ vật, thiên nhiên quen thuộc',
      description: 'Khám phá thế giới xung quanh qua hàng trăm từ ngữ sinh động rực rỡ.',
      status: 'active' as const,
    },
    {
      order: 4,
      slug: 'ngoi-lang-cau-chuyen',
      title: 'Chặng 4: Ngôi làng Câu Chuyện',
      subtitle: 'Lắng nghe chuyện xưa tích cũ',
      goal: 'Đọc hiểu câu văn ngắn, đồng dao vui nhộn và thơ thiếu nhi',
      description: 'Ngồi dưới bóng cây đa đầu làng nghe khúc đồng dao rộn rã tuổi thơ.',
      status: 'active' as const,
    },
    {
      order: 5,
      slug: 'vuong-quoc-bau-vat',
      title: 'Chặng 5: Vương quốc Báu Vật',
      subtitle: 'Tự hào Tiếng Việt mến yêu',
      goal: 'Chinh phục Báu vật Nước Nam (Bài 20) và nhận chứng nhận Dũng sĩ Tiếng Việt',
      description: 'Hành trình đỉnh cao đúc kết tinh hoa ngôn ngữ và tình yêu quê hương xứ sở.',
      status: 'active' as const,
    },
  ];

  const createdStages = await Stage.insertMany(stagesData);
  logger.info(`✅ Seeded ${createdStages.length} stages`);

  const stage1Id = createdStages[0]._id;
  const stage2Id = createdStages[1]._id;
  const stage3Id = createdStages[2]._id;
  const stage4Id = createdStages[3]._id;
  const stage5Id = createdStages[4]._id;

  // 2. Seed 20 Lessons (Lessons 1-4 full, 5-20 frames)
  const fullLessonsStage1 = [
    {
      stageId: stage1Id,
      order: 1,
      title: 'Bài 1: Chữ A - Quả Na ngọt lành',
      description: 'Bé làm quen với chữ cái A qua hình ảnh Quả Na và Con Cá xinh xắn.',
      freeInStarterPlan: true,
      totalActivities: 5,
      vocabulary: [
        { word: 'Quả Na', meaning: 'Một loại quả ngọt nhiều mắt', audioUrl: '/audio/qua-na.mp3' },
        { word: 'Con Cá', meaning: 'Loài vật bơi lội dưới nước', audioUrl: '/audio/con-ca.mp3' },
        { word: 'Cái Ca', meaning: 'Cốc dùng để uống nước', audioUrl: '/audio/cai-ca.mp3' },
      ],
      activities: [
        {
          id: 'act-1-1',
          type: 'word_card' as const,
          prompt: 'Bé chạm vào thẻ chữ A để nghe âm thanh nhé!',
          subPrompt: 'Âm "A" ngân vang như tiếng chào buổi sáng!',
          targetWord: 'A',
          targetPhonetic: 'a',
          audioUrl: '/audio/a.mp3',
          hints: ['Chữ A có hai chân đứng thẳng và một nét ngang xinh xắn'],
        },
        {
          id: 'act-1-2',
          type: 'listen_choose' as const,
          prompt: 'Bé hãy lắng nghe và chọn từ chứa âm "A":',
          audioUrl: '/audio/prompt_qua_na.mp3',
          options: [
            { id: 'opt-na', text: 'Quả Na', imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=300' },
            { id: 'opt-but', text: 'Bút Chì', imageUrl: 'https://images.unsplash.com/photo-1585336261026-77cc789a3854?w=300' },
            { id: 'opt-vo', text: 'Quyển Vở', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300' },
          ],
          correctAnswer: 'opt-na',
          hints: ['Quả na có nhiều mắt, ăn rất ngọt!'],
        },
        {
          id: 'act-1-3',
          type: 'drag_match' as const,
          prompt: 'Bé ghép đúng từ với hình ảnh tương ứng nhé:',
          pairs: [
            { left: 'Quả Na', right: 'Trái cây ngọt' },
            { left: 'Con Cá', right: 'Bơi dưới nước' },
            { left: 'Cái Ca', right: 'Đựng nước uống' },
          ],
          correctAnswer: ['Quả Na', 'Con Cá', 'Cái Ca'],
        },
        {
          id: 'act-1-4',
          type: 'record_voice' as const,
          prompt: 'Bé hãy bấm nút đỏ và đọc thật to rõ ràng: "A... Quả Na" nhé!',
          targetWord: 'Quả Na',
          subPrompt: 'Giọng đọc của bé sẽ được gửi đến góc phụ huynh để ba mẹ nghe lại đấy!',
          hints: ['Mở to miệng và phát âm vang chữ "A" nào!'],
        },
        {
          id: 'act-1-5',
          type: 'review' as const,
          prompt: 'Chúc mừng bé đã đến thử thách cuối! Tìm chữ A hoa trong các chữ sau:',
          options: [
            { id: 'rev-a', text: 'A' },
            { id: 'rev-b', text: 'B' },
            { id: 'rev-c', text: 'C' },
            { id: 'rev-d', text: 'D' },
          ],
          correctAnswer: 'rev-a',
          hints: ['Chữ A trông giống như mái nhà chóp nhọn'],
        },
      ],
    },
    {
      stageId: stage1Id,
      order: 2,
      title: 'Bài 2: Chữ B - Bé và Bạn Búp Bê',
      description: 'Làm quen chữ B thân thương: Bé ngoan, Búp bê và Quả bơ bổ dưỡng.',
      freeInStarterPlan: true,
      totalActivities: 5,
      vocabulary: [
        { word: 'Em Bé', meaning: 'Bé ngoan của gia đình', audioUrl: '/audio/em-be.mp3' },
        { word: 'Búp Bê', meaning: 'Món đồ chơi đáng yêu', audioUrl: '/audio/bup-be.mp3' },
        { word: 'Quả Bơ', meaning: 'Trái cây béo ngậy xanh tươi', audioUrl: '/audio/qua-bo.mp3' },
      ],
      activities: [
        {
          id: 'act-2-1',
          type: 'word_card' as const,
          prompt: 'Chữ B với một nét thẳng và hai nét cong tròn xoe!',
          targetWord: 'B',
          targetPhonetic: 'bờ',
          hints: ['B giống như số 8 một nửa đấy bé ơi!'],
        },
        {
          id: 'act-2-2',
          type: 'listen_choose' as const,
          prompt: 'Đâu là bạn Búp Bê đáng yêu?',
          options: [
            { id: 'opt-bb', text: 'Búp Bê', imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300' },
            { id: 'opt-xe', text: 'Xe Tải', imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=300' },
          ],
          correctAnswer: 'opt-bb',
        },
        {
          id: 'act-2-3',
          type: 'fill_blank' as const,
          prompt: 'Bé điền chữ cái còn thiếu vào chỗ trống:',
          blanks: [{ sentence: '__úp bê', missing: 'B' }],
          options: [{ id: 'b', text: 'B' }, { id: 'm', text: 'M' }, { id: 'l', text: 'L' }],
          correctAnswer: 'b',
        },
        {
          id: 'act-2-4',
          type: 'record_voice' as const,
          prompt: 'Bé cùng thu âm giọng nói: "Bé yêu Búp Bê" thật hay nhé!',
          targetWord: 'Búp Bê',
        },
        {
          id: 'act-2-5',
          type: 'review' as const,
          prompt: 'Từ nào bắt đầu bằng chữ B?',
          options: [
            { id: 'opt-be', text: 'Bé Ngoan' },
            { id: 'opt-ca', text: 'Con Cá' },
          ],
          correctAnswer: 'opt-be',
        },
      ],
    },
    {
      stageId: stage1Id,
      order: 3,
      title: 'Bài 3: Chữ C - Con Cá Vàng tung tăng',
      description: 'Khám phá chữ C uốn cong mềm mại như vầng trăng khuyết.',
      freeInStarterPlan: true,
      totalActivities: 5,
      vocabulary: [
        { word: 'Con Cá', meaning: 'Cá bơi lượn trong bể kính' },
        { word: 'Cây Cối', meaning: 'Cây xanh che bóng mát' },
        { word: 'Con Cò', meaning: 'Con cò bay lả bay la' },
      ],
      activities: [
        {
          id: 'act-3-1',
          type: 'word_card' as const,
          prompt: 'Chữ C uốn cong như chú cá đang uốn mình!',
          targetWord: 'C',
          targetPhonetic: 'cờ',
        },
        {
          id: 'act-3-2',
          type: 'listen_choose' as const,
          prompt: 'Bé hãy chọn hình Con Cá bơi lội:',
          options: [
            { id: 'opt-ca', text: 'Con Cá', imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=300' },
            { id: 'opt-chim', text: 'Chim Sâu', imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=300' },
          ],
          correctAnswer: 'opt-ca',
        },
        {
          id: 'act-3-3',
          type: 'sort_order' as const,
          prompt: 'Sắp xếp các chữ cái để tạo thành từ "CÁ":',
          orderedItems: ['C', 'Á'],
          correctAnswer: ['C', 'Á'],
        },
        {
          id: 'act-3-4',
          type: 'record_voice' as const,
          prompt: 'Bé đọc to câu: "Con Cá Cảnh" nào!',
          targetWord: 'Con Cá',
        },
        {
          id: 'act-3-5',
          type: 'review' as const,
          prompt: 'Chữ C có hình dáng giống vật nào dưới đây?',
          options: [
            { id: 'opt-moon', text: 'Mặt trăng khuyết' },
            { id: 'opt-box', text: 'Cái hộp vuông' },
          ],
          correctAnswer: 'opt-moon',
        },
      ],
    },
    {
      stageId: stage1Id,
      order: 4,
      title: 'Bài 4: Thanh Sắc & Thanh Huyền diệu kỳ',
      description: 'Làm quen hai thanh điệu cơ bản: Thanh Sắc vút lên, Thanh Huyền êm ả.',
      freeInStarterPlan: true,
      totalActivities: 5,
      vocabulary: [
        { word: 'Cá (Dấu Sắc)', meaning: 'Nét nghiêng từ dưới lên trên phải' },
        { word: 'Cà (Dấu Huyền)', meaning: 'Nét nghiêng từ trên xuống dưới phải' },
      ],
      activities: [
        {
          id: 'act-4-1',
          type: 'word_card' as const,
          prompt: 'Dấu Sắc (/) bay vút lên cao, Dấu Huyền (\\) hạ giọng êm đềm!',
          targetWord: 'Cá - Cà',
        },
        {
          id: 'act-4-2',
          type: 'listen_choose' as const,
          prompt: 'Bé nghe âm thanh và chọn từ có dấu sắc:',
          options: [
            { id: 'opt-sac', text: 'Cá' },
            { id: 'opt-huyen', text: 'Cà' },
          ],
          correctAnswer: 'opt-sac',
        },
        {
          id: 'act-4-3',
          type: 'drag_match' as const,
          prompt: 'Nối từ với thanh điệu đúng:',
          pairs: [
            { left: 'Cá', right: 'Thanh Sắc (/)' },
            { left: 'Cà', right: 'Thanh Huyền (\\)' },
          ],
          correctAnswer: ['Cá', 'Cà'],
        },
        {
          id: 'act-4-4',
          type: 'record_voice' as const,
          prompt: 'Bé hãy đọc phân biệt: "Cá... Cà..."',
          targetWord: 'Cá Cà',
        },
        {
          id: 'act-4-5',
          type: 'review' as const,
          prompt: 'Dấu thanh nào vút lên cao như ngọn núi nhỏ?',
          options: [
            { id: 'opt-sac2', text: 'Dấu Sắc (/)' },
            { id: 'opt-nang', text: 'Dấu Nặng (.)' },
          ],
          correctAnswer: 'opt-sac2',
        },
      ],
    },
  ];

  // Lessons 5 to 20 (Skeletons across stages 2 to 5)
  const remainingLessons = [];
  const lessonTitles: Record<number, { title: string; stageIdx: number }> = {
    5: { title: 'Bài 5: Ghép âm Ba - Má thân thương', stageIdx: 1 },
    6: { title: 'Bài 6: Bé chèo thuyền trên sông', stageIdx: 1 },
    7: { title: 'Bài 7: Vần An - Lan can và Đàn chim', stageIdx: 1 },
    8: { title: 'Bài 8: Vần Em - Đêm rằm trăng sáng', stageIdx: 1 },
    9: { title: 'Bài 9: Mâm cơm gia đình ấm áp', stageIdx: 2 },
    10: { title: 'Bài 10: Vườn hoa rực rỡ sắc màu', stageIdx: 2 },
    11: { title: 'Bài 11: Đồ dùng quen thuộc của bé', stageIdx: 2 },
    12: { title: 'Bài 12: Động vật trong trang trại', stageIdx: 2 },
    13: { title: 'Bài 13: Đồng dao Rồng rắn lên mây', stageIdx: 3 },
    14: { title: 'Bài 14: Tiếng ru của mẹ trưa hè', stageIdx: 3 },
    15: { title: 'Bài 15: Chú Cuội ngồi gốc cây đa', stageIdx: 3 },
    16: { title: 'Bài 16: Câu chuyện Thỏ và Rùa', stageIdx: 3 },
    17: { title: 'Bài 17: Nón lá và Chiếc áo dài', stageIdx: 4 },
    18: { title: 'Bài 18: Lễ hội Đua thuyền rộn rã', stageIdx: 4 },
    19: { title: 'Bài 19: Tiếng Việt giàu và đẹp', stageIdx: 4 },
    20: { title: 'Bài 20: Báu vật Nước Nam', stageIdx: 4 }, // Finale Treasure Lesson!
  };

  for (let order = 5; order <= 20; order++) {
    const meta = lessonTitles[order];
    const targetStageId = createdStages[meta.stageIdx]._id;

    remainingLessons.push({
      stageId: targetStageId,
      order,
      title: meta.title,
      description: `Khám phá bài học số ${order} cùng Sao Lí Lắc với nhiều hoạt động thú vị.`,
      freeInStarterPlan: false,
      totalActivities: 3,
      vocabulary: [
        { word: `Từ mới bài ${order}`, meaning: 'Khám phá ngôn ngữ cùng bài học nâng cao' },
      ],
      activities: [
        {
          id: `act-${order}-1`,
          type: 'word_card' as const,
          prompt: `Chào mừng bé đến với ${meta.title}!`,
          targetWord: `Bài ${order}`,
        },
        {
          id: `act-${order}-2`,
          type: 'listen_choose' as const,
          prompt: 'Bé hãy chọn hình đúng với bài học:',
          options: [
            { id: `opt-${order}-a`, text: 'Đáp án A' },
            { id: `opt-${order}-b`, text: 'Đáp án B' },
          ],
          correctAnswer: `opt-${order}-a`,
        },
        {
          id: `act-${order}-3`,
          type: 'review' as const,
          prompt: 'Bé đã nắm vững kiến thức bài học chưa nào?',
          options: [{ id: 'opt-yes', text: 'Con đã hiểu rồi!' }],
          correctAnswer: 'opt-yes',
        },
      ],
    });
  }

  const allLessons = [...fullLessonsStage1, ...remainingLessons];
  await Lesson.insertMany(allLessons);
  logger.info(`✅ Seeded ${allLessons.length} lessons (Lessons 1-4 fully enriched, 5-20 frames)`);

  // 3. Seed 5 Sample Stories with karaoke lyrics & quiz
  const sampleStories = [
    {
      type: 'dong_dao' as const,
      title: 'Rồng Rắn Lên Mây',
      author: 'Dân gian Việt Nam',
      description: 'Bài đồng dao quen thuộc gắn liền với trò chơi dân gian rồng rắn bắt đầu vui nhộn.',
      coverImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400',
      audioUrl: '/audio/stories/rong-ran-len-may.mp3',
      durationSec: 45,
      ageGroups: ['5-6', '6-8'],
      vocab: ['Rồng rắn', 'Thầy thuốc', 'Mây', 'Cây núc nác'],
      lyrics: [
        { timeSec: 0, text: 'Rồng rắn lên mây' },
        { timeSec: 3, text: 'Có cây núc nác' },
        { timeSec: 6, text: 'Có nhà điểm binh' },
        { timeSec: 9, text: 'Thầy thuốc có nhà hay không?' },
        { timeSec: 14, text: '- Thầy thuốc đi chợ!' },
        { timeSec: 18, text: 'Rồng rắn lên mây lần nữa nào!' },
      ],
      quiz: [
        {
          question: 'Bài đồng dao nhắc đến loài cây nào?',
          options: ['Cây bàng', 'Cây núc nác', 'Cây ổi'],
          correctAnswer: 1,
          explanation: '"Có cây núc nác, có nhà điểm binh".',
        },
      ],
    },
    {
      type: 'dong_dao' as const,
      title: 'Dung Dăng Dung Dẻ',
      author: 'Dân gian Việt Nam',
      description: 'Giai điệu vui tươi khi các bạn nhỏ nắm tay dắt nhau dạo chơi ngày nắng đẹp.',
      coverImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400',
      audioUrl: '/audio/stories/dung-dang-dung-de.mp3',
      durationSec: 40,
      ageGroups: ['5-6'],
      vocab: ['Dung dăng', 'Dắt trẻ', 'Cửa chùa'],
      lyrics: [
        { timeSec: 0, text: 'Dung dăng dung dẻ' },
        { timeSec: 3, text: 'Dắt trẻ đi chơi' },
        { timeSec: 6, text: 'Đến cổng nhà trời' },
        { timeSec: 9, text: 'Lạy cậu lạy mợ' },
        { timeSec: 13, text: 'Cho cháu về quê!' },
      ],
      quiz: [
        {
          question: 'Các bạn nhỏ cùng dắt nhau đi đâu?',
          options: ['Đi chơi', 'Đi ngủ', 'Đi câu cá'],
          correctAnswer: 0,
        },
      ],
    },
    {
      type: 'dong_dao' as const,
      title: 'Nu Na Nu Nống',
      author: 'Dân gian Việt Nam',
      description: 'Trò chơi so chân đếm nhịp rộn rã sân đình.',
      coverImage: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400',
      audioUrl: '/audio/stories/nu-na-nu-nong.mp3',
      durationSec: 35,
      ageGroups: ['5-6', '6-8'],
      vocab: ['Nu na nu nống', 'Đánh trống phất cờ'],
      lyrics: [
        { timeSec: 0, text: 'Nu na nu nống' },
        { timeSec: 3, text: 'Đánh trống phất cờ' },
        { timeSec: 6, text: 'Mở cuộc thi đua' },
        { timeSec: 9, text: 'Chân ai sạch sẽ' },
        { timeSec: 12, text: 'Gót đỏ hồng hào' },
        { timeSec: 15, text: 'Không bẩn tí nào, vào rương ngồi!' },
      ],
      quiz: [
        {
          question: 'Chân như thế nào thì được vào ngồi?',
          options: ['Chân dính bùn', 'Chân sạch sẽ, gót đỏ hồng hào', 'Chân đi ủng'],
          correctAnswer: 1,
        },
      ],
    },
    {
      type: 'dong_dao' as const,
      title: 'Trồng Nụ Trồng Hoa',
      author: 'Dân gian Việt Nam',
      description: 'Đồng dao nhảy bước khéo léo vượt qua nụ hoa rực rỡ.',
      coverImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
      audioUrl: '/audio/stories/trong-nu-trong-hoa.mp3',
      durationSec: 30,
      ageGroups: ['5-6'],
      vocab: ['Nụ hoa', 'Bông hoa', 'Nhảy khéo'],
      lyrics: [
        { timeSec: 0, text: 'Trồng nụ trồng hoa' },
        { timeSec: 4, text: 'Nụ nào khép nép' },
        { timeSec: 8, text: 'Hoa nào nở bung' },
        { timeSec: 12, text: 'Bé nhảy thật khéo!' },
      ],
      quiz: [
        {
          question: 'Bài đồng dao nói về hành động gì?',
          options: ['Trồng nụ trồng hoa', 'Thả diều', 'Tắm sông'],
          correctAnswer: 0,
        },
      ],
    },
    {
      type: 'co_tich' as const,
      title: 'Sự Tích Bánh Chưng Bánh Giầy',
      author: 'Cổ tích Việt Nam',
      description: 'Tấm lòng hiếu thảo của chàng Lang Liêu với đất trời và cha mẹ tổ tiên qua hai thứ bánh quý.',
      coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      audioUrl: '/audio/stories/banh-chung-banh-giay.mp3',
      durationSec: 120,
      ageGroups: ['6-8'],
      vocab: ['Bánh Chưng', 'Bánh Giầy', 'Lang Liêu', 'Đất Trời'],
      lyrics: [
        { timeSec: 0, text: 'Ngày xưa vào đời Vua Hùng thứ 6...' },
        { timeSec: 10, text: 'Vua muốn tìm người con hiếu thảo nối ngôi.' },
        { timeSec: 25, text: 'Lang Liêu được thần báo mộng làm bánh từ hạt gạo quý.' },
        { timeSec: 45, text: 'Bánh Chưng vuông tượng trưng cho Mặt Đất màu mỡ.' },
        { timeSec: 70, text: 'Bánh Giầy tròn tượng trưng cho Bầu Trời bao la.' },
      ],
      quiz: [
        {
          question: 'Bánh Chưng tượng trưng cho điều gì?',
          options: ['Mặt Đất', 'Bầu Trời', 'Ánh Trăng'],
          correctAnswer: 0,
          explanation: 'Bánh Chưng vuông tượng trưng cho Đất, Bánh Giầy tròn tượng trưng cho Trời.',
        },
      ],
    },
  ];

  await Story.insertMany(sampleStories);
  logger.info(`✅ Seeded ${sampleStories.length} stories`);

  // 4. Seed 3 Culture Articles
  const cultureData = [
    {
      category: 'am_thuc',
      title: 'Bánh Chưng - Hương Vị Tết Cổ Truyền',
      intro: 'Bánh Chưng xanh gắn bó với ngày Tết sum họp của mỗi gia đình Việt Nam từ ngàn xưa.',
      coverImage: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400',
      audioUrl: '/audio/culture/banh-chung.mp3',
      funFacts: [
        'Lá dong xanh gói bên ngoài giúp bánh có màu xanh ngọc bích tự nhiên tuyệt đẹp.',
        'Bên trong bánh có gạo nếp dẻo, đỗ xanh ngọt bùi và thịt tiêu thơm lừng.',
        'Nồi bánh Chưng thường được nấu thâu đêm suốt 10-12 tiếng trên bếp củi bập bùng.',
        'Bánh Chưng hình vuông tượng trưng cho Mặt Đất che chở con người.',
      ],
      quiz: [
        {
          question: 'Lá gì thường được dùng để gói bánh Chưng?',
          options: ['Lá dong', 'Lá sen', 'Lá chuối phơi khô'],
          correctAnswer: 0,
          explanation: 'Lá dong là loại lá truyền thống giúp bánh thơm ngon và giữ màu xanh tự nhiên.',
        },
        {
          question: 'Bánh Chưng có hình gì?',
          options: ['Hình vuông', 'Hình tròn', 'Hình tam giác'],
          correctAnswer: 0,
        },
      ],
      tags: ['Tết', 'Ẩm thực', 'Truyền thống'],
    },
    {
      category: 'trang_phuc',
      title: 'Tà Áo Dài Thướt Tha',
      intro: 'Áo Dài là trang phục truyền thống đầy tự hào, tôn vinh nét đẹp thanh lịch của người Việt.',
      coverImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400',
      audioUrl: '/audio/culture/ao-dai.mp3',
      funFacts: [
        'Áo dài có hai tà trước và sau mềm mại, thường được mặc cùng quần lụa.',
        'Cả nam và nữ, người lớn và trẻ em đều có những mẫu áo dài rực rỡ đón Tết.',
        'Họa tiết trên áo dài thường là hoa sen, chim hạc hoặc hoa mai, hoa đào mùa xuân.',
        'Áo dài được bạn bè quốc tế xem là một trong những trang phục truyền thống đẹp nhất thế giới.',
      ],
      quiz: [
        {
          question: 'Loài hoa nào thường xuất hiện trên họa tiết áo dài truyền thống?',
          options: ['Hoa Sen', 'Cây xương rồng', 'Cây phong ba'],
          correctAnswer: 0,
        },
      ],
      tags: ['Trang phục', 'Văn hóa', 'Di sản'],
    },
    {
      category: 'vat_dung',
      title: 'Chiếc Nón Lá Bình Dị',
      intro: 'Chiếc nón lá mộc mạc che nắng che mưa, đã đi cùng người dân Việt Nam suốt bao thế hệ.',
      coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400',
      audioUrl: '/audio/culture/non-la.mp3',
      funFacts: [
        'Nón lá được làm từ lá cọ hoặc lá buông phơi khô trắng tinh.',
        'Bên trong khung nón có 16 chiếc vành tre uốn tròn đều tăm tắp.',
        'Làng Chuông (Hà Nội) là làng nghề làm nón lá nổi tiếng hàng trăm năm tuổi.',
        'Nón lá bài thơ xứ Huế khi soi lên ánh nắng sẽ thấy ẩn hiện câu thơ và hình phong cảnh.',
      ],
      quiz: [
        {
          question: 'Khung nón lá truyền thống thường có bao nhiêu chiếc vành tre?',
          options: ['16 vành', '10 vành', '5 vành'],
          correctAnswer: 0,
          explanation: '16 vành tre tượng trưng cho sự trọn vẹn và tuổi trăng tròn tươi đẹp.',
        },
      ],
      tags: ['Đồ dùng', 'Làng nghề', 'Xứ Huế'],
    },
  ];

  await CultureArticle.insertMany(cultureData);
  logger.info(`✅ Seeded ${cultureData.length} culture articles`);

  // 5. Seed 5 Shop Items
  const shopItemsData = [
    {
      name: 'Huy hiệu Sao Sáng Lí Lắc',
      type: 'virtual' as const,
      costPoints: 20,
      assetUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200',
      badgeCode: 'badge_star_lilac',
      description: 'Huy hiệu lấp lánh gắn trên mũ đại diện của bé trong thế giới Vietverse.',
      active: true,
    },
    {
      name: 'Nón Lá Tí Hon cho Mascot',
      type: 'virtual' as const,
      costPoints: 35,
      assetUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=200',
      badgeCode: 'item_non_la_mascot',
      description: 'Phụ kiện nón lá truyền thống cực đáng yêu cho bạn đồng hành Vivi.',
      active: true,
    },
    {
      name: 'Áo Dài Gấm Mini cho Vivi',
      type: 'virtual' as const,
      costPoints: 50,
      assetUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
      badgeCode: 'item_ao_dai_mini',
      description: 'Bộ áo dài rực rỡ diện đón Tết cho bạn Sao Lí Lắc.',
      active: true,
    },
    {
      name: 'Bộ Sticker Bảng Chữ Cái Vietverse',
      type: 'physical' as const,
      costPoints: 80,
      assetUrl: 'https://images.unsplash.com/photo-1589384267710-7a25bc24a1b0?w=200',
      stock: 50,
      description: 'Bộ nhãn dán sticker chất lượng cao gửi về tận nhà cho bé dán tập vở.',
      active: true,
    },
    {
      name: 'Truyện Tranh Tích Xưa Nước Nam',
      type: 'physical' as const,
      costPoints: 150,
      assetUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200',
      stock: 20,
      description: 'Cuốn truyện tranh màu tuyệt đẹp kể những điển tích anh hùng và văn hóa dân tộc.',
      active: true,
    },
  ];

  await ShopItem.insertMany(shopItemsData);
  logger.info(`✅ Seeded ${shopItemsData.length} shop items`);

  // 6. Seed Demo Users (Admin and Parent)
  const adminPasswordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);
  const parentPasswordHash = await bcrypt.hash(env.SEED_PARENT_PASSWORD, 10);

  const adminUser = await User.create({
    email: env.SEED_ADMIN_EMAIL.toLowerCase(),
    passwordHash: adminPasswordHash,
    displayName: 'Quản Trị Viên Vietverse',
    role: ROLES.ADMIN,
  });

  const parentUser = await User.create({
    email: env.SEED_PARENT_EMAIL.toLowerCase(),
    passwordHash: parentPasswordHash,
    displayName: 'Mẹ Lan & Bé An',
    role: ROLES.PARENT,
    parentGatePin: '1234',
  });

  // Create Subscriptions
  await Subscription.create({
    userId: adminUser._id,
    plan: 'yearly',
    maxChildren: 3,
    startedAt: new Date(),
  });

  await Subscription.create({
    userId: parentUser._id,
    plan: 'free',
    maxChildren: 1,
    startedAt: new Date(),
  });

  // Seed Demo Child for Parent
  const demoChild = await Child.create({
    parentId: parentUser._id,
    name: 'Bé An',
    ageGroup: '5-6',
    companionLanguage: 'en',
    avatarId: 'mascot-star-1',
    viviPoints: 45,
    currentStageId: stage1Id,
    level: 1,
    badges: ['tan-binh-vietverse', 'ngoi-sao-cham-chi'],
    screenTimeLimit: 20,
  });

  logger.info(`✅ Seeded Admin User (${adminUser.email}) and Parent User (${parentUser.email})`);
  logger.info(`✅ Seeded Demo Child: ${demoChild.name} (ID: ${demoChild._id}, ViVi Points: ${demoChild.viviPoints})`);
  logger.info('🎉 Seed completed successfully!');

  if (process.env.NODE_ENV !== 'test') {
    await mongoose.disconnect();
  }
}

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
