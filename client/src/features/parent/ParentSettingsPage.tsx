import React, { useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const ParentSettingsPage: React.FC = () => {
  const { activeChild, selectChild } = useChildStore();
  const [selectedLimit, setSelectedLimit] = useState<number>(
    activeChild?.screenTimeLimit ?? 20
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const options = [
    { value: 15, label: '15 phút', desc: 'Phù hợp cho bé mới bắt đầu tập trung' },
    { value: 20, label: '20 phút (Khuyên dùng)', desc: 'Thời lượng chuẩn bảo vệ thị lực của bé' },
    { value: 30, label: '30 phút', desc: 'Cho các bé lớn hơn rèn luyện nhiều bài' },
    { value: 0, label: 'Không giới hạn', desc: 'Bé có thể tự do học mà không ngắt phiên' },
  ];

  const handleSave = async () => {
    if (!activeChild?._id) return;
    try {
      setIsSaving(true);
      await api.patch('/parent/screen-time', {
        childId: activeChild._id,
        limitMinutes: selectedLimit,
      });
      await selectChild(activeChild._id);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold font-display text-stone-800">
          {VI_LOCALES.parentPortal.screenTimeTitle}
        </h2>
        <p className="text-sm text-stone-500">
          {VI_LOCALES.parentPortal.screenTimeDesc}
        </p>
      </div>

      <Card className="p-6 bg-white border border-cream-border">
        <div className="space-y-3 mb-6">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedLimit(opt.value)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                selectedLimit === opt.value
                  ? 'border-primary bg-primary-light/40 shadow-sm'
                  : 'border-cream-border bg-white hover:border-accent'
              }`}
            >
              <div>
                <span className="font-bold text-stone-800 text-base font-display block">
                  {opt.label}
                </span>
                <span className="text-xs text-stone-500">{opt.desc}</span>
              </div>

              {selectedLimit === opt.value && (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-cream-border">
          {isSaved ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>{VI_LOCALES.parentPortal.saveSuccess}</span>
            </span>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
          >
            {VI_LOCALES.parentPortal.btnSaveSettings}
          </Button>
        </div>
      </Card>
    </div>
  );
};
