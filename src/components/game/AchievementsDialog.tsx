/**
 * 🏆 업적 다이얼로그
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { ACHIEVEMENTS } from './gameData';

interface AchievementsDialogProps {
  open: boolean;
  onClose: () => void;
}

const AchievementsDialog = ({ open, onClose }: AchievementsDialogProps) => {
  const { equippedBadge, setEquippedBadge } = useAppStore();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[380px] max-h-[70vh] overflow-y-auto bg-slate-900 rounded-2xl border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 border-b border-white/10 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-white">업적</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {ACHIEVEMENTS.map((ach) => (
              <motion.div
                key={ach.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (ach.completed) {
                    setEquippedBadge(equippedBadge === ach.id ? null : ach.id);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  ach.completed
                    ? equippedBadge === ach.id
                      ? 'bg-yellow-500/15 border-yellow-400/30'
                      : 'bg-white/5 border-white/15 hover:bg-white/10'
                    : 'bg-white/3 border-white/5 opacity-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  ach.completed ? 'bg-yellow-500/20' : 'bg-white/5'
                }`}>
                  <span className="text-xl">{ach.badge}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">{ach.name}</h4>
                  <p className="text-[10px] text-white/40">{ach.description}</p>
                </div>
                {ach.completed && equippedBadge === ach.id && (
                  <span className="text-[10px] text-yellow-400 font-medium bg-yellow-500/20 px-2 py-0.5 rounded-full">
                    장착중
                  </span>
                )}
              </motion.div>
            ))}
            
            <p className="text-center text-white/30 text-xs pt-2">
              완료된 업적의 훈장을 포토카드에 배치할 수 있어요
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementsDialog;
