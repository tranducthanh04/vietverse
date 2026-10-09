import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { ShopItem } from '../models/ShopItem.js';
import { Story } from '../models/Story.js';
import { CultureArticle } from '../models/CultureArticle.js';
import { ExplorationLog } from '../models/ExplorationLog.js';

describe('VietVerse Full End-to-End User Journey & Button Logic Test', () => {
  it('executes full 11-step end-to-end user journey across all features and button actions', async () => {
    // 0. Seed essential initial stage, lesson, shop item, story, and culture article
    const stage = await Stage.create({
      order: 1,
      slug: 'chang-1-khoi-dong',
      title: 'Chặng 1: Làm quen',
      goal: 'Khám phá bảng chữ cái vui nhộn',
      status: 'active',
    });

    const lesson = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài 1: Làm quen chữ A, Ă, Â',
      vocabulary: [
        { word: 'con cá', meaning: 'Động vật bơi dưới nước' },
        { word: 'quả na', meaning: 'Loại quả nhiều hạt vị ngọt thơm' },
      ],
      freeInStarterPlan: true,
      activities: [
        {
          id: 'act-1',
          type: 'listen_choose',
          prompt: 'Bé hãy bấm nghe và chọn chữ A',
          audioUrl: '/placeholder.mp3',
          options: [
            { id: 'opt-a', text: 'A' },
            { id: 'opt-b', text: 'B' },
            { id: 'opt-c', text: 'C' },
          ],
          correctAnswer: 'A',
          hints: ['Chữ A có mái nhà nhọn'],
          pointsWeight: 10,
        },
        {
          id: 'act-2',
          type: 'record_voice',
          prompt: 'Bé hãy đọc to chữ A',
          correctAnswer: 'A',
          pointsWeight: 10,
        },
      ],
    });
    const lesson1Id = lesson._id.toString();

    // Create Lesson 2 so the stage is multi-lesson and stage bonus triggers only when all completed
    await Lesson.create({
      stageId: stage._id,
      order: 2,
      title: 'Bài 2: Làm quen chữ B, C',
      vocabulary: [{ word: 'búp bê', meaning: 'Đồ chơi trẻ em' }],
      freeInStarterPlan: true,
      activities: [
        {
          id: 'act-b1',
          type: 'listen_choose',
          prompt: 'Bé hãy bấm nghe và chọn chữ B',
          options: [{ id: 'opt-b', text: 'B' }],
          correctAnswer: 'B',
        },
      ],
    });

    const item = await ShopItem.create({
      name: 'Sticker Sao Lí Lắc Vàng',
      type: 'physical',
      costPoints: 10,
      assetUrl: '/sticker.png',
      active: true,
    });
    const shopItemId = item._id.toString();

    const story = await Story.create({
      type: 'dong_dao',
      title: 'Rồng rắn lên mây',
      audioUrl: '/audio/story.mp3',
      durationSec: 90,
      lyrics: [{ timeSec: 0, text: 'Rồng rắn lên mây...' }],
      ageGroups: ['5-6', '6-8'],
      vocab: ['rồng', 'rắn', 'mây'],
      quiz: [
        {
          question: 'Trò chơi nhắc đến con gì?',
          options: ['Con cá', 'Rồng rắn', 'Con gà'],
          correctAnswer: 1,
        },
      ],
    });
    const storyId = story._id.toString();

    const culture = await CultureArticle.create({
      category: 'Ẩm thực',
      title: 'Bánh Chưng ngày Tết',
      intro: 'Bánh chưng vuông vắn tượng trưng cho Đất.',
      funFacts: ['Bánh chưng nấu từ gạo nếp cái hoa vàng'],
      quiz: [
        {
          question: 'Bánh chưng hình gì?',
          options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'],
          correctAnswer: 1,
        },
      ],
    });
    const cultureId = culture._id.toString();

    // ==========================================
    // STEP 1: Parent Registers Account with Email & Password
    // ==========================================
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'journey_parent@vietverse.edu.vn',
        password: 'Password@123',
        displayName: 'Mẹ Bé Bắp',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.accessToken).toBeDefined();
    const parentToken = regRes.body.data.accessToken;

    // ==========================================
    // STEP 2: Parent Completes Onboarding Wizard to create Child Profile
    // ==========================================
    const childRes = await request(app)
      .post('/api/v1/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Bé Bắp',
        ageGroup: '5-6',
        companionLanguage: 'en',
        avatarId: 'mascot-star-1',
      });

    expect(childRes.status).toBe(201);
    expect(childRes.body.success).toBe(true);
    expect(childRes.body.data.name).toBe('Bé Bắp');
    expect(childRes.body.data.viviPoints).toBe(0);
    const childId = childRes.body.data._id;

    // ==========================================
    // STEP 3: Browse Quest Map (5 Stages & Lessons list)
    // ==========================================
    const stagesRes = await request(app)
      .get('/api/v1/stages')
      .set('Authorization', `Bearer ${parentToken}`)
      .query({ childId });

    expect(stagesRes.status).toBe(200);
    expect(stagesRes.body.success).toBe(true);
    expect(Array.isArray(stagesRes.body.data)).toBe(true);
    expect(stagesRes.body.data.length).toBeGreaterThan(0);
    expect(stagesRes.body.data[0].lessons[0].title).toContain('Làm quen');

    // ==========================================
    // STEP 4: Open Lesson 1 and Load Activity Registry Data
    // ==========================================
    const lessonRes = await request(app)
      .get(`/api/v1/lessons/${lesson1Id}?childId=${childId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(lessonRes.status).toBe(200);
    expect(lessonRes.body.success).toBe(true);
    expect(lessonRes.body.data.activities.length).toBe(2);
    expect(lessonRes.body.data.activities[0].type).toBe('listen_choose');
    expect(lessonRes.body.data.activities[1].type).toBe('record_voice');

    // ==========================================
    // STEP 5: Complete Lesson 1, Earn +10 ViVi Points and 3 Stars
    // ==========================================
    const recordingRes = await request(app).post('/api/v1/recordings')
      .set('Authorization', `Bearer ${parentToken}`)
      .field('childId', childId).field('lessonId', lesson1Id).field('activityId', 'act-2').field('contentVersion', '0')
      .attach('audio', Buffer.from('audio fixture'), { filename: 'voice.webm', contentType: 'audio/webm' })
      .expect(201);
    const completeRes = await request(app)
      .post(`/api/v1/lessons/${lesson1Id}/complete`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        answers: [
          { activityId: 'act-1', userAnswer: 'A' },
          { activityId: 'act-2', userAnswer: recordingRes.body.data.id },
        ],
        durationSec: 120,
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.stars).toBe(3);
    expect(completeRes.body.data.pointsEarned).toBe(12); // +10 lesson, +1 x 2 passed activities (D1)
    expect(completeRes.body.data.totalPoints).toBe(12);

    // ==========================================
    // STEP 6: Verify Idempotency - Retrying Lesson 1 does not duplicate ViVi Points
    // ==========================================
    const retryRes = await request(app)
      .post(`/api/v1/lessons/${lesson1Id}/complete`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        answers: [
          { activityId: 'act-1', userAnswer: 'A' },
          { activityId: 'act-2', userAnswer: recordingRes.body.data.id },
        ],
        durationSec: 90,
      });

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.pointsEarned).toBe(0); // Idempotent!
    expect(retryRes.body.data.totalPoints).toBe(12);

    // ==========================================
    // STEP 7: Post Culture Article Quiz, Win +5 ViVi Points
    // ==========================================
    const cultureRes = await request(app)
      .post(`/api/v1/culture/${cultureId}/quiz`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        answers: [{ questionIndex: 0, selectedAnswer: 1 }],
      });

    expect(cultureRes.status).toBe(200);
    expect(cultureRes.body.success).toBe(true);
    expect(cultureRes.body.data.pointsAwarded).toBe(5);
    expect(cultureRes.body.data.totalPoints).toBe(17);

    // Verify Culture Quiz Idempotency: Retrying does not double award points
    const retryCultureRes = await request(app)
      .post(`/api/v1/culture/${cultureId}/quiz`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        answers: [{ questionIndex: 0, selectedAnswer: 1 }],
      });

    expect(retryCultureRes.status).toBe(200);
    expect(retryCultureRes.body.data.pointsAwarded).toBe(0); // 0 points on retry!
    expect(retryCultureRes.body.data.totalPoints).toBe(17); // balance still 17!

    const expLogs = await ExplorationLog.find({ childId, kind: 'culture', refId: cultureId });
    expect(expLogs.length).toBe(1); // exactly 1 log!

    // ==========================================
    // STEP 8: Parent Portal - Pass Parent Gate & Check Child 4 Competency Progress
    // ==========================================
    const gateRes = await request(app)
      .post('/api/v1/parent/gate/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ pin: '1234' });
    expect(gateRes.status).toBe(200);
    const gateToken = gateRes.body.data.gateToken;

    const parentRes = await request(app)
      .get(`/api/v1/parent/progress/${childId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .set('X-Parent-Gate-Token', gateToken);

    expect(parentRes.status).toBe(200);
    expect(parentRes.body.success).toBe(true);
    expect(Array.isArray(parentRes.body.data.competencies)).toBe(true);
    expect(parentRes.body.data.competencies.length).toBe(4);
    const listeningComp = parentRes.body.data.competencies.find((c: any) => c.key === 'listening');
    expect(listeningComp).toBeDefined();
    expect(listeningComp.statusLabel).toBeDefined();

    // ==========================================
    // STEP 9: Points Shop - Child Redeems Physical Gift Item
    // ==========================================
    const redeemRes = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        itemId: shopItemId,
        shippingAddress: {
          recipientName: 'Mẹ Bé Bắp',
          phone: '0901234567',
          street: '123 Phố Huế',
          city: 'Hà Nội',
        },
      });

    expect(redeemRes.status).toBe(200);
    expect(redeemRes.body.success).toBe(true);
    expect(redeemRes.body.data.remainingPoints).toBe(7); // 17 - 10 = 7

    // ==========================================
    // STEP 10: Points Shop - Prevent Overdrafting (Cannot redeem when balance is insufficient)
    // ==========================================
    const failRes = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        childId,
        itemId: shopItemId, // Costs 10, but balance is only 7
        shippingAddress: {
          recipientName: 'Mẹ Bé Bắp',
          phone: '0901234567',
          street: '123 Phố Huế',
          city: 'Hà Nội',
        },
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error.message).toContain('không đủ');

    // ==========================================
    // STEP 11: Browse Folk Stories & Karaoke Lyrics
    // ==========================================
    const storyRes = await request(app)
      .get(`/api/v1/stories/${storyId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(storyRes.status).toBe(200);
    expect(storyRes.body.success).toBe(true);
    expect(storyRes.body.data.title).toBe('Rồng rắn lên mây');
    expect(storyRes.body.data.lyrics.length).toBeGreaterThan(0);
  });
});
