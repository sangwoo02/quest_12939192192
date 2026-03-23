/**
 * 🏪 상점 뷰
 * 캐릭터, 배경을 코인으로 구매 가능
 */

import { motion } from 'framer-motion';
import { ShoppingBag, Coins, ImageIcon, User } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CHARACTERS, BACKGROUNDS } from './gameData';

const ShopView = () => {
  const { coins, selectedCharacter, selectedBackground } = useAppStore();

  const shopItems = [
    ...CHARACTERS.filter(c => c.id !== 'char-default').map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      price: c.price,
      type: 'character' as const,
      owned: selectedCharacter === c.id,
    })),
    ...BACKGROUNDS.filter(b => b.id !== 'bg-default').map(b => ({
      id: b.id,
      name: b.name,
      preview: b.gradient,
      price: b.price,
      type: 'background' as const,
      owned: selectedBackground === b.id,
    })),
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* 헤더 + 코인 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">상점</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-500/30">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-300">{coins}</span>
          </div>
        </div>

        {/* 캐릭터 섹션 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white/80">캐릭터</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {shopItems.filter(i => i.type === 'character').map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.95 }}
                className={`rounded-xl p-3 text-center border ${
                  item.owned 
                    ? 'bg-violet-500/20 border-violet-400/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="text-xs text-white/70 mt-1.5 font-medium">{item.name}</p>
                {item.owned ? (
                  <span className="text-[10px] text-green-400 font-medium">보유중</span>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] text-yellow-300 font-bold">{item.price}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 배경 섹션 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white/80">배경</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shopItems.filter(i => i.type === 'background').map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.95 }}
                className={`rounded-xl p-3 border overflow-hidden relative ${
                  item.owned 
                    ? 'border-violet-400/30' 
                    : 'border-white/10'
                }`}
                style={{ background: item.preview }}
              >
                <div className="relative z-10">
                  <p className="text-xs text-white font-medium drop-shadow-lg">{item.name}</p>
                  {item.owned ? (
                    <span className="text-[10px] text-green-300 font-medium drop-shadow-lg">보유중</span>
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] text-yellow-300 font-bold drop-shadow-lg">{item.price}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-2">
          협동전, 경쟁전에서 코인을 획득할 수 있어요
        </p>
      </motion.div>
    </div>
  );
};

export default ShopView;
