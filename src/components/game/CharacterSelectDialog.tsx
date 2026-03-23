/**
 * 🎭 캐릭터 & 배경 선택 다이얼로그
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CHARACTERS, BACKGROUNDS } from './gameData';

interface CharacterSelectDialogProps {
  open: boolean;
  onClose: () => void;
}

const CharacterSelectDialog = ({ open, onClose }: CharacterSelectDialogProps) => {
  const { setCharacter } = useAppStore();
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0].id);
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0].id);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentChar = CHARACTERS.find(c => c.id === selectedChar)!;
  const currentBg = BACKGROUNDS.find(b => b.id === selectedBg)!;

  const handleConfirm = () => {
    setCharacter(selectedChar, selectedBg);
    setShowConfirm(false);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[380px] max-h-[85vh] overflow-y-auto bg-slate-900 rounded-2xl border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 border-b border-white/10 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-white">캐릭터 생성</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* 미리보기 */}
            <div 
              className="relative h-40 rounded-xl overflow-hidden border border-white/20 flex items-center justify-center"
              style={{ background: currentBg.gradient }}
            >
              <motion.span 
                key={selectedChar}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-7xl"
              >
                {currentChar.emoji}
              </motion.span>
            </div>

            {/* 캐릭터 선택 */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">캐릭터 선택</h3>
              <div className="grid grid-cols-3 gap-2">
                {CHARACTERS.filter(c => c.price === 0).map((char) => (
                  <motion.button
                    key={char.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChar(char.id)}
                    className={`rounded-xl p-3 text-center border transition-all ${
                      selectedChar === char.id
                        ? 'bg-violet-500/30 border-violet-400/50 ring-1 ring-violet-400/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{char.emoji}</span>
                    <p className="text-[10px] text-white/60 mt-1">{char.name}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 배경 선택 */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">배경 선택</h3>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.filter(b => b.price === 0).map((bg) => (
                  <motion.button
                    key={bg.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBg(bg.id)}
                    className={`rounded-xl p-3 h-16 border transition-all relative overflow-hidden ${
                      selectedBg === bg.id
                        ? 'border-violet-400/50 ring-1 ring-violet-400/30'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{ background: bg.gradient }}
                  >
                    <span className="relative z-10 text-xs text-white font-medium drop-shadow-lg">{bg.name}</span>
                    {selectedBg === bg.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 확인 버튼 */}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              캐릭터 생성하기
            </button>
          </div>
        </motion.div>

        {/* 확인 모달 */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative bg-slate-900 rounded-2xl border border-yellow-500/30 p-5 w-full max-w-[300px]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-white">안내</h3>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  한번 선택하면 되돌릴 수 없습니다. 캐릭터와 배경은 상점에서 코인으로 교체할 수 있습니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 text-sm font-medium"
                  >
                    아니요
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold border border-white/20"
                  >
                    예
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default CharacterSelectDialog;
