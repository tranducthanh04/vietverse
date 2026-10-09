import { CultureArticle } from '../../models/CultureArticle.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { Child } from '../../models/Child.js';
import { getPointRuleAmount } from '../../services/pointRules.service.js';
import { readPublished, resolveSubmissionVersion } from '../content/content.reader.js';
import { toContentPayload } from '../content/content.dto.js';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class CultureService {
  static async getArticles(filter: { category?: string; search?: string }) {
    const query: any = { visibility: { $ne: 'withdrawn' } };
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.search && filter.search.trim()) {
      const safeSearch = escapeRegex(filter.search.trim().slice(0, 50));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { intro: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    const articles = await CultureArticle.find(query).sort({ createdAt: -1 }).limit(100);
    return articles.map(article => ({ ...toContentPayload('culture', article), _id: article.id, id: article.id, contentVersion: article.contentVersion ?? 0 }));
  }

  static async getArticleById(id: string) {
    const published = await readPublished('culture', id);
    return { ...published.payload, _id: id, id, contentVersion: published.contentVersion };
  }

  static async submitQuiz(
    articleId: string,
    parentId: string,
    data: { childId: string; contentVersion?: number; answers: { questionIndex: number; selectedAnswer: number }[] }
  ) {
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }

    const article = await CultureArticle.findOne({ _id: articleId, visibility: { $ne: 'withdrawn' } });
    if (!article) {
      throw { statusCode: 404, message: 'Không tìm thấy bài viết văn hóa' };
    }
    const version = resolveSubmissionVersion(data.contentVersion, article.contentVersion ?? 0);
    const { payload } = await readPublished('culture', articleId, version);
    if (new Set(data.answers.map(answer => answer.questionIndex)).size !== data.answers.length || data.answers.some(answer =>
      !payload.quiz[answer.questionIndex] || answer.selectedAnswer >= payload.quiz[answer.questionIndex].options.length)) {
      throw { statusCode: 400, message: 'Câu trả lời trắc nghiệm không hợp lệ.' };
    }

    // Log exploration idempotently
    try {
      await ExplorationLog.findOneAndUpdate(
        { childId: child._id, kind: 'culture', refId: article._id },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    } catch (err: any) {
      if (err.code !== 11000) throw err;
    }

    // Evaluate quiz
    let correctCount = 0;
    const totalQuestions = payload.quiz.length;

    payload.quiz.forEach((q, idx) => {
      const submitted = data.answers.find((a) => a.questionIndex === idx);
      if (submitted && submitted.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    const isAllCorrect = totalQuestions > 0 && correctCount === totalQuestions;
    let pointsAwarded = 0;

    // Rule may be disabled/zeroed by admin (D3): then no transaction is written.
    const quizAmount = isAllCorrect ? await getPointRuleAmount('CULTURE_QUIZ') : 0;
    if (isAllCorrect && quizAmount > 0) {
      // Check if child has already been awarded points for this culture quiz
      const existingTxn = await PointTransaction.findOne({
        childId: child._id,
        reason: 'culture_quiz',
        refId: article._id.toString(),
      });

      if (!existingTxn) {
        try {
          const txn = await PointTransaction.create({
            childId: child._id,
            delta: quizAmount,
            reason: 'culture_quiz',
            refId: article._id.toString(),
            description: `Trả lời đúng đố vui văn hóa: ${article.title}`,
          });

          try {
            await Child.findByIdAndUpdate(child._id, {
              $inc: { viviPoints: quizAmount },
            });
            pointsAwarded = quizAmount;
          } catch (childErr) {
            await PointTransaction.findByIdAndDelete(txn._id);
            throw childErr;
          }
        } catch (err: any) {
          // Idempotency: duplicate key race condition protection
          if (err.code !== 11000) throw err;
        }
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
