import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { Loader2, Send, PawPrint, MessageCircle, ArrowLeft, Star, X, CheckCircle } from 'lucide-react';
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
    setShowRating(false);
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
        
      if (error && error.code === '42P01') {
        return;
      }
      
      if (data) setMessages(data);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeMatch) return;

    const text = inputText;
    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: activeMatch.id,
        sender_id: user.id,
        text: text
      });
      
      if (error) {
        if (error.code === '42P01') {
           setMessages(prev => [...prev, { id: Date.now(), text, sender_id: user.id, created_at: new Date().toISOString() }]);
        } else {
           throw error;
        }
      }
    } catch (e) {
      console.error('Send message error:', e);
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
         setRatingSubmitted(true);
         setTimeout(() => setShowRating(false), 2000);
      } else {
         throw error;
      }
    } catch (e) {
      console.error('Ошибка сохранения рейтинга:', e);
     
      setRatingSubmitted(true);
      setTimeout(() => setShowRating(false), 2000);
    }
  };

  const deleteMatch = async () => {
    if (!activeMatch) return;
    if (window.confirm("Вы уверены, что хотите отменить этот мэтч и удалить чат?")) {
      try {
         const { error } = await supabase.from('matches').delete().eq('id', activeMatch.id);
         if (!error) {
           setMatches(prev => prev.filter(m => m.id !== activeMatch.id));
           setActiveMatch(null);
         } else {
           
           setMatches(prev => prev.filter(m => m.id !== activeMatch.id));
           setActiveMatch(null);
         }
      } catch (e) {
         console.error('Delete match error:', e);
      }
    }
  };

  const effectiveRole = profile?.role || user?.user_metadata?.role;

  
  return (
    <div className="w-full h-full flex bg-app-card rounded-[32px] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden max-w-5xl mx-auto">
      
      
      <div className={`w-full md:w-[320px] shrink-0 border-r border-white/5 flex flex-col ${activeMatch ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-app-accent" /> Сообщения
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-app-accent" /></div>
          ) : matches.length === 0 ? (
             <div className="text-center p-8 text-app-dim text-sm">Нет активных мэтчей для общения.</div>
          ) : (
            matches.map(match => (
              <button 
                key={match.id}
                onClick={() => setActiveMatch(match)}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors ${activeMatch?.id === match.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="w-12 h-12 rounded-full bg-app-bg overflow-hidden border border-white/10 shrink-0">
                  {match.pet?.image_urls?.[0] ? (
                    <img src={match.pet.image_urls[0]} alt="Pet" className="w-full h-full object-cover" />
                  ) : <PawPrint className="w-full h-full p-2 opacity-50" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate text-sm">{match.pet?.name || 'Питомец'}</div>
                  <div className="text-xs text-app-dim truncate">
                    {effectiveRole === 'SHELTER' ? 'Новый усыновитель' : 'Новое совпадение с приютом!'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      
      <div className={`flex-1 flex flex-col bg-app-bg/50 relative ${!activeMatch ? 'hidden md:flex' : 'flex'}`}>
        {!activeMatch ? (
           <div className="flex-1 flex flex-col items-center justify-center text-app-dim p-8 text-center">
             <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
             <p className="font-medium text-app-text">Выберите диалог</p>
             <p className="text-sm">Здесь будут отображаться ваши переписки по активным мэтчам.</p>
           </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-white/5 bg-app-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveMatch(null)} className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-app-bg overflow-hidden border border-white/10 shrink-0">
                  <img src={activeMatch.pet?.image_urls?.[0]} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold">{activeMatch.pet?.name}</div>
                  <div className="text-xs text-app-dim">{effectiveRole === 'SHELTER' ? 'Открыт чат с усыновителем' : 'Открыт чат с приютом'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {effectiveRole === 'ADOPTER' && (
                  <button 
                    onClick={() => setShowRating(true)}
                    className="h-9 px-4 rounded-full bg-white/5 border border-white/10 text-app-text hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-lg"
                  >
                    <Star size={14} className={rating > 0 ? "fill-app-accent text-app-accent" : ""} />
                    {rating > 0 ? "Оценено" : "Оценить"}
                  </button>
                )}
                <button
                  onClick={deleteMatch}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-app-danger/20 hover:text-app-danger hover:border-app-danger/50 flex flex-col items-center justify-center gap-[3px] transition-colors"
                  title="Отменить мэтч"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-sm text-app-dim mt-10 p-6 bg-app-card rounded-2xl border border-white/5">
                  <span role="img" aria-label="wave" className="text-2xl block mb-2">👋</span>
                  Напишите первое сообщение! Приют с радостью ответит на ваши вопросы о питомце.
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${isMe ? 'bg-app-accent text-app-bg rounded-br-sm' : 'bg-app-card border border-white/10 text-app-text rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

           
            <div className="p-4 bg-app-card/80 backdrop-blur-md border-t border-white/5 shrink-0">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 bg-app-bg border border-white/10 rounded-full px-5 py-3 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all text-sm"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="w-12 h-12 shrink-0 rounded-full bg-app-accent text-app-bg flex items-center justify-center hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} className="translate-x-[1px]" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-app-bg/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[340px] bg-app-card rounded-[32px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="relative p-8 flex flex-col items-center">
                <button 
                  onClick={() => setShowRating(false)}
                  disabled={ratingSubmitted}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-app-dim transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                
                <h2 className="text-xl font-bold text-white mb-2 text-center mt-2">Оцените приют</h2>
                <p className="text-sm text-app-dim text-center mb-8">
                  Как прошло ваше общение с представителем приюта?
                </p>

                <AnimatePresence mode="wait">
                  {ratingSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center justify-center py-4 w-full"
                    >
                      <CheckCircle className="w-16 h-16 text-app-success mb-4" />
                      <div className="text-app-success font-bold text-lg mb-1">Спасибо!</div>
                      <div className="text-app-dim text-sm text-center">Оценка сохранена.</div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-2 transition-transform hover:scale-110"
                          >
                            <Star 
                              size={32} 
                              className={rating >= star ? "fill-app-accent text-app-accent" : "text-white/20"} 
                            />
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={submitRating}
                        disabled={rating === 0}
                        className="w-full py-4 rounded-2xl bg-app-accent text-app-bg font-bold text-sm hover:bg-sky-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Сохранить оценку
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
