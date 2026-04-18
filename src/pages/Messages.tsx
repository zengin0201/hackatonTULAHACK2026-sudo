import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { Loader2, Send, MessageCircle, ArrowLeft, Star, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Messages() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${user?.id},shelter_id.eq.${user?.id}`);
        
      if (error) throw error;
      
      if (matchesData && matchesData.length > 0) {
        const petIds = matchesData.map(m => m.pet_id);
        const { data: pets } = await supabase.from('pets').select('*').in('id', petIds);
        
        const enriched = matchesData.map(m => ({
          ...m,
          pet: pets?.find(p => p.id === m.pet_id)
        }));
        
        setMatches(enriched);
      }
    } catch (e) {
      console.error('Error fetching matches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeMatch) return;
    
    setRating(activeMatch.shelter_rating || 0); 
    setRatingSubmitted(false);
    fetchMessages();
    
    const channel = supabase.channel(`match_${activeMatch.id}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${activeMatch.id}` }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', activeMatch.id)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  // ТА САМАЯ ФУНКЦИЯ, КОТОРОЙ НЕ ХВАТАЛО
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeMatch || !user) return;

    const newMessage = {
      match_id: activeMatch.id,
      sender_id: user.id,
      text: inputText.trim(),
    };

    setInputText(''); // Сразу очищаем для UX

    try {
      const { error } = await supabase.from('messages').insert(newMessage);
      if (error) throw error;
    } catch (e) {
      console.error('Ошибка отправки:', e);
      alert('Не удалось отправить сообщение');
    }
  };

  const submitRating = async () => {
    if (rating === 0 || !activeMatch) return;
    try {
      const { error } = await supabase
        .from('matches')
        .update({ shelter_rating: rating })
        .eq('id', activeMatch.id);
        
      if (!error) {
        const updatedMatch = { ...activeMatch, shelter_rating: rating };
        setActiveMatch(updatedMatch);
        setMatches(prev => prev.map(m => m.id === activeMatch.id ? updatedMatch : m));
        
        setRatingSubmitted(true);
        setTimeout(() => {
          setShowRating(false);
          setRatingSubmitted(false);
        }, 1500);
      }
    } catch (e) {
      console.error('Ошибка сохранения рейтинга:', e);
    }
  };

  const deleteRating = async () => {
    if (!activeMatch) return;
    try {
      const { error } = await supabase
        .from('matches')
        .update({ shelter_rating: null })
        .eq('id', activeMatch.id);
        
      if (!error) {
        const updatedMatch = { ...activeMatch, shelter_rating: null };
        setActiveMatch(updatedMatch);
        setMatches(prev => prev.map(m => m.id === activeMatch.id ? updatedMatch : m));
        
        setRating(0);
        setShowRating(false);
      }
    } catch (e) {
      console.error('Ошибка удаления рейтинга:', e);
    }
  };

  return (
    <div className="w-full h-full flex bg-app-card rounded-[32px] border border-white/10 shadow-2xl overflow-hidden max-w-5xl mx-auto">
      
      {/* Sidebar */}
      <div className={`w-full md:w-[320px] shrink-0 border-r border-white/5 flex flex-col ${activeMatch ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-app-accent" /> Сообщения
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-app-accent" /></div>
          ) : matches.map(match => (
            <button 
              key={match.id}
              onClick={() => setActiveMatch(match)}
              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors ${activeMatch?.id === match.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="w-12 h-12 rounded-full bg-app-bg overflow-hidden border border-white/10 shrink-0">
                <img src={match.pet?.image_urls?.[0]} alt="Pet" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate text-sm">{match.pet?.name || 'Питомец'}</div>
                <div className="text-xs text-app-dim truncate">Чат с приютом</div>
              </div>
              {match.shelter_rating && <Star size={14} className="fill-app-accent text-app-accent shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-app-bg/50 relative ${!activeMatch ? 'hidden md:flex' : 'flex'}`}>
        {!activeMatch ? (
           <div className="flex-1 flex flex-col items-center justify-center text-app-dim p-8 text-center">
             <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
             <p>Выберите диалог для начала общения</p>
           </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/5 bg-app-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveMatch(null)} className="md:hidden p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={activeMatch.pet?.image_urls?.[0]} className="w-full h-full object-cover" />
                </div>
                <div className="font-bold">{activeMatch.pet?.name}</div>
              </div>
              
              <button 
                onClick={() => setShowRating(true)} 
                className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Star size={16} className={activeMatch.shelter_rating ? "fill-app-accent text-app-accent" : ""} />
                {activeMatch.shelter_rating ? 'Изменить отзыв' : 'Оценить приют'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender_id === user?.id ? 'bg-app-accent text-app-bg font-medium' : 'bg-white/5 text-app-text border border-white/10'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-app-card/80">
              <div className="flex gap-2">
                <input 
                  value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-app-accent transition-colors"
                />
                <button type="submit" className="w-12 h-12 flex items-center justify-center bg-app-accent text-app-bg rounded-xl hover:scale-105 transition-transform">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRating(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-app-card border border-white/10 p-8 rounded-[40px] max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowRating(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-app-dim transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-app-accent/20 text-app-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Оцените приют</h3>
                <p className="text-app-dim text-sm">Ваш отзыв важен для нас!</p>
              </div>

              <div className="flex flex-col items-center">
                {ratingSubmitted ? (
                  <div className="flex flex-col items-center py-4">
                    <CheckCircle className="text-app-success mb-2" size={32} />
                    <p className="font-bold text-app-success">Сохранено!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-8">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="p-2 transition-transform hover:scale-120">
                          <Star size={32} className={rating >= star ? "fill-app-accent text-app-accent" : "text-white/20"} />
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={submitRating}
                        disabled={rating === 0}
                        className="w-full py-4 rounded-2xl bg-app-accent text-app-bg font-bold hover:bg-sky-400 transition-colors disabled:opacity-50"
                      >
                        {activeMatch?.shelter_rating ? 'Обновить отзыв' : 'Оценить'}
                      </button>

                      {activeMatch?.shelter_rating && (
                        <button
                          onClick={deleteRating}
                          className="w-full py-2 text-red-500/60 hover:text-red-500 text-xs font-medium transition-colors"
                        >
                          Удалить мой отзыв
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}