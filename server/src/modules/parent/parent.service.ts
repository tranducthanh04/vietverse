import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Child } from '../../models/Child.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Recording } from '../../models/Recording.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { Lesson } from '../../models/Lesson.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';

export interface CompetencyScore {
  key: string;
  name: string;
  percentage: number;
  statusLabel: 'Đã khám phá' | 'Đang luyện tập' | 'Chưa bắt đầu';
  description: string;
}

export class ParentService {
  static generateGateChallenge(userId: string) {
    const num1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const num2 = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const challengeToken = jwt.sign(
      {
        userId,
        num1,
        num2,
        expected: num1 * num2,
        purpose: 'parent_gate_challenge',
      },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return {
      challengeToken,
      question: `${num1} × ${num2} = ?`,
      num1,
      num2,
    };
  }

  static async verifyGate(
    userId: string,
    data: { challengeToken?: string; answer?: number; pin?: string; password?: string }
  ) {
    let verified = false;

    if (data.pin) {
      const user = await User.findById(userId);
      if (user && user.parentGatePin) {
        const isHashed = user.parentGatePin.startsWith('$2a$') || user.parentGatePin.startsWith('$2b$');
        if (isHashed) {
          verified = await bcrypt.compare(data.pin, user.parentGatePin);
        } else {
          verified = user.parentGatePin === data.pin;
          if (verified) {
            user.parentGatePin = await bcrypt.hash(data.pin, 10);
            await user.save();
          }
        }
      }
      if (!verified) {
        throw { statusCode: 400, message: 'Mã PIN cổng phụ huynh không chính xác' };
      }
    } else if (data.password) {
      const user = await User.findById(userId);
      if (user && (await bcrypt.compare(data.password, user.passwordHash))) {
        verified = true;
      } else {
        throw { statusCode: 400, message: 'Mật khẩu tài khoản không chính xác' };
      }
    } else if (data.challengeToken && data.answer !== undefined) {
      try {
        const decoded = jwt.verify(data.challengeToken, env.JWT_SECRET) as any;
        if (decoded.purpose !== 'parent_gate_challenge' || decoded.userId !== userId) {
          throw { statusCode: 400, message: 'Thử thách cổng phụ huynh không hợp lệ' };
        }
        if (Number(data.answer) !== decoded.expected) {
          throw { statusCode: 400, message: 'Đáp án phép tính không chính xác, vui lòng thử lại' };
        }
        verified = true;
      } catch (err: any) {
        if (err.statusCode) throw err;
        throw { statusCode: 400, message: 'Thử thách cổng phụ huynh đã hết hạn hoặc không hợp lệ' };
      }
    } else {
      throw { statusCode: 400, message: 'Vui lòng cung cấp đáp án thử thách hoặc mã PIN để mở cổng phụ huynh' };
    }

    if (verified) {
      const gateToken = jwt.sign(
        { userId, purpose: 'parent_gate' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      return {
        gateToken,
        expiresIn: 900,
      };
    }

    throw { statusCode: 400, message: 'Xác thực cổng phụ huynh thất bại' };
  }

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
    const validLimits = [0, 15, 20, 30];
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
