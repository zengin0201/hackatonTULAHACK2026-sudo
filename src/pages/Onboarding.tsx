import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, Loader2, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    housing: '',
    activity: '',
    other_pets: ''
  });

  // 1. Сначала проверяем наличие пользователя
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Проверяем, нужен ли онбординг
  const needsOnboarding = profile?.role === 'ADOPTER' && !profile?.onboarding_completed;
  
  if (!needsOnboarding) {
    return <Navigate to="/" replace />;
  }

  const handleNext = () => setStep(s => s + 1);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_answers: answers,
          onboarding_completed: true
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await refreshProfile();
      
      // Перенаправляем сразу
      navigate('/', { replace: true });
      
    } catch (e) {
      console.error('Onboarding save error:', e);
      alert('Произошла ошибка при сохранении данных.');
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 'housing',
      title: 'Где вы живете?',
      desc: 'Это поможет подобрать животное с подходящим уровнем энергии.',
      options: [
        { value: 'apartment', label: 'В квартире' },
        { value: 'house_yard', label: 'Дом с участком' }
      ]
    },
    {
      id: 'activity',
      title: 'Ваш уровень активности?',
      desc: 'Вы любите гулять часами или предпочитаете сериалы?',
      options: [
        { value: 'active', label: 'Активно гуляю (раннеры/хайкинг)' },
        { value: 'chill', label: 'Домосед (люблю лежать на диване)' }
      ]
    },
    {
      id: 'other_pets',
      title: 'Есть ли другие животные?',
      desc: 'Важно для определения зооагрессии',
      options: [
        { value: 'yes', label: 'Да, у меня уже есть питомец' },
        { value: 'no', label: 'Нет, это будет мой первый' }
      ]
    }
  ];

  const currentStep = steps[step - 1];

  const handleOptionSelect = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.id]: val }));
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.05)_0%,transparent_50%),radial-gradient(circle_at_90%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] p-6 bg-app-bg">
      <div className="bg-app-card p-10 rounded-[32px] border border-white/10 max-w-sm w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col min-h-[480px]">
        
        <div className="flex items-center gap-2 mb-8 text-app-dim text-sm font-semibold">
          <PawPrint className="w-5 h-5 text-app-accent" />
          <span>Шаг {step} из {steps.length}</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-app-text mb-2 leading-tight">
            {currentStep.title}
          </h2>
          <p className="text-app-dim text-sm mb-8">
            {currentStep.desc}
          </p>

          <div className="flex flex-col gap-3">
            {currentStep.options.map(opt => {
              const isSelected = (answers as any)[currentStep.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleOptionSelect(opt.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-app-accent/10 border-app-accent text-white shadow-lg shadow-app-accent/20' 
                      : 'bg-white/5 border-white/10 text-app-dim hover:bg-white/10'
                  }`}
                >
                  <span className="font-medium text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={step === steps.length ? handleFinish : handleNext}
            disabled={!(answers as any)[currentStep.id] || loading}
            className="w-full h-14 bg-app-accent text-app-bg font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                {step === steps.length ? 'Завершить' : 'Далее'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}