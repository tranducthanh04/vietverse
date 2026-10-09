import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, LockKeyhole } from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import type { ParentProgress, ParentRecentActivity, ParentStageProgress } from './parentProgress.types.js';

function stageDescription(stage: ParentStageProgress) {
  if (stage.isCompleted) return 'Đã hoàn thành';
  switch (stage.lockReason) {
    case 'no_lessons': return 'Chưa có bài học';
    case 'subscription': return 'Cần gói học còn hiệu lực và hoàn thành chặng trước';
    case 'previous_stage': return 'Cần hoàn thành chặng trước';
    default: return 'Đang mở';
  }
}

export function ParentJourney({ journey, child }: Pick<ParentProgress, 'journey' | 'child'>) {
  const current = journey?.stages.find(stage => stage.id === journey.currentStageId);
  return (
    <section aria-labelledby="parent-journey-title" className="space-y-4">
      <h2 id="parent-journey-title" className="text-xl font-bold font-display text-stone-800">Hành trình học tập</h2>
      <Card className="p-5 sm:p-6 bg-white border-cream-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            {journey?.isCompleted ? (
              <p className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />Đã hoàn thành tất cả chặng học</p>
            ) : current ? (
              <>
                <p className="font-bold text-stone-800 break-words">Chặng hiện tại: {current.title}</p>
                <p className="text-sm text-stone-600 mt-1">{stageDescription(current)}</p>
              </>
            ) : <p className="text-stone-600">Chưa có dữ liệu chặng học.</p>}
          </div>
          <div className="sm:text-right shrink-0">
            {child && <p className="font-black text-xl text-primary">{child.viviPoints.toLocaleString('vi-VN')} ViVi</p>}
            <Link to="/diem-thuong" className="inline-flex items-center min-h-[44px] text-sm font-bold text-primary underline underline-offset-4 rounded focus-visible:outline focus-visible:outline-2">
              Xem điểm và lịch sử
            </Link>
            <p className="text-xs text-stone-500">Mở kho điểm của bé</p>
          </div>
        </div>
      </Card>
      {!!journey?.stages.length && (
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {journey.stages.map(stage => (
            <li key={stage.id} aria-current={stage.id === journey.currentStageId ? 'step' : undefined}>
              <Card className={`p-5 h-full bg-white ${stage.id === journey.currentStageId ? 'border-primary' : 'border-cream-border'}`}>
                <h3 className="font-bold font-display text-stone-800 break-words">{stage.title}</h3>
                <p className="text-sm text-stone-600 mt-2">{stage.completedCount}/{stage.totalLessons} bài hoàn thành</p>
                <div role="progressbar" aria-label={`Tiến độ ${stage.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.percentage} aria-valuetext={`${stage.completedCount}/${stage.totalLessons} bài hoàn thành`} className="h-2.5 my-3 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${stage.percentage}%` }} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-stone-600">
                  {stage.isCompleted ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : stage.lockReason ? <LockKeyhole className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  {stageDescription(stage)}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function activityLabel(activity: ParentRecentActivity) {
  switch (activity.kind) {
    case 'lesson': return activity.lessonStatus === 'completed' ? 'Hoàn thành bài học' : 'Luyện tập bài học';
    case 'recording': return 'Thu âm';
    case 'story': return 'Khám phá truyện';
    case 'culture': return 'Khám phá văn hóa';
  }
}

export function ParentRecentActivities({ activities = [] }: { activities?: ParentRecentActivity[] }) {
  return (
    <section aria-labelledby="parent-activity-title" className="space-y-4">
      <div>
        <h2 id="parent-activity-title" className="text-xl font-bold font-display text-stone-800">Hoạt động gần đây</h2>
        <p className="text-sm text-stone-500">Tối đa 10 ghi nhận gần nhất. Mỗi bài học hiển thị trạng thái mới nhất; truyện và văn hóa ghi lần khám phá đầu tiên.</p>
      </div>
      <Card className="p-5 sm:p-6 bg-white border-cream-border">
        {activities.length === 0 ? <p className="text-sm text-stone-600">Chưa có hoạt động được ghi nhận cho bé.</p> : (
          <ol className="divide-y divide-cream-border">
            {activities.map(activity => (
              <li key={activity.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary">{activityLabel(activity)}</p>
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
