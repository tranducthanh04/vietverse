import { Link } from 'react-router-dom';
import {
  CircleCheck,
  Clock,
  LockKeyhole,
} from '../../components/ui/icons.js';
import { Card } from '../../components/ui/Card.js';
import { formatPoints } from '../../lib/utils.js';
import { useChildStore } from '../../store/childStore.js';
import { useT, useUiLanguage, type Translate } from '../../i18n/index.js';
import type { ParentProgress, ParentRecentActivity, ParentStageProgress } from './parentProgress.types.js';

function stageDescription(stage: ParentStageProgress, t: Translate) {
  if (stage.isCompleted) return t('parentPortal.stageDone');
  switch (stage.lockReason) {
    case 'no_lessons': return t('parentPortal.stageNoLessons');
    case 'subscription': return t('parentPortal.stageSubscription');
    case 'previous_stage': return t('parentPortal.stagePreviousStage');
    default: return t('parentPortal.stageOpen');
  }
}

export function ParentJourney({ journey, child }: Pick<ParentProgress, 'journey' | 'child'>) {
  const t = useT();
  const { language } = useUiLanguage();
  const activeChildId = useChildStore(state => state.activeChild?._id);
  const current = journey?.stages.find(stage => stage.id === journey.currentStageId);
  return (
    <section aria-labelledby="parent-journey-title" className="space-y-4">
      <h2 id="parent-journey-title" className="text-xl font-bold font-display text-stone-800">{t('parentPortal.journeyTitle')}</h2>
      <Card className="p-5 sm:p-6 bg-white border-cream-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            {journey?.isCompleted ? (
              <p className="font-bold text-emerald-800 flex items-center gap-2"><CircleCheck className="w-5 h-5 shrink-0" />{t('parentPortal.journeyAllComplete')}</p>
            ) : current ? (
              <>
                <p className="font-bold text-stone-800 break-words">{t('parentPortal.journeyCurrent', { title: current.title })}</p>
                <p className="text-sm text-stone-600 mt-1">{stageDescription(current, t)}</p>
              </>
            ) : <p className="text-stone-600">{t('parentPortal.journeyNoData')}</p>}
          </div>
          <div className="sm:text-right shrink-0">
            {child && <p className="font-black text-xl text-primary">{formatPoints(child.viviPoints, language)} {t('parentPortal.journeyPointsUnit')}</p>}
            <Link to="/diem-thuong" className="inline-flex items-center min-h-[44px] text-sm font-bold text-primary underline underline-offset-4 rounded focus-visible:outline focus-visible:outline-2">
              {t('parentPortal.viewPoints')}
            </Link>
            <p className="text-xs text-stone-500">{t('parentPortal.viewPointsHint')}</p>
          </div>
        </div>
      </Card>
      {!!journey?.stages.length && (
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {journey.stages.map(stage => (
            <li key={stage.id} aria-current={stage.id === journey.currentStageId ? 'step' : undefined}>
              <Card className={`p-5 h-full bg-white ${stage.id === journey.currentStageId ? 'border-primary' : 'border-cream-border'}`}>
                <h3 className="font-bold font-display text-stone-800 break-words">{stage.title}</h3>
                <p className="text-sm text-stone-600 mt-2">{t('parentPortal.lessonsDone', { completed: stage.completedCount, total: stage.totalLessons })}</p>
                <div role="progressbar" aria-label={t('parentPortal.stageProgressAria', { title: stage.title })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.percentage} aria-valuetext={t('parentPortal.lessonsDone', { completed: stage.completedCount, total: stage.totalLessons })} className="h-2.5 my-3 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${stage.percentage}%` }} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-stone-600">
                  {stage.isCompleted ? <CircleCheck className="w-4 h-4 shrink-0 text-emerald-600" /> : stage.lockReason ? <LockKeyhole className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  {stageDescription(stage, t)}
                </p>
                {child?.id === activeChildId && (
                  <Link
                    to={`/kham-pha?${new URLSearchParams({ stage: stage.id, childId: child.id })}`}
                    aria-label={`${t(stage.isUnlocked && !stage.isCompleted && stage.totalLessons > 0 ? 'parentPortal.continueStage' : 'parentPortal.viewStage')}: ${stage.title}`}
                    className="inline-flex items-center min-h-[44px] mt-2 text-sm font-bold text-primary underline underline-offset-4 rounded focus-visible:outline focus-visible:outline-2"
                  >
                    {t(stage.isUnlocked && !stage.isCompleted && stage.totalLessons > 0 ? 'parentPortal.continueStage' : 'parentPortal.viewStage')}
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function activityLabel(activity: ParentRecentActivity, t: Translate) {
  switch (activity.kind) {
    case 'lesson': return activity.lessonStatus === 'completed' ? t('parentPortal.actLessonCompleted') : t('parentPortal.actLessonPracticing');
    case 'recording': return t('parentPortal.actRecording');
    case 'story': return t('parentPortal.actStory');
    case 'culture': return t('parentPortal.actCulture');
  }
}

export function ParentRecentActivities({ activities = [] }: { activities?: ParentRecentActivity[] }) {
  const t = useT();
  return (
    <section aria-labelledby="parent-activity-title" className="space-y-4">
      <div>
        <h2 id="parent-activity-title" className="text-xl font-bold font-display text-stone-800">{t('parentPortal.recentTitle')}</h2>
        <p className="text-sm text-stone-500">{t('parentPortal.recentNote')}</p>
      </div>
      <Card className="p-5 sm:p-6 bg-white border-cream-border">
        {activities.length === 0 ? <p className="text-sm text-stone-600">{t('parentPortal.recentEmpty')}</p> : (
          <ol className="divide-y divide-cream-border">
            {activities.map(activity => (
              <li key={activity.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary">{activityLabel(activity, t)}</p>
                  <p className="text-sm text-stone-800 font-semibold break-words mt-1">{activity.title}</p>
                </div>
                <time dateTime={activity.occurredAt} className="text-xs text-stone-500 shrink-0">
                  {new Date(activity.occurredAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
