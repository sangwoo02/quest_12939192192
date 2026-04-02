/**
 * 🛒 상점 뷰 - 서버 구매/장착 연동 버전
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Palette,
  UserRound,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { gameApi } from '@/services/api';
import {
  BACKGROUNDS,
  CHARACTERS,
  type BackgroundItem,
  type CharacterItem,
} from './gameData';

type ShopTab = 'character' | 'background';

const rarityStyles: Record<string, string> = {
  common: 'text-slate-300 border-slate-400/20 bg-slate-500/10',
  rare: 'text-sky-300 border-sky-400/20 bg-sky-500/10',
  epic: 'text-violet-300 border-violet-400/20 bg-violet-500/10',
  legendary: 'text-yellow-300 border-yellow-400/20 bg-yellow-500/10',
};

const ShopView = () => {
  const {
    coins,
    hasCreatedCharacter,
    selectedCharacter,
    selectedBackground,
    ownedCharacterIds,
    ownedBackgroundIds,
    refreshGameState,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ShopTab>('character');
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const selectedCharacterData = useMemo(
    () => CHARACTERS.find((c) => c.id === selectedCharacter) ?? CHARACTERS[0],
    [selectedCharacter]
  );

  const selectedBackgroundData = useMemo(
    () => BACKGROUNDS.find((b) => b.id === selectedBackground) ?? BACKGROUNDS[0],
    [selectedBackground]
  );

  const handlePurchaseCharacter = async (item: CharacterItem) => {
    try {
      setPendingItemId(item.id);
      await gameApi.purchaseCharacter({ character_id: item.id });
      await refreshGameState();
      toast.success(`"${item.name}" 캐릭터를 구매했습니다.`);
    } catch (error: any) {
      console.error('캐릭터 구매 실패:', error);
      toast.error(error?.message || '캐릭터 구매에 실패했습니다.');
    } finally {
      setPendingItemId(null);
    }
  };

  const handlePurchaseBackground = async (item: BackgroundItem) => {
    try {
      setPendingItemId(item.id);
      await gameApi.purchaseBackground({ background_id: item.id });
      await refreshGameState();
      toast.success(`"${item.name}" 배경을 구매했습니다.`);
    } catch (error: any) {
      console.error('배경 구매 실패:', error);
      toast.error(error?.message || '배경 구매에 실패했습니다.');
    } finally {
      setPendingItemId(null);
    }
  };

  const handleEquipCharacter = async (item: CharacterItem) => {
    try {
      setPendingItemId(item.id);
      await gameApi.equipCharacter({ character_id: item.id });
      await refreshGameState();
      toast.success(`"${item.name}" 캐릭터를 장착했습니다.`);
    } catch (error: any) {
      console.error('캐릭터 장착 실패:', error);
      toast.error(error?.message || '캐릭터 장착에 실패했습니다.');
    } finally {
      setPendingItemId(null);
    }
  };

  const handleEquipBackground = async (item: BackgroundItem) => {
    try {
      setPendingItemId(item.id);
      await gameApi.equipBackground({ background_id: item.id });
      await refreshGameState();
      toast.success(`"${item.name}" 배경을 적용했습니다.`);
    } catch (error: any) {
      console.error('배경 장착 실패:', error);
      toast.error(error?.message || '배경 적용에 실패했습니다.');
    } finally {
      setPendingItemId(null);
    }
  };

  const renderCharacterCard = (item: CharacterItem) => {
    const isOwned = ownedCharacterIds.includes(item.id) || item.price === 0;
    const isSelected = selectedCharacter === item.id;
    const canAfford = coins >= item.price;
    const isPending = pendingItemId === item.id;

    return (
      <motion.div
        key={item.id}
        whileTap={{ scale: 0.98 }}
        className={`rounded-2xl border p-4 backdrop-blur-sm ${
          isSelected
            ? 'border-violet-400/40 bg-violet-500/10'
            : 'border-white/10 bg-white/5'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-3xl shrink-0">
              {item.emoji}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{item.name}</p>

              <div
                className={`inline-flex mt-1 text-[10px] px-2 py-0.5 rounded-full border ${
                  rarityStyles[item.rarity || 'common']
                }`}
              >
                {item.rarity || 'common'}
              </div>
            </div>
          </div>

          {isSelected && (
            <div className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-violet-400/30 bg-violet-500/15 text-violet-300 font-semibold">
              장착중
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-yellow-300">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-semibold">{item.price}</span>
          </div>

          {isOwned ? (
            isSelected ? (
              <button
                disabled
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
              >
                사용 중
              </button>
            ) : (
              <button
                onClick={() => handleEquipCharacter(item)}
                disabled={isPending}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white border border-white/20 disabled:opacity-60"
              >
                {isPending ? '처리중...' : '장착'}
              </button>
            )
          ) : (
            <button
              onClick={() => handlePurchaseCharacter(item)}
              disabled={!canAfford || isPending}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                canAfford
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-white/20'
                  : 'bg-white/5 text-white/25 border-white/10 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              {isPending ? '처리중...' : '구매'}
            </button>
          )}
        </div>

        {!isOwned && !canAfford && (
          <p className="text-[10px] text-red-300/80 mt-2">코인이 부족합니다.</p>
        )}
      </motion.div>
    );
  };

  const renderBackgroundCard = (item: BackgroundItem) => {
    const isOwned = ownedBackgroundIds.includes(item.id) || item.price === 0;
    const isSelected = selectedBackground === item.id;
    const canAfford = coins >= item.price;
    const isPending = pendingItemId === item.id;

    return (
      <motion.div
        key={item.id}
        whileTap={{ scale: 0.98 }}
        className={`rounded-2xl border p-4 backdrop-blur-sm ${
          isSelected
            ? 'border-violet-400/40 bg-violet-500/10'
            : 'border-white/10 bg-white/5'
        }`}
      >
        <div
          className="w-full h-20 rounded-xl border border-white/10"
          style={{ background: item.gradient }}
        />

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>

            <div
              className={`inline-flex mt-1 text-[10px] px-2 py-0.5 rounded-full border ${
                rarityStyles[item.rarity || 'common']
              }`}
            >
              {item.rarity || 'common'}
            </div>
          </div>

          {isSelected && (
            <div className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-violet-400/30 bg-violet-500/15 text-violet-300 font-semibold">
              사용중
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-yellow-300">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-semibold">{item.price}</span>
          </div>

          {isOwned ? (
            isSelected ? (
              <button
                disabled
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
              >
                사용 중
              </button>
            ) : (
              <button
                onClick={() => handleEquipBackground(item)}
                disabled={isPending}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white border border-white/20 disabled:opacity-60"
              >
                {isPending ? '처리중...' : '적용'}
              </button>
            )
          ) : (
            <button
              onClick={() => handlePurchaseBackground(item)}
              disabled={!canAfford || isPending}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                canAfford
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-white/20'
                  : 'bg-white/5 text-white/25 border-white/10 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              {isPending ? '처리중...' : '구매'}
            </button>
          )}
        </div>

        {!isOwned && !canAfford && (
          <p className="text-[10px] text-red-300/80 mt-2">코인이 부족합니다.</p>
        )}
      </motion.div>
    );
  };

  if (!hasCreatedCharacter) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-violet-300" />
          </div>

          <p className="text-white font-semibold">상점을 이용하려면 캐릭터 생성이 필요합니다</p>
          <p className="text-white/50 text-sm mt-2">
            먼저 홈 화면에서 캐릭터를 생성해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">상점</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-4 h-4 text-violet-300" />
                <span className="text-xs text-white/60">현재 캐릭터</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCharacterData?.emoji}</span>
                <span className="text-sm font-semibold text-white">
                  {selectedCharacterData?.name}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-sky-300" />
                <span className="text-xs text-white/60">현재 배경</span>
              </div>
              <div
                className="h-8 rounded-lg border border-white/10"
                style={{ background: selectedBackgroundData?.gradient }}
              />
              <p className="text-sm font-semibold text-white mt-2">
                {selectedBackgroundData?.name}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-200 font-medium">보유 코인</span>
            </div>
            <span className="text-sm font-bold text-yellow-300">{coins}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('character')}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === 'character'
                ? 'bg-violet-500/20 border-violet-400/30 text-violet-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            캐릭터
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === 'background'
                ? 'bg-violet-500/20 border-violet-400/30 text-violet-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            배경
          </button>
        </div>

        {activeTab === 'character' ? (
          <div className="space-y-3">
            {CHARACTERS.map(renderCharacterCard)}
          </div>
        ) : (
          <div className="space-y-3">
            {BACKGROUNDS.map(renderBackgroundCard)}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">현재 서버 상태 요약</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-white/70">
              <span>보유 캐릭터 수</span>
              <span className="text-white font-semibold">{ownedCharacterIds.length}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>보유 배경 수</span>
              <span className="text-white font-semibold">{ownedBackgroundIds.length}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>현재 선택 캐릭터</span>
              <span className="text-violet-300 font-semibold">
                {selectedCharacterData?.name ?? '--'}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>현재 선택 배경</span>
              <span className="text-sky-300 font-semibold">
                {selectedBackgroundData?.name ?? '--'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ShopView;