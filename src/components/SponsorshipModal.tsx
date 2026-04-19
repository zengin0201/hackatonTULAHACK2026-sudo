import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import { Pet } from '../types/pet';

interface SponsorshipModalProps {
  pet: Pet;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

export const SponsorshipModal = ({ pet, onClose, onSuccess }: SponsorshipModalProps) => {
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
      className="absolute inset-0 z-[70] bg-app-bg/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-[340px] bg-app-card rounded-[32px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden"
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
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-colors ${
                        amount === val
                          ? 'bg-app-accent/20 border-app-accent text-app-accent'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
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