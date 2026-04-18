import { useState, useEffect } from "react";
import {
  X,
  Heart,
  Loader2,
  PawPrint,
  MessageCircle,
  Star,
  Info,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  useAnimation,
  AnimatePresence,
} from "motion/react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Pet {
  id: string;
  shelter_id: string;
  name: string;
  age: number;
  description: string;
  image_urls: string[];
  donation_goal: number;
  current_donations: number;
  attributes?: {
    requires_space: boolean;
    cat_friendly: boolean;
    status?: string;
  };
  matchPercentage?: number;
  userName?: string;
  shelterName?: string;
}

const ImageCarousel = ({
  imageUrls,
  petName,
}: {
  imageUrls: string[];
  petName: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imageUrls || imageUrls.length === 0) {
    return <PawPrint className="w-full h-full p-4 text-app-dim opacity-50" />;
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < imageUrls.length - 1)
      setCurrentIndex((prev) => prev + 1);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="relative w-full h-full">
      <img
        src={imageUrls[currentIndex]}
        alt={petName}
        className="w-full h-full object-cover pointer-events-none select-none"
      />

      
      {imageUrls.length > 1 && (
        <>
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
            onClick={prevImage}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
            onClick={nextImage}
          />

          {/* Индикаторы (полосочки сверху) */}
          <div className="absolute top-3 left-0 w-full flex gap-1 px-3 z-20">
            {imageUrls.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                    : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
const calculateMatch = (pet: Pet, userAnswers: any) => {
  if (!userAnswers) return 80 + Math.floor(Math.random() * 15);

  let match = 100;

  if (pet.attributes?.requires_space && userAnswers.housing === "apartment") {
    match -= 35;
  }

  if (
    pet.attributes?.cat_friendly === false &&
    userAnswers.other_pets === "yes"
  ) {
    match -= 45;
  }

  match -= Math.floor(Math.random() * 15);
  return Math.max(match, 15);
};

const SponsorshipModal = ({
  pet,
  onClose,
  onSuccess,
}: {
  pet: Pet;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDonate = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(amount);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] bg-app-bg/80 backdrop-blur-sm flex items-center justify-center p-6 "
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-[340px] bg-app-card rounded-[32px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden "
      >
        <div className="relative p-6 flex flex-col items-center">
          <button
            onClick={onClose}
            disabled={processing || success}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-app-dim transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 rounded-full bg-app-accent/20 flex items-center justify-center text-app-accent mb-4 border border-app-accent/30 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <DollarSign size={32} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Виртуальный опекун
          </h2>
          <p className="text-sm text-app-dim text-center mb-6">
            Спонсируйте {pet.name}, чтобы помочь приюту с расходами.
          </p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-4 w-full"
              >
                <div className="text-5xl mb-4">💚</div>
                <div className="text-app-success font-bold text-lg mb-1">
                  Спасибо!
                </div>
                <div className="text-app-dim text-sm text-center">
                  Ваш вклад добавлен.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="flex gap-2 w-full mb-4">
                  {[100, 500, 1000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-colors ${amount === val ? "bg-app-accent/20 border-app-accent text-app-accent" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                    >
                      {val} ₽
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDonate}
                  disabled={processing}
                  className="w-full py-4 rounded-2xl bg-app-accent text-app-bg font-bold text-sm hover:bg-sky-400 transition-colors flex items-center justify-center disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Пожертвовать ${amount} ₽`
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PetDetailsModal = ({
  pet,
  onClose,
  onSponsor,
}: {
  pet: Pet;
  onClose: () => void;
  onSponsor: () => void;
}) => {
  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[60] bg-app-bg flex flex-col overflow-hidden rounded-[32px] border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
    >
      <div className="relative h-[45%] shrink-0 bg-app-card">
        <ImageCarousel imageUrls={pet.image_urls} petName={pet.name} />
        <button
          onClick={onClose}
          className="absolute top-6 left-6 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors z-10"
        >
          <ChevronDown size={28} />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent flex flex-col justify-end p-8 pb-4">
          <h2 className="text-4xl text-white font-extrabold mb-1">
            {pet.name}, {pet.age} лет
          </h2>
          {pet.matchPercentage && (
            <div className="inline-flex mt-2 items-center gap-1.5 px-3 py-1.5 bg-app-success/20 border border-app-success/40 text-app-success rounded-full text-sm font-bold backdrop-blur-md w-max">
              <Star size={16} fill="currentColor" /> Совместимость{" "}
              {pet.matchPercentage}%
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-app-bg">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <h3 className="text-lg font-bold text-white mb-2">О питомце</h3>
          <p className="text-app-dim text-sm leading-relaxed mb-6">
            {pet.description}
          </p>

          <h3 className="text-lg font-bold text-white mb-3">Особенности</h3>
          <div className="flex flex-wrap gap-2 mb-8">
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold ${pet.attributes?.requires_space ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-app-text"}`}
            >
              {pet.attributes?.requires_space
                ? "Нужен просторный дом"
                : "Подходит для квартиры"}
            </span>
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold ${pet.attributes?.cat_friendly ? "bg-app-success/20 text-app-success" : "bg-rose-500/20 text-rose-300"}`}
            >
              {pet.attributes?.cat_friendly
                ? "Дружит с котами"
                : "Лучше без других животных"}
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/5">
            <div className="flex justify-between font-bold mb-3 text-sm">
              <span className="text-app-accent">Спонсорство</span>
              <span>
                {pet.current_donations || 0} / {pet.donation_goal || 1} ₽
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-app-accent to-indigo-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((pet.current_donations || 0) / (pet.donation_goal || 1)) * 100, 100)}%`,
                }}
                transition={{ duration: 1, type: "spring" }}
              />
            </div>
            <p className="text-xs text-app-dim">
              Вы можете стать виртуальным опекуном и помогать приюту с
              содержанием.
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-white/5 bg-app-bg z-10 shrink-0">
          <button
            onClick={onSponsor}
            className="w-full h-14 bg-app-accent text-app-bg font-bold rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:bg-sky-400 transition-colors"
          >
            Спонсировать
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TinderCard = ({
  pet,
  isTop,
  isNext,
  onSwipe,
  onInfo,
}: {
  pet: Pet;
  isTop: boolean;
  isNext: boolean;
  onSwipe: (dir: "left" | "right", id: string) => void;
  onInfo: (pet: Pet) => void;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const controls = useAnimation();

  useEffect(() => {
    x.set(0);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [pet.id]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      await controls.start({
        x: 400,
        opacity: 0,
        transition: { duration: 0.3 },
      });
      onSwipe("right", pet.id);
    } else if (info.offset.x < -100) {
      await controls.start({
        x: -400,
        opacity: 0,
        transition: { duration: 0.3 },
      });
      onSwipe("left", pet.id);
    } else {
      controls.start({
        x: 0,
        opacity: 1,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      });
    }
  };

  if (!isTop && !isNext) return null;

  const matchColor =
    pet.matchPercentage && pet.matchPercentage >= 85
      ? "text-app-success border-app-success/30 bg-app-success/10 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
      : "text-app-accent border-app-accent/30 bg-app-accent/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]";

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={false}
      className={`absolute inset-0 w-full h-full bg-app-card rounded-[32px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 shrink-0 select-none ${isTop ? "z-20 cursor-grab active:cursor-grabbing" : "z-10 pointer-events-none"}`}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="absolute inset-0">
          <ImageCarousel imageUrls={pet.image_urls} petName={pet.name} />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-90 pointer-events-none" />
        </div>

        {isTop && pet.matchPercentage !== undefined && (
          <div
            className={`absolute top-6 left-6 px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-md border flex items-center gap-1.5 ${matchColor}`}
          >
            <Star className="w-4 h-4 fill-current" />
            {pet.matchPercentage}% Match
          </div>
        )}

        {isTop && (
          <div className="absolute top-6 right-6 bg-app-success/20 border border-app-success text-app-success px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-md shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            Новый
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full pb-8 pt-24 px-8 hidden md:flex flex-col z-10 pointer-events-none bg-gradient-to-t from-[#0F172A] to-transparent">
          <div className="flex justify-between items-end w-full">
            <div className="flex-1 pr-4">
              <h2 className="text-4xl font-extrabold mb-1 line-clamp-1">
                {pet.name}, {pet.age}
              </h2>
              <p className="text-base text-app-dim mb-4 line-clamp-1">
                {pet.description}
              </p>
            </div>
            {isTop && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onInfo(pet);
                }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 transition-colors shrink-0 mb-4"
              >
                <Info size={24} />
              </button>
            )}
          </div>

          {pet.donation_goal > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm pointer-events-auto border border-white/5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-app-accent font-semibold">
                  Виртуальный опекун
                </span>
                <span>
                  {pet.current_donations || 0} / {pet.donation_goal} ₽
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-app-accent to-indigo-400"
                  style={{
                    width: `${(pet.current_donations / pet.donation_goal) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 block md:hidden z-10 pointer-events-none bg-gradient-to-t from-[#0F172A] to-transparent pt-12">
          <div className="flex justify-between items-end">
            <div className="flex-1 pr-2">
              <h2 className="text-3xl font-extrabold mb-1 line-clamp-1 text-white">
                {pet.name}, {pet.age}
              </h2>
              <p className="text-sm text-white/80 line-clamp-2">
                {pet.description}
              </p>
            </div>
            {isTop && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onInfo(pet);
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 transition-colors shrink-0"
              >
                <Info size={20} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Feed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchPet, setMatchPet] = useState<Pet | null>(null);
  const [detailedPet, setDetailedPet] = useState<Pet | null>(null);
  const [sponsoringPet, setSponsoringPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (user && profile?.role !== "SHELTER") {
      fetchFeed();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchFeed = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: swipes, error: swipesError } = await supabase
        .from("swipes")
        .select("pet_id")
        .eq("user_id", user.id);

      if (swipesError) throw swipesError;

      const swipedPetIds = swipes?.map((s) => s.pet_id) || [];

      let query = supabase
        .from("pets")
        .select("*")
        .order("created_at", { ascending: false });

      if (swipedPetIds.length > 0) {
        query = query.not("id", "in", `(${swipedPetIds.join(",")})`);
      }

      const { data: petsData, error: petsError } = await query;
      if (petsError) throw petsError;

      if (petsData) {
        const filteredPets = petsData.filter(
          (p: Pet) => p.attributes?.status !== "adopted",
        );
        const petsWithMatch = filteredPets.map((p: Pet) => ({
          ...p,
          matchPercentage: calculateMatch(p, profile?.onboarding_answers),
        }));
        setPets(petsWithMatch);
      }
    } catch (e) {
      console.error("Ошибка загрузки ленты:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (dir: "left" | "right", petId: string) => {
    const swipedPet = pets.find((p) => p.id === petId);
    setPets((prev) => prev.slice(1));

    if (user && swipedPet) {
      const action = dir === "right" ? "LIKE" : "PASS";

      const { error } = await supabase.from("swipes").insert({
        user_id: user.id,
        pet_id: petId,
        action: action,
      });

      if (error)
        console.error(`Ошибка при сохранении свайпа (${action}):`, error);

      if (action === "LIKE") {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .insert({
            user_id: user.id,
            pet_id: petId,
            shelter_id: swipedPet.shelter_id,
          })
          .select(
            `
            *,
            shelter:profiles!matches_shelter_id_fkey(name)
          `,
          )
          .single();

        if (matchError) {
          console.error("Ошибка создания мэтча:", matchError);
        } else {
          setMatchPet({
            ...swipedPet,
            userName: profile?.name || "Вы",
            shelterName: matchData.shelter?.name || "Приют",
          });
        }
      }
    }
  };

  const forceSwipe = (dir: "left" | "right") => {
    if (pets.length > 0) {
      handleSwipe(dir, pets[0].id);
    }
  };

  const handleSponsorshipSuccess = async (amount: number) => {
    if (sponsoringPet) {
      const newAmount = (sponsoringPet.current_donations || 0) + amount;

      setPets((prev) =>
        prev.map((p) =>
          p.id === sponsoringPet.id
            ? { ...p, current_donations: newAmount }
            : p,
        ),
      );
      if (detailedPet && detailedPet.id === sponsoringPet.id) {
        setDetailedPet((prev) =>
          prev ? { ...prev, current_donations: newAmount } : null,
        );
      }

      try {
        await supabase
          .from("pets")
          .update({ current_donations: newAmount })
          .eq("id", sponsoringPet.id);
      } catch (e) {
        console.error("Ошибка сохранения пожертвования:", e);
      }

      setSponsoringPet(null);
    }
  };

  const effectiveRole = profile?.role || user?.user_metadata?.role;

  if (effectiveRole === "SHELTER") {
    return (
      <div className="w-full max-w-[420px] h-[580px] flex items-center justify-center flex-col text-center p-8 bg-app-card rounded-[32px] border border-white/10 shadow-2xl">
        <PawPrint className="w-16 h-16 text-app-dim mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Режим приюта</h2>
        <p className="text-app-dim text-sm">
          Свайпы доступны только для усыновителей. Отслеживайте своих питомцев в
          разделе Дашборд.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full justify-center relative">
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
            <p className="font-bold text-app-text text-lg mb-1">
              Никого не осталось
            </p>
            <p className="text-sm">
              Вы просмотрели всех питомцев в вашем регионе! Зайдите позже.
            </p>
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
          onClick={() => forceSwipe("left")}
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
          onClick={() => forceSwipe("right")}
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
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 200,
                delay: 0.1,
              }}
              className="flex flex-col items-center text-center w-full"
            >
              <div
                className="text-4xl md:text-5xl font-extrabold text-app-success tracking-tighter mb-2"
                style={{ textShadow: "0 0 20px rgba(74,222,128,0.5)" }}
              >
                It's a Match! 🎉
              </div>
              <p className="text-app-text mb-8">
                <span className="font-bold text-app-accent">
                  {profile?.name || "Вы"}
                </span>{" "}
                и{" "}
                <span className="font-bold text-app-accent">
                  {matchPet.shelterName || "Приют"}
                </span>{" "}
                понравились друг другу!
              </p>

              <div className="flex gap-4 items-center justify-center mb-10 w-full relative">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-app-success shadow-[0_0_30px_rgba(74,222,128,0.4)] bg-gradient-to-br from-app-accent to-sky-600 text-app-bg flex items-center justify-center font-bold text-3xl z-10">
                    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium text-app-text">
                    {profile?.name || "Вы"}
                  </span>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-10 h-10 bg-app-success rounded-full flex items-center justify-center shadow-lg">
                    <Heart size={20} className="text-white fill-white" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 shrink-0 bg-app-card border-r border-white/5">
                    <ImageCarousel
                      imageUrls={matchPet.image_urls}
                      petName={matchPet.name}
                    />
                  </div>
                  <span className="text-xs font-medium text-app-text">
                    {matchPet.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setMatchPet(null);
                    navigate("/messages");
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
