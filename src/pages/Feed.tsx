import { useState, useEffect } from 'react';
import { X, Heart, Loader2, PawPrint, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pet } from '../types/pet';
import { CATEGORIES } from '../constants/categories';
import { calculateMatch } from '../utils/matchCalculator';
import { TinderCard } from '../components/TinderCard';
import { PetDetailsModal } from '../components/PetDetailsModal';
import { SponsorshipModal } from '../components/SponsorshipModal';
import { ImageCarousel } from '../components/ImageCarousel';
import { ChevronDown } from 'lucide-react';

export default function Feed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchPet, setMatchPet] = useState<Pet | null>(null);
  const [detailedPet, setDetailedPet] = useState<Pet | null>(null);
  const [sponsoringPet, setSponsoringPet] = useState<Pet | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === filter) || CATEGORIES[0];

  useEffect(() => {
    if (user && profile?.role !== 'SHELTER') {
      fetchFeed();
    } else {
      setLoading(false);
    }
  }, [user, profile, filter]);

  const fetchFeed = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: swipes, error: swipesError } = await supabase
        .from('swipes')
        .select('pet_id')
        .eq('user_id', user.id);

      if (swipesError) throw swipesError;

      const swipedPetIds = swipes?.map((s) => s.pet_id) || [];

      let query = supabase.from('pets').select('*').order('created_at', { ascending: false });

      if (swipedPetIds.length > 0) {
        query = query.not('id', 'in', `(${swipedPetIds.join(',')})`);
      }
      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data: petsData, error: petsError } = await query;
      if (petsError) throw petsError;

      if (petsData) {
        const filteredPets = petsData.filter((p: Pet) => p.attributes?.status !== 'adopted');
        const petsWithMatch = filteredPets.map((p: Pet) => ({
          ...p,
          matchPercentage: calculateMatch(p, profile?.onboarding_answers),
        }));
        setPets(petsWithMatch);
      }
    } catch (e) {
      console.error('Ошибка загрузки ленты:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (dir: 'left' | 'right', petId: string) => {
    const swipedPet = pets.find((p) => p.id === petId);
    setPets((prev) => prev.slice(1));

    if (user && swipedPet) {
      const action = dir === 'right' ? 'LIKE' : 'PASS';

      const { error } = await supabase.from('swipes').insert({
        user_id: user.id,
        pet_id: petId,
        action: action,
      });

      if (error) console.error(`Ошибка при сохранении свайпа (${action}):`, error);

      if (action === 'LIKE') {
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .insert({
            user_id: user.id,
            pet_id: petId,
            shelter_id: swipedPet.shelter_id,
          })
          .select(`*, shelter:profiles!matches_shelter_id_fkey(name)`)
          .single();

        if (matchError) {
          console.error('Ошибка создания мэтча:', matchError);
        } else {
          setMatchPet({
            ...swipedPet,
            userName: profile?.name || 'Вы',
            shelterName: matchData.shelter?.name || 'Приют',
          });
        }
      }
    }
  };

  const forceSwipe = (dir: 'left' | 'right') => {
    if (pets.length > 0) {
      handleSwipe(dir, pets[0].id);
    }
  };

  const handleSponsorshipSuccess = async (amount: number) => {
    if (sponsoringPet && user) {
      const newAmount = (sponsoringPet.current_donations || 0) + amount;
      setPets((prev) =>
        prev.map((p) => (p.id === sponsoringPet.id ? { ...p, current_donations: newAmount } : p))
      );
      if (detailedPet && detailedPet.id === sponsoringPet.id) {
        setDetailedPet((prev) => (prev ? { ...prev, current_donations: newAmount } : null));
      }

      try {
        await supabase.from('pets').update({ current_donations: newAmount }).eq('id', sponsoringPet.id);

        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('user_id', user.id)
          .eq('pet_id', sponsoringPet.id)
          .single();

        if (existingMatch) {
          await supabase.from('matches').update({ is_sponsor: true }).eq('id', existingMatch.id);
        } else {
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert({
              user_id: user.id,
              pet_id: sponsoringPet.id,
              shelter_id: sponsoringPet.shelter_id,
              is_sponsor: true,
            })
            .select(`*, shelter:profiles!matches_shelter_id_fkey(name)`)
            .single();

          await supabase.from('swipes').insert({
            user_id: user.id,
            pet_id: sponsoringPet.id,
            action: 'LIKE',
          });

          if (!matchError && matchData) {
            setMatchPet({
              ...sponsoringPet,
              userName: profile?.name || 'Вы',
              shelterName: matchData.shelter?.name || 'Приют',
            });
            setPets((prev) => prev.filter((p) => p.id !== sponsoringPet.id));
            setDetailedPet(null);
          }
        }
      } catch (e) {
        console.error('Ошибка сохранения пожертвования или создания мэтча:', e);
      }
      setSponsoringPet(null);
    }
  };

  const effectiveRole = profile?.role || user?.user_metadata?.role;

  if (effectiveRole === 'SHELTER') {
    return (
      <div className="w-full max-w-[420px] h-[580px] flex items-center justify-center flex-col text-center p-8 bg-app-card rounded-[32px] border border-white/10 shadow-2xl">
        <PawPrint className="w-16 h-16 text-app-dim mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Режим приюта</h2>
        <p className="text-app-dim text-sm">
          Свайпы доступны только для усыновителей. Отслеживайте своих питомцев в разделе Дашборд.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full justify-center relative">
      <div className="sticky top-0 z-30 bg-app-bg/95 backdrop-blur-sm border-b border-white/5 mb-4 px-4 py-3">
        <div className="sm:hidden relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-white active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{activeCategory.icon}</span>
              <span className="font-bold tracking-wide">{activeCategory.label}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-app-dim transition-transform duration-300 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFilter(cat.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none ${
                      filter === cat.id ? 'bg-app-accent/10 text-app-accent' : 'text-app-dim'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium">{cat.label}</span>
                    {filter === cat.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-app-accent shadow-[0_0_8px_#7dd3fc]" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden sm:flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-4 px-4 items-center justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap 
                transition-all duration-300 border
                ${
                  filter === cat.id
                    ? 'bg-app-accent border-app-accent text-app-bg font-bold shadow-lg scale-105'
                    : 'bg-white/5 border-white/10 text-app-dim hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <span>{cat.icon}</span>
              <span className="text-sm">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-[420px] flex-1 md:h-[580px] md:flex-none mb-4 md:mb-8">
        {loading ? (
          <div className="absolute inset-0 h-full bg-app-card rounded-[32px] border border-white/10 flex items-center justify-center shadow-2xl z-10">
            <Loader2 className="w-10 h-10 animate-spin text-app-accent" />
          </div>
        ) : pets.length > 0 ? (
          pets
            .map((pet, index) => (
              <TinderCard
                key={pet.id}
                pet={pet}
                isTop={index === 0}
                isNext={index === 1}
                onSwipe={handleSwipe}
                onInfo={(p) => setDetailedPet(p)}
              />
            ))
            .reverse()
        ) : (
          <div className="absolute inset-0 h-full bg-app-card rounded-[32px] border border-white/10 flex flex-col items-center justify-center shadow-2xl p-8 text-center text-app-dim z-10">
            <PawPrint className="w-16 h-16 opacity-50 mb-4" />
            <p className="font-bold text-app-text text-lg mb-1">Никого не осталось</p>
            <p className="text-sm">Вы просмотрели всех питомцев в вашем регионе! Зайдите позже.</p>
            <button
              onClick={fetchFeed}
              className="mt-6 px-4 py-2 bg-white/5 rounded-xl text-sm font-bold text-app-text hover:bg-white/10 transition-colors"
            >
              Обновить
            </button>
          </div>
        )}

        <AnimatePresence>
          {detailedPet && (
            <PetDetailsModal
              pet={detailedPet}
              onClose={() => setDetailedPet(null)}
              onSponsor={() => setSponsoringPet(detailedPet)}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 md:gap-5 flex-wrap justify-center items-center z-10 w-full max-w-[420px] px-4 pb-4 md:pb-0">
        <button
          onClick={() => forceSwipe('left')}
          disabled={pets.length === 0 || !!detailedPet}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-app-card text-app-text border border-white/10 shadow-lg hover:text-app-danger hover:border-app-danger transition-all cursor-pointer disabled:opacity-50"
        >
          <X className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setSponsoringPet(pets[0])}
          disabled={pets.length === 0 || !!detailedPet}
          className="h-14 md:h-16 px-6 rounded-full font-bold bg-app-accent text-app-bg border border-white/10 shadow-lg hover:bg-sky-400 transition-all cursor-pointer disabled:opacity-50"
        >
          Спонсировать
        </button>
        <button
          onClick={() => forceSwipe('right')}
          disabled={pets.length === 0 || !!detailedPet}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-app-card text-app-text border border-white/10 shadow-lg hover:text-app-success hover:border-app-success transition-all cursor-pointer disabled:opacity-50"
        >
          <Heart className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
        </button>
      </div>

      <AnimatePresence>
        {sponsoringPet && (
          <SponsorshipModal
            pet={sponsoringPet}
            onClose={() => setSponsoringPet(null)}
            onSuccess={handleSponsorshipSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchPet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-app-bg/90 backdrop-blur-md rounded-[32px] p-6 max-w-[420px] mx-auto overflow-hidden h-[630px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="flex flex-col items-center text-center w-full"
            >
              <div
                className="text-4xl md:text-5xl font-extrabold text-app-success tracking-tighter mb-2"
                style={{ textShadow: '0 0 20px rgba(74,222,128,0.5)' }}
              >
                It's a Match! 🎉
              </div>
              <p className="text-app-text mb-8">
                <span className="font-bold text-app-accent">{profile?.name || 'Вы'}</span> и{' '}
                <span className="font-bold text-app-accent">{matchPet.shelterName || 'Приют'}</span> понравились
                друг другу!
              </p>

              <div className="flex gap-4 items-center justify-center mb-10 w-full relative">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-app-success shadow-[0_0_30px_rgba(74,222,128,0.4)] bg-gradient-to-br from-app-accent to-sky-600 text-app-bg flex items-center justify-center font-bold text-3xl z-10">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-medium text-app-text">{profile?.name || 'Вы'}</span>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-10 h-10 bg-app-success rounded-full flex items-center justify-center shadow-lg">
                    <Heart size={20} className="text-white fill-white" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 shrink-0 bg-app-card border-r border-white/5">
                    <ImageCarousel imageUrls={matchPet.image_urls} petName={matchPet.name} />
                  </div>
                  <span className="text-xs font-medium text-app-text truncate w-full text-center px-2">
                    {matchPet.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setMatchPet(null);
                    navigate('/messages');
                  }}
                  className="w-full h-14 bg-app-success hover:bg-green-400 text-app-bg font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" /> Написать сообщение
                </button>
                <button
                  onClick={() => setMatchPet(null)}
                  className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-app-text font-bold rounded-2xl flex items-center justify-center transition-colors"
                >
                  Продолжить свайпать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}