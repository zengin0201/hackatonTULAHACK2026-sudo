import React, { useState, useEffect } from 'react';
import { LogOut, User, Settings, Heart, MessageCircle, Info, Edit3, Check, PawPrint, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

export default function Profile() {
  
  const { user, profile, isLoading, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({ likes: 0, matches: 0, pets: 0 });
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    housing: '',
    activity: '',
    other_pets: ''
  });

  useEffect(() => {
    if (profile?.onboarding_answers) {
      setFormData({
        housing: profile.onboarding_answers.housing || '',
        activity: profile.onboarding_answers.activity || '',
        other_pets: profile.onboarding_answers.other_pets || ''
      });
    }
  }, [profile]);

  // Реальное сохранение в Supabase
  const handleSavePreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_answers: formData 
        })
        .eq('id', user.id);

      if (error) throw error;
      
      
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('не удалось сохранить изменения');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const effectiveRole = profile?.role || user?.user_metadata?.role;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0F172A]">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-2xl mx-auto flex flex-col gap-6 overflow-y-auto pb-10 px-4 bg-[#0F172A] text-white">
      
      {/* Карточка профиля */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#1E293B] rounded-[32px] border border-white/10 shadow-2xl p-8 relative overflow-hidden mt-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0F172A] border-4 border-sky-500/20 flex items-center justify-center shrink-0 shadow-xl overflow-hidden text-sky-400">
             <User size={40} />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-sky-400 mb-1 font-bold">
              {effectiveRole === 'SHELTER' ? 'Аккаунт Приюта' : 'Аккаунт Усыновителя'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 truncate">
                {user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-slate-400 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-red-400 transition-colors border border-white/5"
          >
            <LogOut size={20} />
          </button>
        </div>
      </motion.div>

      {/* Статистика */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 flex flex-col items-center justify-center text-center shadow-lg relative group">
          <Heart className="w-8 h-8 text-emerald-400 mb-3" />
          <div className="text-3xl font-extrabold text-white mb-1">
              {effectiveRole === 'ADOPTER' ? stats.likes : stats.pets}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">
              {effectiveRole === 'ADOPTER' ? 'Симпатий' : 'Питомцев'}
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 flex flex-col items-center justify-center text-center shadow-lg relative group">
          <MessageCircle className="w-8 h-8 text-sky-400 mb-3" />
          <div className="text-3xl font-extrabold text-white mb-1">{stats.matches}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Матчей</div>
        </div>
      </motion.div>

      {/* Редактор предпочтений (Только для усыновителей) */}
      {effectiveRole === 'ADOPTER' && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1E293B] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-sky-400" />
                <h2 className="text-xl font-bold">Настройки подбора</h2>
              </div>
              <button 
                onClick={() => isEditing ? handleSavePreferences() : setIsEditing(true)}
                disabled={loading}
                className={`h-10 px-6 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                  isEditing 
                    ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <><Check size={16} /> Сохранить</> : <><Edit3 size={16} /> Изменить</>}
              </button>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col gap-6">
            {/* Поля формы аналогичны твоему коду, они уже используют formData */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Где вы живете?</label>
              {isEditing ? (
                <select 
                  value={formData.housing} 
                  onChange={e => setFormData({...formData, housing: e.target.value})}
                  className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">Не указано</option>
                  <option value="apartment">В квартире</option>
                  <option value="house_yard">Дом с участком</option>
                </select>
              ) : (
                <div className="text-white text-lg px-1">
                  {formData.housing === 'apartment' ? 'В квартире' : formData.housing === 'house_yard' ? 'Дом с участком' : 'Не указано'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Ваш уровень активности</label>
              {isEditing ? (
                <select 
                  value={formData.activity} 
                  onChange={e => setFormData({...formData, activity: e.target.value})}
                  className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">Не указано</option>
                  <option value="active">Активно гуляю (раннеры/хайкинг)</option>
                  <option value="chill">Домосед (люблю лежать на диване)</option>
                </select>
              ) : (
                <div className="text-white text-lg px-1">
                  {formData.activity === 'active' ? 'Активно гуляю' : formData.activity === 'chill' ? 'Домосед' : 'Не указано'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Другие животные</label>
              {isEditing ? (
                <select 
                  value={formData.other_pets} 
                  onChange={e => setFormData({...formData, other_pets: e.target.value})}
                  className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">Не указано</option>
                  <option value="yes">Да, уже есть</option>
                  <option value="no">Нет, это будет первый</option>
                </select>
              ) : (
                <div className="text-white text-lg px-1">
                  {formData.other_pets === 'yes' ? 'Да, уже есть питомцы' : formData.other_pets === 'no' ? 'Нет, это будет первый' : 'Не указано'}
                </div>
              )}
            </div>
            
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-start gap-3 text-sm text-sky-400"
              >
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Эти параметры помогут алгоритму точнее вычислять <b>Match %</b> в вашей ленте.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Инфо для приютов */}
      {effectiveRole === 'SHELTER' && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1E293B] rounded-[32px] border border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400"
        >
          <PawPrint className="w-12 h-12 mb-4 opacity-20" />
          <p className="max-w-xs text-sm">Вы используете аккаунт приюта. Управление вашими подопечными доступно в разделе "Дашборд".</p>
        </motion.div>
      )}

    </div>
  );
}