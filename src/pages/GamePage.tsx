/**
 * 🎮 챌린지 게임 페이지 - 서버 연동 버전
 *
 * 목표:
 * - 게임 진입 시 서버에서 health / game profile / missions 조회
 * - 결과에 따라 잠금 / AI 미션 생성하기 / 게임 메인 화면 분기
 * - generate-initial 호출 후 다시 서버 데이터 재조회
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Lock,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Star,
  LogOut,
  Coins,
  Swords,
  Users,
  Ticket,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import GameBottomNav, { type GameTab } from '@/components/game/GameBottomNav';
import PhotoCard from '@/components/game/PhotoCard';
import MissionsView from '@/components/game/MissionsView';
import ShopView from '@/components/game/ShopView';
import { missionsApi } from '@/services/api';


// 게임 배경 컴포넌트
const GameBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-violet-950 to-purple-950" />
    {[...Array(25)].map((_, i) => (
      <motion.div
        key={`star-${i}`}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
      />
    ))}
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={`orb-${i}`}
        className="absolute w-32 h-32 rounded-full blur-3xl"
        style={{
          background:
            i % 2 === 0
              ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          left: `${Math.random() * 80}%`,
          top: `${Math.random() * 80}%`,
        }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 6 + Math.random() * 4, repeat: Infinity }}
      />
    ))}
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-violet-600/15 to-transparent" />
  </div>
);

// 공통 로딩 화면
const GameLoadingScreen = ({
  title = '게임 시작',
  loadingText = '게임 데이터 로딩 중...',
}: {
  title?: string;
  loadingText?: string;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 4, 96));
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 max-w-[430px] mx-auto left-0 right-0 overflow-hidden">
        <GameBackground />
      </div>

      <div className="relative z-10 text-center px-8 max-w-[430px] mx-auto">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-8 border-2 border-white/30 shadow-[0_0_40px_rgba(139,92,246,0.6)]"
        >
          <Gamepad2 className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-8">{loadingText}</p>

        <div className="w-64 mx-auto">
          <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/50 text-sm mt-2">{progress}%</p>
        </div>
      </div>
    </motion.div>
  );
};

const GamePage = () => {
  const navigate = useNavigate();

  const {
    level,
    coins,
    missionCoins,
    hasCreatedCharacter,
    gameProfile,
    missions,
    isHealthLinked,
    isGameLoading,
    loadGameBootstrap,
    refreshGameState,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<GameTab>('home');

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchGameState = useCallback(async () => {
    try {
      await loadGameBootstrap();
    } catch (error) {
      console.error('게임 상태 조회 실패:', error);
      toast.error('게임 데이터를 불러오지 못했습니다.');
    }
  }, [loadGameBootstrap]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  const handleGenerateMissions = async () => {
    try {
      setIsGenerating(true);

      await missionsApi.generateInitial({
        force_regenerate: false,
      });

      toast.success('AI 미션이 생성되었습니다!');

      // 생성 후 서버 상태 재조회
      await refreshGameState();
    } catch (error: any) {
      console.error('AI 미션 생성 실패:', error);
      toast.error(error?.message || 'AI 미션 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExit = () => {
    navigate('/inbody');
  };

  const hasActiveMissions = missions.length > 0;
  const shouldShowGenerateButton = isHealthLinked && !hasActiveMissions;

  // 1) 최초 페이지 로딩
  if (isGameLoading) {
    return <GameLoadingScreen title="게임 데이터 확인" loadingText="게임 상태를 불러오는 중..." />;
  }

  // 2) 잠금 상태: Samsung Health 미연동
  if (!isHealthLinked) {
    return (
      <div className="h-full flex flex-col bg-background relative">
        <GameBackground />

        <div className="relative z-10 px-6 pt-safe-top pb-6">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">챌린지 게임</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center mb-6">
              <Lock className="w-12 h-12 text-white/50" />
            </div>

            <h2 className="text-2xl font-bold text-white drop-shadow-lg">게임 잠금</h2>

            <p className="text-white/70 mt-3 max-w-xs mx-auto">
              게임을 시작하려면 먼저
              <br />
              Samsung Health 연동이 필요합니다
            </p>

            <Button
              onClick={() => navigate('/onboarding')}
              className="mt-8 px-8 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              정보 입력하기
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 3) AI 미션 미생성 상태
  if (shouldShowGenerateButton) {
    return (
      <div className="h-full flex flex-col bg-background relative">
        <GameBackground />

        <div className="relative z-10 px-6 pt-safe-top pb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">챌린지 게임</h1>

          <motion.button
            onClick={handleExit}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm border border-white/30 text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">나가기</span>
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 relative border-2 border-white/30 shadow-[0_0_30px_rgba(139,92,246,0.6)]"
            >
              <Sparkles className="w-10 h-10 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full bg-violet-400/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            <h2 className="text-xl font-bold text-white drop-shadow-lg">AI 미션 생성</h2>

            <p className="text-white/70 text-sm mt-2 max-w-xs mx-auto">
              AI가 당신의 신체 데이터를 분석하여
              <br />
              맞춤형 건강 미션을 만들어드려요
            </p>

            <div className="mt-6 space-y-2">
              {[
                { icon: Target, label: '개인 맞춤 미션', delay: 0.1 },
                { icon: Trophy, label: '경험치 & 레벨업', delay: 0.2 },
                { icon: Zap, label: '업적 & 메달', delay: 0.3 },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: item.delay }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-white text-sm">{item.label}</span>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={handleGenerateMissions}
              disabled={isGenerating}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI가 미션을 생성 중...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  미션 생성하기
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 4) 혹시 health는 연결됐지만 프로필/미션 조회가 비정상인 경우
  if (!gameProfile && !hasActiveMissions) {
    return (
      <div className="h-full flex flex-col bg-background relative">
        <GameBackground />

        <div className="relative z-10 px-6 pt-safe-top pb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">챌린지 게임</h1>

          <motion.button
            onClick={handleExit}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm border border-white/30 text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">나가기</span>
          </motion.button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="text-center">
            <p className="text-white/80 text-base font-semibold">게임 데이터를 아직 시작하지 않았습니다</p>
            <p className="text-white/50 text-sm mt-2">AI 미션 생성 버튼으로 시작해보세요</p>

            <Button
              onClick={handleGenerateMissions}
              disabled={isGenerating}
              className="mt-6 px-8 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              {isGenerating ? '생성 중...' : 'AI 미션 생성하기'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5) 메인 게임 화면
  return (
    <div className="h-full flex flex-col bg-background relative">
      <GameBackground />

      {/* 헤더 */}
      <div className="relative z-10 px-5 pt-safe-top pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white drop-shadow-lg">챌린지</h1>

          <div className="flex items-center gap-1 bg-violet-500/20 px-2 py-1 rounded-full border border-violet-400/30">
            <Star className="w-3 h-3 text-violet-300" fill="currentColor" />
            <span className="text-[10px] font-bold text-violet-300">Lv.{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/mission-coin-shop')}
            className="flex items-center gap-1 bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
          >
            <Ticket className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300">{missionCoins}</span>
            <Plus className="w-3 h-3 text-cyan-400/60" />
          </motion.button>

          <div className="flex items-center gap-1 bg-yellow-500/20 px-2.5 py-1 rounded-full border border-yellow-500/30">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-300">{coins}</span>
          </div>

          <motion.button
            onClick={handleExit}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-white/10 border border-white/15 text-white/70 hover:bg-white/15 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto relative z-10 px-5 pb-4"
          >
            <div className="mb-4">
              <PhotoCard />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative rounded-2xl p-4 border border-blue-400/20 bg-blue-500/10 backdrop-blur-sm overflow-hidden"
              >
                {!hasCreatedCharacter && (
                  <div className="absolute top-1 right-1">
                    <Lock className="w-3 h-3 text-white/20" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">협동전</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Coming Soon</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative rounded-2xl p-4 border border-red-400/20 bg-red-500/10 backdrop-blur-sm overflow-hidden"
              >
                {!hasCreatedCharacter && (
                  <div className="absolute top-1 right-1">
                    <Lock className="w-3 h-3 text-white/20" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Swords className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">경쟁전</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Coming Soon</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : activeTab === 'missions' ? (
          <motion.div
            key="missions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden flex flex-col relative z-10"
          >
            <MissionsView />
          </motion.div>
        ) : (
          <motion.div
            key="shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden flex flex-col relative z-10"
          >
            <ShopView />
          </motion.div>
        )}
      </AnimatePresence>

      <GameBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLocked={!hasCreatedCharacter}
      />
    </div>
  );
};

export default GamePage;