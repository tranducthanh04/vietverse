import React from 'react';
import { AudioButton } from '../../../components/ui/AudioButton.js';
import { Lightbulb } from '../../../components/ui/icons.js';
import { Mascot } from '../../../components/ui/Mascot.js';
import { PromptTranslation } from './PromptTranslation.js';
import { useT } from '../../../i18n/index.js';

export interface WordCardActivityProps {
  activity: {
    id: string;
    prompt: string;
    promptTranslations?: Partial<Record<string, string>>;
    subPrompt?: string;
    targetWord?: string;
    targetPhonetic?: string;
    audioUrl?: string;
    hints?: string[];
  };
  onComplete: (isCorrect: boolean) => void;
}

export const WordCardActivity: React.FC<WordCardActivityProps> = ({
  activity,
}) => {
  const t = useT();
  const targetText = activity.targetWord || 'A';
  const displayLength = Array.from(targetText.trim().normalize('NFC')).length;
  // Legacy lessons also store entire reading passages in targetWord.
  const isPassage = displayLength > 12 || targetText.trim().split(/\s+/).length > 2 || /[\r\n]/.test(targetText);
  const textClass = isPassage
    ? 'text-2xl md:text-3xl leading-relaxed font-bold text-left'
    : displayLength > 4
      ? 'text-4xl md:text-5xl leading-snug font-black'
      : 'text-6xl md:text-8xl leading-tight font-black';

  return (
    <div className="flex w-full min-w-0 flex-col items-center p-4 sm:p-6 text-center max-w-2xl mx-auto">
      <div className="mb-4">
        <Mascot mood="talking" size="md" />
      </div>

      <h2 className="max-w-full break-words text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-2">
        {activity.prompt}
      </h2>
      <PromptTranslation translations={activity.promptTranslations} />

      {activity.subPrompt && (
        <div className="w-full min-w-0 mb-6 space-y-3">
          <p className="whitespace-pre-line break-words text-stone-600 text-kid-base">{activity.subPrompt}</p>
          <AudioButton contentKey={activity.id} textToSpeak={activity.subPrompt} label={t('lesson.readPassage')} size="sm" />
        </div>
      )}

      <div className={`w-full min-w-0 ${isPassage ? '' : 'max-w-72 min-h-64 md:min-h-72'} bg-white border-4 border-accent rounded-3xl shadow-kid-card flex flex-col items-center justify-center gap-4 p-6 my-4`}>
        <p className={`w-full min-w-0 whitespace-pre-line break-words font-display text-primary ${textClass}`}>
          {targetText}
        </p>

        {activity.targetPhonetic && (
          <span className="max-w-full break-words text-kid-base text-stone-500 font-semibold">
            /{activity.targetPhonetic}/
          </span>
        )}

        <div className="max-w-full">
          <AudioButton
            contentKey={activity.id}
            audioUrl={activity.audioUrl}
            textToSpeak={activity.targetWord}
            size="lg"
            label={t('lesson.listenRead')}
            autoPlay
          />
        </div>
      </div>

      {activity.hints && activity.hints.length > 0 && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 mt-4 text-sm max-w-md flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
          <span>{activity.hints[0]}</span>
        </div>
      )}
    </div>
  );
};
