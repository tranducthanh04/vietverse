import React from 'react';
import { AudioButton } from '../../../components/ui/AudioButton.js';
import { Mascot } from '../../../components/ui/Mascot.js';

export interface WordCardActivityProps {
  activity: {
    id: string;
    prompt: string;
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
  onComplete,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <div className="mb-4">
        <Mascot mood="talking" size="md" />
      </div>

      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-2">
        {activity.prompt}
      </h2>

      {activity.subPrompt && (
        <p className="text-stone-600 text-kid-base mb-6">{activity.subPrompt}</p>
      )}

      {/* Big 3D Flashcard */}
      <div className="w-64 h-64 md:w-72 md:h-72 bg-white border-4 border-accent rounded-3xl shadow-kid-card flex flex-col items-center justify-center p-6 my-4 transform transition hover:scale-105">
        <span className="text-7xl md:text-8xl font-black font-display text-primary tracking-wider">
          {activity.targetWord || 'A'}
        </span>

        {activity.targetPhonetic && (
          <span className="text-kid-base text-stone-500 font-semibold mt-2">
            /{activity.targetPhonetic}/
          </span>
        )}

        <div className="mt-4">
          <AudioButton
            audioUrl={activity.audioUrl}
            textToSpeak={activity.targetWord}
            size="lg"
            label="Nghe đọc"
          />
        </div>
      </div>

      {activity.hints && activity.hints.length > 0 && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 mt-4 text-sm max-w-md">
          💡 {activity.hints[0]}
        </div>
      )}
    </div>
  );
};
