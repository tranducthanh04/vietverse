import { IActivity } from '../../models/Lesson.js';

export interface ActivitySubmission {
  activityId: string;
  userAnswer?: any;
  isCorrect?: boolean;
}

/**
 * Server-side grading of child's activity submission against the lesson activity definition.
 * Does NOT trust client score or isCorrect when canonical answers are present.
 */
export function gradeActivity(activity: IActivity, submission?: ActivitySubmission): boolean {
  if (!submission) return false;

  switch (activity.type) {
    case 'word_card':
      // Word cards are introductory visual/audio flashcards.
      // Completing/viewing the card is considered successful.
      return true;

    case 'record_voice':
      // Voice recording activity: considered completed if recorded or marked completed by child
      return Boolean(submission.userAnswer || submission.isCorrect);

    case 'listen_choose':
    case 'review': {
      if (submission.userAnswer !== undefined && submission.userAnswer !== null) {
        const expected = String(activity.correctAnswer ?? '').trim().toLowerCase();
        const actual = String(submission.userAnswer).trim().toLowerCase();
        if (actual && actual === expected) return true;

        // Check if actual is option ID and expected is option text, or vice versa
        if (activity.options && Array.isArray(activity.options)) {
          const matchingOption = activity.options.find(
            (opt) =>
              opt.id.toLowerCase() === actual ||
              Boolean(opt.text && opt.text.trim().toLowerCase() === actual)
          );
          if (matchingOption) {
            return (
              matchingOption.id.toLowerCase() === expected ||
              Boolean(matchingOption.text && matchingOption.text.trim().toLowerCase() === expected)
            );
          }
        }
        return false;
      }
      // If activity has no correctAnswer defined in DB, fallback to isCorrect
      if (!activity.correctAnswer && submission.isCorrect !== undefined) {
        return Boolean(submission.isCorrect);
      }
      return false;
    }

    case 'fill_blank': {
      if (submission.userAnswer !== undefined && submission.userAnswer !== null) {
        const actual = String(submission.userAnswer).trim().toLowerCase();
        if (activity.correctAnswer && String(activity.correctAnswer).trim().toLowerCase() === actual) {
          return true;
        }
        if (activity.blanks && activity.blanks.length > 0) {
          const missing = String(activity.blanks[0].missing ?? '').trim().toLowerCase();
          if (missing && actual === missing) return true;
        }
        if (activity.options && Array.isArray(activity.options)) {
          const opt = activity.options.find(
            (o) =>
              o.id.toLowerCase() === actual ||
              Boolean(o.text && o.text.trim().toLowerCase() === actual)
          );
          if (opt) {
            if (
              activity.correctAnswer &&
              (opt.id.toLowerCase() === String(activity.correctAnswer).toLowerCase() ||
                Boolean(opt.text && opt.text.toLowerCase() === String(activity.correctAnswer).toLowerCase()))
            ) {
              return true;
            }
            if (
              activity.blanks?.[0]?.missing &&
              opt.text &&
              opt.text.toLowerCase() === activity.blanks[0].missing.toLowerCase()
            ) {
              return true;
            }
          }
        }
        return false;
      }
      if (!activity.correctAnswer && (!activity.blanks || activity.blanks.length === 0) && submission.isCorrect !== undefined) {
        return Boolean(submission.isCorrect);
      }
      return false;
    }

    case 'sort_order': {
      const expected = Array.isArray(activity.correctAnswer)
        ? activity.correctAnswer
        : activity.orderedItems;
      if (!expected || !Array.isArray(expected)) return true;

      if (Array.isArray(submission.userAnswer)) {
        if (submission.userAnswer.length !== expected.length) return false;
        return expected.every(
          (item, i) =>
            String(item).trim().toLowerCase() ===
            String(submission.userAnswer[i]).trim().toLowerCase()
        );
      }
      return false;
    }

    case 'drag_match': {
      if (activity.pairs && Array.isArray(activity.pairs) && activity.pairs.length > 0) {
        if (!submission.userAnswer || typeof submission.userAnswer !== 'object') return false;
        return activity.pairs.every((pair) => {
          const answeredRight = submission.userAnswer[pair.left];
          return (
            answeredRight &&
            String(answeredRight).trim().toLowerCase() === String(pair.right).trim().toLowerCase()
          );
        });
      }
      if (Array.isArray(activity.correctAnswer) && Array.isArray(submission.userAnswer)) {
        if (activity.correctAnswer.length !== submission.userAnswer.length) return false;
        return activity.correctAnswer.every(
          (item, i) =>
            String(item).trim().toLowerCase() ===
            String(submission.userAnswer[i]).trim().toLowerCase()
        );
      }
      if (!activity.pairs && !activity.correctAnswer && submission.isCorrect !== undefined) {
        return Boolean(submission.isCorrect);
      }
      return false;
    }

    default:
      return Boolean(submission.isCorrect);
  }
}
