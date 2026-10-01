import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
      <Mascot mood="thinking" size="xl" className="mb-6" />

      <h1 className="text-kid-2xl md:text-5xl font-black font-display text-primary mb-2">
        {VI_LOCALES.errors.notFoundTitle}
      </h1>

      <p className="text-stone-600 text-kid-base max-w-md mb-8">
        {VI_LOCALES.errors.notFoundDesc}
      </p>

      <Button
        variant="primary"
        size="kid"
        onClick={() => navigate('/')}
      >
        {VI_LOCALES.errors.backHome}
      </Button>
    </div>
  );
};
