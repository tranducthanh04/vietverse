import { Child } from '../../models/Child.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Recording } from '../../models/Recording.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { Lesson } from '../../models/Lesson.js';

export interface CompetencyScore {
  key: string;
  name: string;
  percentage: number;
  statusLabel: 'Đã khám phá' | 'Đang luyện tập' | 'Chưa bắt đầu';
  description: string;
}

export class ParentService {
  static async getChildCompetencyProgress(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền truy cập' };
    }

    const progresses = await LessonProgress.find({ childId: child._id });
    const completedProgresses = progresses.filter((p) => p.status === 'completed');
    const completedLessonIds = completedProgresses.map((p) => p.lessonId);

    const completedLessons = await Lesson.find({ _id: { $in: completedLessonIds } });
    const recordingsCount = await Recording.countDocuments({ childId: child._id });
    const storiesExploredCount = await ExplorationLog.countDocuments({ childId: child._id, kind: 'story' });
    const cultureExploredCount = await ExplorationLog.countDocuments({ childId: child._id, kind: 'culture' });

    // Target benchmark for MVP Phase: 4 foundational lessons in Stage 1
    const baseLessonsCount = 4;
    const completedCount = completedLessons.length;

    // 1. Nghe hiểu (Listening):
    // Based on listen_choose activities & story listens
    const listenRatio = Math.min(100, Math.round(((completedCount * 1.2 + storiesExploredCount * 0.8) / (baseLessonsCount * 1.5)) * 100));

    // 2. Nói & Giao tiếp (Speaking):
    // Based on voice recordings & activities
    const speakingRatio = Math.min(100, Math.round(((recordingsCount * 2 + completedCount * 0.5) / (baseLessonsCount * 2)) * 100));

    // 3. Đọc & Nhận biết mặt chữ (Reading):
    // Based on completed lessons vocabulary & matching
    const readingRatio = Math.min(100, Math.round((completedCount / baseLessonsCount) * 100));

    // 4. Tư duy & Văn hóa (Thinking & Culture):
    // Based on culture articles & exploration logs
    const thinkingRatio = Math.min(100, Math.round(((cultureExploredCount * 1.5 + completedCount * 0.5) / (baseLessonsCount * 1.5)) * 100));

    const getStatusLabel = (pct: number): 'Đã khám phá' | 'Đang luyện tập' | 'Chưa bắt đầu' => {
      if (pct >= 70) return 'Đã khám phá';
      if (pct > 0) return 'Đang luyện tập';
      return 'Chưa bắt đầu';
    };

    const competencies: CompetencyScore[] = [
      {
        key: 'listening',
        name: 'Nghe hiểu',
        percentage: listenRatio,
        statusLabel: getStatusLabel(listenRatio),
        description: 'Khả năng cảm thụ âm điệu, phân biệt thanh điệu và ngữ điệu tự nhiên của tiếng Việt.',
      },
      {
        key: 'speaking',
        name: 'Nói & Giao tiếp',
        percentage: speakingRatio,
        statusLabel: getStatusLabel(speakingRatio),
        description: 'Tự tin phát âm từ vựng, bắt chước giọng đọc chuẩn và diễn đạt cảm xúc.',
      },
      {
        key: 'reading',
        name: 'Nhận diện mặt chữ',
        percentage: readingRatio,
        statusLabel: getStatusLabel(readingRatio),
        description: 'Làm quen bảng chữ cái, ghép vần cơ bản và nhận biết từ ngữ quen thuộc.',
      },
      {
        key: 'thinking',
        name: 'Tư duy & Văn hóa',
        percentage: thinkingRatio,
        statusLabel: getStatusLabel(thinkingRatio),
        description: 'Gắn kết ngôn ngữ với hình ảnh văn hóa, sự tích và nếp sống truyền thống Việt Nam.',
      },
    ];

    return {
      child: {
        id: child._id,
        name: child.name,
        ageGroup: child.ageGroup,
        avatarId: child.avatarId,
        viviPoints: child.viviPoints,
        screenTimeLimit: child.screenTimeLimit,
      },
      overview: {
        totalLessonsCompleted: completedCount,
        totalRecordings: recordingsCount,
        storiesExplored: storiesExploredCount,
        cultureExplored: cultureExploredCount,
      },
      competencies,
    };
  }

  static async updateScreenTime(parentId: string, childId: string, limitMinutes: number) {
    const validLimits = [0, 15, 20, 30, 45, 60];
    if (!validLimits.includes(limitMinutes)) {
      throw { statusCode: 400, message: 'Thời gian giới hạn không hợp lệ (15, 20, 30 phút hoặc 0 không giới hạn)' };
    }

    const child = await Child.findOneAndUpdate(
      { _id: childId, parentId },
      { $set: { screenTimeLimit: limitMinutes } },
      { new: true }
    );

    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    return child;
  }
}
