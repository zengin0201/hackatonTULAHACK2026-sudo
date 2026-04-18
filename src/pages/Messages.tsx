import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { Loader2, Send, MessageCircle, ArrowLeft, Star, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Pet {
  id: string;
  name: string;
  image_urls: string[];
}

interface Match {
  id: string;
  user_id: string;
  shelter_id: string;
  pet_id: string;
  shelter_rating: number | null;
  pet?: Pet;
}

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMatches = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${user.id},shelter_id.eq.${user.id}`);
        
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

  const fetchMessages = useCallback(async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
      if (error) throw error;
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeMatch || !user) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: activeMatch.id,
        sender_id: user.id,
        text: textToSend,
      });
      if (error) throw error;
    } catch (e) {
      console.error('Send error:', e);
      alert('Ошибка при отправке');
    }
  };

  const updateRatingInState = (newRating: number | null) => {
    if (!activeMatch) return;
    
    const updated = { ...activeMatch, shelter_rating: newRating };
    setActiveMatch(updated);
    setMatches(prev => prev.map(m => m.id === activeMatch.id ? updated : m));
  };

  const submitRating = async () => {
    if (rating === 0 || !activeMatch) return;
    
    try {
      const { error } = await supabase
        .from('matches')
        .update({ shelter_rating: rating })
        .eq('id', activeMatch.id);
        
      if (error) throw error;
      
      const updatedMatch = { ...activeMatch, shelter_rating: rating };
      setActiveMatch(updatedMatch);
      
      setMatches(prev => prev.map(m => 
        m.id === activeMatch.id ? updatedMatch : m
      ));
      
      setRatingSubmitted(true);
      
      setTimeout(() => {
        setShowRating(false);
        setRatingSubmitted(false);
      }, 2000);
      
    } catch (e) {
      console.error('Rating error:', e);
      alert('Не удалось сохранить оценку');
    }
  };

  const deleteRating = async () => {
    if (!activeMatch) return;
    try {
      const { error } = await supabase
        .from('matches')
        .update({ shelter_rating: null })
        .eq('id', activeMatch.id);
        
      if (error) throw error;

      updateRatingInState(null);
      setRating(0);
      setShowRating(false);
    } catch (e) {
      console.error('Delete rating error:', e);
      alert('Произошла ошибка при удалении');
    }
  };

  // --- Effects ---

  useEffect(() => {
    fetchMatches();
  }, [user?.id]);

  useEffect(() => {
    if (!activeMatch) return;
    
    setRating(activeMatch.shelter_rating || 0);
    fetchMessages(activeMatch.id);
    
    const channel = supabase.channel(`chat_${activeMatch.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${activeMatch.id}` }, 
        (payload) => setMessages(prev => [...prev, payload.new as Message])
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [activeMatch, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRating(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="w-full h-full flex bg-app-card rounded-[32px] border border-white/10 shadow-2xl overflow-hidden max-w-5xl mx-auto">
      
      {/* Sidebar */}
      <div className={`w-full md:w-[320px] shrink-0 border-r border-white/5 flex flex-col ${activeMatch ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
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
              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all ${activeMatch?.id === match.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="w-12 h-12 rounded-full bg-app-bg overflow-hidden border border-white/10 shrink-0">
                <img src={match.pet?.image_urls?.[0]} alt="Pet" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate text-sm text-white">{match.pet?.name || 'Питомец'}</div>
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
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-app-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveMatch(null)} className="md:hidden p-2 hover:bg-white/10 rounded-full text-white"><ArrowLeft size={20} /></button>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={activeMatch.pet?.image_urls?.[0]} className="w-full h-full object-cover" />
                </div>
                <div className="font-bold text-white">{activeMatch.pet?.name}</div>
              </div>
              
              <button 
                onClick={() => setShowRating(true)} 
                className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 text-white"
              >
                <Star size={16} className={activeMatch.shelter_rating ? "fill-app-accent text-app-accent" : ""} />
                {activeMatch.shelter_rating ? 'Изменить отзыв' : 'Оценить приют'}
              </button>
            </div>

            {/* Messages */}
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

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-app-card/80">
              <div className="flex gap-2">
                <input 
                  value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-app-accent transition-colors"
                />
                <button type="submit" className="w-12 h-12 flex items-center justify-center bg-app-accent text-app-bg rounded-xl hover:scale-105 transition-transform active:scale-95">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Modal Rating */}
      <AnimatePresence>
        {showRating && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => {
              setShowRating(false);
              setRatingSubmitted(false);
              setRating(activeMatch?.shelter_rating || 0);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[32px] border border-white/10 p-8 text-center shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setShowRating(false);
                  setRatingSubmitted(false);
                  setRating(activeMatch?.shelter_rating || 0);
                }} 
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full opacity-50 hover:opacity-100 transition-all"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold mb-6">Оценка приюта</h3>

              {ratingSubmitted ? (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="py-4"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-green-500 font-bold mb-4">Оценка сохранена!</p>
                  <button 
                    onClick={() => {
                      setShowRating(false);
                      setRatingSubmitted(false);
                    }}
                    className="px-6 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Закрыть
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setRating(s)} 
                        className="transition-transform hover:scale-110 active:scale-95"
                        type="button"
                      >
                        <Star 
                          size={32} 
                          className={rating >= s ? "fill-yellow-400 text-yellow-400" : "text-white/20 hover:text-white/40"} 
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={submitRating} 
                      disabled={rating === 0} 
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-sm disabled:opacity-30 disabled:hover:bg-blue-600 transition-all"
                    >
                      {activeMatch?.shelter_rating ? 'Обновить оценку' : 'Оценить'}
                    </button>

                    {/* Кнопка удаления оценки исправлена здесь */}
                    {activeMatch?.shelter_rating && (
                      <button 
                        onClick={deleteRating} 
                        className="w-full py-3 text-red-500/60 hover:text-red-500 text-xs font-medium transition-colors"
                        type="button"
                      >
                        Удалить отзыв
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
