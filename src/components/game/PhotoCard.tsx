/**
 * 🃏 포토카드 컴포넌트
 * 캐릭터 + 배경을 보여주는 대형 카드
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowUp, Trophy, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CHARACTERS, BACKGROUNDS, ACHIEVEMENTS } from './gameData';
import CharacterSelectDialog from './CharacterSelectDialog';
import AchievementsDialog from './AchievementsDialog';

const PhotoCard = () => {
  const { 
    hasCreatedCharacter, selectedCharacter, selectedBackground, 
    level, exp, requiredExp, equippedBadge 
  } = useAppStore();
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const character = CHARACTERS.find(c => c.id === selectedCharacter);
  const background = BACKGROUNDS.find(b => b.id === selectedBackground);
  const badge = ACHIEVEMENTS.find(a => a.id === equippedBadge);
  const expPercent = requiredExp > 0 ? (exp / requiredExp) * 100 : 0;
  const canLevelUp = exp >= requiredExp;

  // 잠금 상태
  if (!hasCreatedCharacter) {
    return (
      <>
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCharSelect(true)}
          className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:border-violet-400/40 transition-colors"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock className="w-12 h-12 text-white/30 mb-3" />
          </motion.div>
          <p className="text-white/50 font-semibold text-sm">캐릭터를 생성하세요</p>
          <p className="text-white/30 text-xs mt-1">탭하여 캐릭터 & 배경 선택</p>
        </motion.div>
        <CharacterSelectDialog open={showCharSelect} onClose={() => setShowCharSelect(false)} />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        style={{ background: background?.gradient || BACKGROUNDS[0].gradient }}
      >
        {/* 장착된 뱃지 (좌측 상단) */}
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-yellow-500/30"
          >
            <span className="text-lg">{badge.badge}</span>
          </motion.div>
        )}

        {/* 레벨 표시 (우측 상단) */}
        <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-violet-500/30">
          <span className="text-xs font-bold text-violet-300">Lv.{level}</span>
        </div>

        {/* 캐릭터 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl drop-shadow-2xl"
          >
            {character?.emoji || '🧑‍💪'}
          </motion.span>
        </div>

        {/* 하단 오버레이 - XP바 + 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          {/* XP 바 */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/50">EXP</span>
              <span className="text-yellow-300 font-semibold">{exp} / {requiredExp}</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2">
            {/* 레벨업 버튼 */}
            <motion.button
              whileTap={canLevelUp ? { scale: 0.95 } : undefined}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 border text-sm font-semibold ${
                canLevelUp
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-white/10 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span>레벨업</span>
              {canLevelUp && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-200" />
                </motion.div>
              )}
            </motion.button>

            {/* 업적 버튼 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAchievements(true)}
              className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 bg-violet-500/20 border border-violet-400/30 text-violet-300 text-sm font-semibold"
            >
              <Trophy className="w-4 h-4" />
              <span>업적</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AchievementsDialog open={showAchievements} onClose={() => setShowAchievements(false)} />
    </>
  );
};

export default PhotoCard;
