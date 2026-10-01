import { CultureArticle } from '../../models/CultureArticle.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { Child } from '../../models/Child.js';
import { POINT_RULES } from '../../constants/points.js';

export class CultureService {
  static async getArticles(filter: { category?: string; search?: string }) {
    const query: any = {};
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { intro: { $regex: filter.search, $options: 'i' } },
      ];
    }
    return CultureArticle.find(query).sort({ createdAt: -1 });
  }

  static async getArticleById(id: string) {
    const article = await CultureArticle.findById(id);
    if (!article) {
      throw { statusCode: 404, message: 'Không tìm thấy bài viết văn hóa' };
    }
    return article;
  }

  static async submitQuiz(
    articleId: string,
    parentId: string,
    data: { childId: string; answers: { questionIndex: number; selectedAnswer: number }[] }
  ) {
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }

    const article = await CultureArticle.findById(articleId);
    if (!article) {
      throw { statusCode: 404, message: 'Không tìm thấy bài viết văn hóa' };
    }

    // Log exploration
    await ExplorationLog.findOneAndUpdate(
      { childId: child._id, kind: 'culture', refId: article._id },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Evaluate quiz
    let correctCount = 0;
    const totalQuestions = article.quiz.length;

    article.quiz.forEach((q, idx) => {
      const submitted = data.answers.find((a) => a.questionIndex === idx);
      if (submitted && submitted.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    const isAllCorrect = totalQuestions > 0 && correctCount === totalQuestions;
    let pointsAwarded = 0;

    if (isAllCorrect) {
      try {
        await PointTransaction.create({
          childId: child._id,
          delta: POINT_RULES.CULTURE_QUIZ,
          reason: 'culture_quiz',
          refId: article._id.toString(),
          description: `Trả lời đúng đố vui văn hóa: ${article.title}`,
        });

        await Child.findByIdAndUpdate(child._id, {
          $inc: { viviPoints: POINT_RULES.CULTURE_QUIZ },
        });

        pointsAwarded = POINT_RULES.CULTURE_QUIZ;
      } catch (err: any) {
        // Idempotency: points already awarded previously for this article
        if (err.code !== 11000) throw err;
      }
    }

    const updatedChild = await Child.findById(child._id);

    return {
      correctCount,
      totalQuestions,
      isAllCorrect,
      pointsAwarded,
      totalPoints: updatedChild?.viviPoints || child.viviPoints,
    };
  }
}
