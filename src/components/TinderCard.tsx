import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from 'motion/react';
import { Star, Info } from 'lucide-react';
import { Pet } from '../types/pet';
import { ImageCarousel } from './ImageCarousel';

interface TinderCardProps {
  pet: Pet;
  isTop: boolean;
  isNext: boolean;
  onSwipe: (dir: 'left' | 'right', id: string) => void;
  onInfo: (pet: Pet) => void;
}

export const TinderCard = ({ pet, isTop, isNext, onSwipe, onInfo }: TinderCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const controls = useAnimation();

  useEffect(() => {
    x.set(0);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [pet.id, x, controls]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      await controls.start({ x: 400, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('right', pet.id);
    } else if (info.offset.x < -100) {
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('left', pet.id);
    } else {
      controls.start({
        x: 0,
        opacity: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    }
  };

  if (!isTop && !isNext) return null;

  const matchColor =
    pet.matchPercentage && pet.matchPercentage >= 85
      ? 'text-app-success border-app-success/30 bg-app-success/10 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
      : 'text-app-accent border-app-accent/30 bg-app-accent/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]';

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={false}
      className={`absolute inset-0 w-full h-full bg-app-card rounded-[32px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 shrink-0 select-none ${
        isTop ? 'z-20 cursor-grab active:cursor-grabbing' : 'z-10 pointer-events-none'
      }`}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
              <p className="text-base text-app-dim mb-4 line-clamp-1">{pet.description}</p>
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
                <span className="text-app-accent font-semibold">Виртуальный опекун</span>
                <span>
                  {pet.current_donations || 0} / {pet.donation_goal} ₽
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-app-accent to-indigo-400"
                  style={{ width: `${(pet.current_donations / pet.donation_goal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 block md:hidden z-10 pointer-events-none bg-gradient-to-t from-[#0F172A] to-transparent pt-12">
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-extrabold mb-1 line-clamp-1 text-white">
                {pet.name}, {pet.age}
              </h2>
              <p className="text-sm text-white/80 line-clamp-2">{pet.description}</p>
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