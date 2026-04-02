/**
 * 🎭 캐릭터 & 배경 선택 다이얼로그 - 서버 연동 버전
 *
 * 이번 단계 목표
 * - 최초 캐릭터/배경 선택을 서버에 저장
 * - 저장 성공 후 store refreshGameState()로 게임 상태 전체 갱신
 * - 이미 생성된 상태면 다시 초기 생성 API를 막음
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { gameApi } from '@/services/api';
import { CHARACTERS, BACKGROUNDS } from './gameData';
import { toast } from 'sonner';

interface CharacterSelectDialogProps {
  open: boolean;
  onClose: () => void;
}

const CharacterSelectDialog = ({ open, onClose }: CharacterSelectDialogProps) => {
  const {
    hasCreatedCharacter,
    refreshGameState,
  } = useAppStore();

  const freeCharacters = useMemo(
    () => CHARACTERS.filter((c) => c.price === 0),
    []
  );

  const freeBackgrounds = useMemo(
    () => BACKGROUNDS.filter((b) => b.price === 0),
    []
  );

  const [selectedChar, setSelectedChar] = useState(freeCharacters[0]?.id ?? 'char-default');
  const [selectedBg, setSelectedBg] = useState(freeBackgrounds[0]?.id ?? 'bg-default');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentChar = useMemo(
    () => CHARACTERS.find((c) => c.id === selectedChar) ?? CHARACTERS[0],
    [selectedChar]
  );

  const currentBg = useMemo(
    () => BACKGROUNDS.find((b) => b.id === selectedBg) ?? BACKGROUNDS[0],
    [selectedBg]
  );

  useEffect(() => {
    if (!open) return;

    setSelectedChar(freeCharacters[0]?.id ?? 'char-default');
    setSelectedBg(freeBackgrounds[0]?.id ?? 'bg-default');
    setShowConfirm(false);
    setSubmitting(false);
  }, [open, freeCharacters, freeBackgrounds]);

  const handleConfirm = async () => {
    if (submitting) return;

    // 이미 생성되어 있으면 중복 초기 생성을 막음
    if (hasCreatedCharacter) {
      toast.warning('이미 캐릭터가 생성되어 있습니다.');
      setShowConfirm(false);
      onClose();
      return;
    }

    try {
      setSubmitting(true);

      await gameApi.initializeCharacter({
        character_id: selectedChar,
        background_id: selectedBg,
      });

      await refreshGameState();

      toast.success('캐릭터가 생성되었습니다!');

      setShowConfirm(false);
      onClose();
    } catch (error: any) {
      console.error('캐릭터 초기 생성 실패:', error);
      toast.error(error?.message || '캐릭터 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            if (!submitting) onClose();
          }}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[380px] max-h-[85vh] overflow-y-auto bg-slate-900 rounded-2xl border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 border-b border-white/10 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-white">캐릭터 생성</h2>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-50"
            >
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
                {freeCharacters.map((char) => (
                  <motion.button
                    key={char.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChar(char.id)}
                    disabled={submitting}
                    className={`rounded-xl p-3 text-center border transition-all ${
                      selectedChar === char.id
                        ? 'bg-violet-500/30 border-violet-400/50 ring-1 ring-violet-400/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } disabled:opacity-60`}
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
                {freeBackgrounds.map((bg) => (
                  <motion.button
                    key={bg.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBg(bg.id)}
                    disabled={submitting}
                    className={`rounded-xl p-3 h-16 border transition-all relative overflow-hidden ${
                      selectedBg === bg.id
                        ? 'border-violet-400/50 ring-1 ring-violet-400/30'
                        : 'border-white/10 hover:border-white/20'
                    } disabled:opacity-60`}
                    style={{ background: bg.gradient }}
                  >
                    <span className="relative z-10 text-xs text-white font-medium drop-shadow-lg">
                      {bg.name}
                    </span>

                    {selectedBg === bg.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-60"
            >
              {submitting ? '생성 중...' : '캐릭터 생성하기'}
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
              className="absolute inset-0 z-[60] flex items-center justify-center p-6"
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => !submitting && setShowConfirm(false)}
              />
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
                  한번 선택하면 되돌릴 수 없습니다.
                  <br />
                  캐릭터와 배경은 이후 상점에서 코인으로 교체할 수 있습니다.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 text-sm font-medium disabled:opacity-50"
                  >
                    아니요
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold border border-white/20 disabled:opacity-60"
                  >
                    {submitting ? '저장 중...' : '예'}
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