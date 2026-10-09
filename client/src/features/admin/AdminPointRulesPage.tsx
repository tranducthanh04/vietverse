import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

export type PointRuleKey =
  | 'LESSON_COMPLETE'
  | 'ACTIVITY_COMPLETE'
  | 'CULTURE_QUIZ'
  | 'STAGE_COMPLETE'
  | 'LESSON_20_TREASURE';

export interface PointRule {
  key: PointRuleKey;
  amount: number;
  active: boolean;
  defaultAmount: number;
  customized: boolean;
  updatedAt: string | null;
}

const MAX_AMOUNT = 1000;

const RULE_LABELS: Record<PointRuleKey, { label: string; hint: string }> = {
  LESSON_COMPLETE: { label: 'Hoàn thành bài học', hint: 'Một lần cho mỗi bé/bài khi đạt từ 50%' },
  ACTIVITY_COMPLETE: { label: 'Hoàn thành hoạt động', hint: 'Mỗi hoạt động đạt lần đầu trong lượt nộp đỗ' },
  CULTURE_QUIZ: { label: 'Hoàn thành thử thách', hint: 'Quiz văn hóa đúng toàn bộ, một lần mỗi bài viết' },
  STAGE_COMPLETE: { label: 'Hoàn thành toàn bộ chặng', hint: 'Một lần cho mỗi bé/chặng' },
  LESSON_20_TREASURE: { label: 'Hoàn thành bài 20 (báu vật)', hint: 'Một lần cho mỗi bé/bài 20' },
};

function errorMessage(err: unknown): string {
  const response = (err as { response?: { data?: { error?: { message?: string } } } })?.response;
  return response?.data?.error?.message || 'Không thể lưu quy tắc điểm.';
}

const RuleRow: React.FC<{ rule: PointRule }> = ({ rule }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(String(rule.amount));
  const [active, setActive] = useState(rule.active);
  const [error, setError] = useState<string | null>(null);
  const meta = RULE_LABELS[rule.key];

  const parsedAmount = Number(amount);
  const amountValid = amount.trim() !== '' && Number.isInteger(parsedAmount) && parsedAmount >= 0 && parsedAmount <= MAX_AMOUNT;
  const dirty = parsedAmount !== rule.amount || active !== rule.active;

  const mutation = useMutation({
    mutationFn: async (payload: { amount: number; active: boolean }) => {
      const res = await api.patch(`/admin/point-rules/${rule.key}`, payload);
      return res.data.data as PointRule;
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['adminPointRules'] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const save = () => {
    if (!amountValid) {
      setError(`Số điểm phải là số nguyên từ 0 đến ${MAX_AMOUNT}.`);
      return;
    }
    mutation.mutate({ amount: parsedAmount, active });
  };

  const inputId = `point-rule-${rule.key}`;
  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="py-3 pr-4">
        <label htmlFor={inputId} className="font-bold text-stone-800 block">{meta?.label ?? rule.key}</label>
        <span className="text-xs text-stone-500 block">{meta?.hint}</span>
        <span className="text-xs text-stone-400 block">Mặc định: {rule.defaultAmount} điểm</span>
      </td>
      <td className="py-3 pr-4">
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_AMOUNT}
          step={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={!amountValid}
          className="w-24 min-h-[44px] px-3 rounded-xl border border-cream-border bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </td>
      <td className="py-3 pr-4">
        <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm">
          <input
            type="checkbox"
            role="switch"
            aria-checked={active}
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="w-5 h-5 accent-primary"
            aria-label={`Bật quy tắc ${meta?.label ?? rule.key}`}
          />
          <span className={active ? 'text-green-700 font-bold' : 'text-stone-500'}>{active ? 'Đang bật' : 'Đã tắt'}</span>
        </label>
      </td>
      <td className="py-3">
        <Button size="sm" onClick={save} disabled={!dirty || mutation.isPending} isLoading={mutation.isPending}>
          Lưu
        </Button>
        {error && <p role="alert" className="text-xs text-red-600 mt-1 max-w-[200px]">{error}</p>}
      </td>
    </tr>
  );
};

export const AdminPointRulesPage: React.FC = () => {
  const { data: rules = [], isLoading, error, refetch } = useQuery({
    queryKey: ['adminPointRules'],
    queryFn: async () => {
      const res = await api.get('/admin/point-rules');
      return res.data.data as PointRule[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-primary" />
          <span>Quy tắc điểm ViVi</span>
        </h1>
        <p className="text-sm text-stone-500">
          Chỉnh số điểm hoặc tắt các quy tắc có sẵn. Thay đổi áp dụng cho lượt nộp mới trong khoảng 1 phút, không cộng
          hay trừ lại điểm đã cấp. Quy tắc tắt sẽ không cấp điểm.
        </p>
      </div>

      <Card className="overflow-x-auto">
        {error ? (
          <QueryErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Đang tải quy tắc điểm...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-2 pr-4 font-bold">Quy tắc</th>
                <th className="pb-2 pr-4 font-bold">ViVi Points</th>
                <th className="pb-2 pr-4 font-bold">Trạng thái</th>
                <th className="pb-2 font-bold"><span className="sr-only">Lưu</span></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                // Re-mount on server change so the row's draft resets to the saved values.
                <RuleRow key={`${rule.key}:${rule.amount}:${rule.active}:${rule.updatedAt ?? ''}`} rule={rule} />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
