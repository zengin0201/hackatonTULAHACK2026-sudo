import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, isLoading, refreshProfile } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADOPTER' | 'SHELTER'>('ADOPTER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          await refreshProfile();
          navigate('/');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, name }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          
          const { error: insertError } = await supabase.from('profiles').upsert([{
             id: data.user.id,
             email,
             role,
             onboarding_answers: {}
          }]);
          
          if (insertError) {
             throw new Error(`Ошибка записи профиля в таблицу profiles (проверьте RLS или триггеры): ${insertError.message}`);
          }
          
          await refreshProfile();
          
          
          setTimeout(() => navigate('/'), 100);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes("rate limit")) {
        setError("Supabase: Превышен лимит регистраций с одного IP (Email rate limit exceeded). Зайдите в Supabase -> Authentication -> Rate Limits -> отключите ограничения или увеличьте лимит, чтобы тестировать неограниченно.");
      } else {
        setError(err.message || 'Произошла ошибка при авторизации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.05)_0%,transparent_50%),radial-gradient(circle_at_90%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] p-6 bg-app-bg">
      <div className="bg-app-card p-10 rounded-[32px] border border-white/10 max-w-sm w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-8">
          <div className="text-2xl font-extrabold text-app-accent tracking-tighter flex items-center gap-2 mb-2">
            <PawPrint className="w-8 h-8" /> PawMatch
          </div>
          <p className="text-app-dim text-sm text-center">
            {isLogin ? 'И снова здравствуйте!' : 'Создайте аккаунт, чтобы найти друга'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 relative rounded-xl border border-app-danger/30 bg-app-danger/10 text-app-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="flex bg-white/5 p-1 rounded-2xl mb-2 items-center w-full">
                <button
                  type="button"
                  onClick={() => setRole('ADOPTER')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${role === 'ADOPTER' ? 'bg-app-accent text-app-bg shadow-md' : 'text-app-dim hover:text-app-text'}`}
                >
                  Я ищу питомца
                </button>
                <button
                  type="button"
                  onClick={() => setRole('SHELTER')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${role === 'SHELTER' ? 'bg-app-accent text-app-bg shadow-md' : 'text-app-dim hover:text-app-text'}`}
                >
                  Я приют
                </button>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">Имя / Название</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all"
                  placeholder="Как к вам обращаться?"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all"
              placeholder="hello@pawmatch.com"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-accent text-app-bg font-bold py-3.5 rounded-xl hover:bg-sky-300 transition-colors mt-4 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }} 
            className="text-app-dim hover:text-app-accent text-sm transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}
