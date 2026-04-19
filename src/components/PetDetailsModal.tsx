import { motion } from 'motion/react';
import { ChevronDown, Star } from 'lucide-react';
import { Pet } from '../types/pet';
import { ImageCarousel } from './ImageCarousel';

interface PetDetailsModalProps {
  pet: Pet;
  onClose: () => void;
  onSponsor: () => void;
}

export const PetDetailsModal = ({ pet, onClose, onSponsor }: PetDetailsModalProps) => {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
              <Star size={16} fill="currentColor" /> Совместимость {pet.matchPercentage}%
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-app-bg">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <h3 className="text-lg font-bold text-white mb-2">О питомце</h3>
          <p className="text-app-dim text-sm leading-relaxed mb-6">{pet.description}</p>

          <h3 className="text-lg font-bold text-white mb-3">Особенности</h3>
          <div className="flex flex-wrap gap-2 mb-8">
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                pet.attributes?.requires_space
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-white/5 text-app-text'
              }`}
            >
              {pet.attributes?.requires_space ? 'Нужен просторный дом' : 'Подходит для квартиры'}
            </span>
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                pet.attributes?.cat_friendly
                  ? 'bg-app-success/20 text-app-success'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {pet.attributes?.cat_friendly ? 'Дружит с котами' : 'Лучше без других животных'}
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
                  width: `${Math.min(
                    ((pet.current_donations || 0) / (pet.donation_goal || 1)) * 100,
                    100
                  )}%`,
                }}
                transition={{ duration: 1, type: 'spring' }}
              />
            </div>
            <p className="text-xs text-app-dim">
              Вы можете стать виртуальным опекуном и помогать приюту с содержанием.
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