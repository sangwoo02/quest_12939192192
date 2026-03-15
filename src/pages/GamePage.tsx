/**
 * 🎮 챌린지 게임 페이지 컴포넌트
 * 
 * AI 미션 생성 및 게임 화면을 표시하는 페이지입니다.
 * Samsung Health 연동 후에만 접근 가능합니다.
 * 
 * 📝 수정 가이드:
 * - 게임 배경: GameBackground 컴포넌트 수정
 * - 로딩 화면: GameLoadingScreen 컴포넌트 수정
 * - 미션 생성 로직: handleGenerateMissions 함수 수정 (API 연결)
 * - 게임 UI: hasMissionsGenerated 조건부 렌더링 수정
 * 
 * 📦 컴포넌트 구성:
 * - GameBackground: 게임 화면 배경 (별, 오브, 그리드)
 * - GameLoadingScreen: 게임 시작 시 로딩 화면
 * - GamePage: 메인 페이지 (상태별 조건부 렌더링)
 * 
 * 🔄 화면 상태:
 * 1. 잠금: Samsung Health 미연동 시
 * 2. 미션 생성: 연동 완료, 미션 미생성 시
 * 3. 게임 활성화: 미션 생성 완료 시
 * 
 * ⚠️ 주의사항:
 * - 게임 페이지에서는 하단 네비게이션 바 미표시
 * - 나가기 버튼으로만 메인 페이지 이동 가능
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Gamepad2,
  Lock,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Star,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

// 게임 배경 컴포넌트
const GameBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* 그라데이션 배경 */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-violet-950 to-purple-950" />
    
    {/* 별 파티클 */}
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={`star-${i}`}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
    
    {/* 큰 빛나는 별 */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`big-star-${i}`}
        className="absolute"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 60}%`,
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      >
        <Star className="w-3 h-3 text-yellow-300/60" fill="currentColor" />
      </motion.div>
    ))}
    
    {/* 떠다니는 오브 */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={`orb-${i}`}
        className="absolute w-32 h-32 rounded-full blur-3xl"
        style={{
          background: i % 2 === 0 
            ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          left: `${Math.random() * 80}%`,
          top: `${Math.random() * 80}%`,
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
    
    {/* 그리드 라인 (레트로 게임 느낌) */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
    
    {/* 하단 글로우 */}
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-violet-600/20 to-transparent" />
  </div>
);

// 게임 시작 로딩 화면
const GameLoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('게임 데이터 로딩 중...');

  useEffect(() => {
    const loadingTexts = [
      '게임 데이터 로딩 중...',
      '미션 준비 중...',
      '캐릭터 불러오는 중...',
      '게임 시작!'
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        if (newProgress >= 25 && newProgress < 50) {
          setLoadingText(loadingTexts[1]);
        } else if (newProgress >= 50 && newProgress < 75) {
          setLoadingText(loadingTexts[2]);
        } else if (newProgress >= 75) {
          setLoadingText(loadingTexts[3]);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
        }
        
        return Math.min(newProgress, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* 앱 비율에 맞춘 컨테이너 */}
      <div className="absolute inset-0 max-w-[430px] mx-auto left-0 right-0 overflow-hidden">
        <GameBackground />
      </div>
      <div className="relative z-10 text-center px-8 max-w-[430px] mx-auto">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-8 border-2 border-white/30 shadow-[0_0_40px_rgba(139,92,246,0.6)]"
        >
          <Gamepad2 className="w-12 h-12 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">게임 시작</h2>
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
  const { hasInBodyData, hasInBodySynced, hasMissionsGenerated, setMissionsGenerated } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showExitTransition, setShowExitTransition] = useState(false);

  // 게임 시작 시 로딩 화면 표시
  useEffect(() => {
    if (hasMissionsGenerated && hasInBodySynced && !gameStarted) {
      setShowLoading(true);
    }
  }, [hasMissionsGenerated, hasInBodySynced, gameStarted]);

  const handleGenerateMissions = async () => {
    setIsGenerating(true);
    
    // Simulate API call to generate missions
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setMissionsGenerated(true);
    toast.success('AI 미션이 생성되었습니다!');
    setIsGenerating(false);
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    setGameStarted(true);
  };

  const handleExit = () => {
    // 먼저 메인 화면으로 이동한 후 트랜지션 표시
    navigate('/main', { state: { fromGame: true } });
  };

  const handleExitTransitionComplete = () => {
    // 애니메이션 완료 시 아무것도 하지 않음 (이미 메인 페이지에 있음)
  };

  // 나가기 트랜지션 컴포넌트 - 메인 UI가 바로 보이도록 개선
  // ExitTransition은 이제 MainPage에서 처리됨
  const ExitTransition = () => null;

  // State: No body data at all or not synced with Samsung Health
  if (!hasInBodyData || !hasInBodySynced) {
    return (
      <div className="h-full flex flex-col bg-background relative">
        <GameBackground />
        <ExitTransition />
        
        {/* Header */}
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
              게임을 시작하려면 먼저<br />Samsung Health 연동이 필요합니다
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

  // 로딩 화면
  if (showLoading) {
    return <GameLoadingScreen onComplete={handleLoadingComplete} />;
  }

  // State: Has body data but no missions generated
  if (!hasMissionsGenerated) {
    return (
      <div className="h-full flex flex-col bg-background relative">
        <GameBackground />
        <ExitTransition />
        
        {/* Header with Exit Button */}
        <div className="relative z-10 px-6 pt-safe-top pb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">챌린지 게임</h1>
          <motion.button
            onClick={handleExit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm border border-white/30 text-white hover:from-violet-500/80 hover:to-purple-500/80 transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]"
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
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: 'reverse'
              }}
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
              AI가 당신의 신체 데이터를 분석하여<br />
              맞춤형 건강 미션을 만들어드려요
            </p>

            {/* Preview of what's coming */}
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
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] transition-shadow"
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

  // State: Missions generated - Game is active (No bottom nav)
  return (
    <div className="h-full flex flex-col bg-background relative">
      <GameBackground />
      <ExitTransition />
      
      {/* Header with Exit Button */}
      <div className="relative z-10 px-6 pt-safe-top pb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white drop-shadow-lg">챌린지 게임</h1>
        <motion.button
          onClick={handleExit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm border border-white/30 text-white hover:from-violet-500/80 hover:to-purple-500/80 transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">나가기</span>
        </motion.button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Character Level Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div 
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3 border-2 border-white/30 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gamepad2 className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-lg font-bold text-white">레벨 1</h3>
            <p className="text-white/60 text-sm">건강 초보자</p>
            
            {/* XP Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/50 text-xs">경험치</span>
                <span className="font-semibold text-yellow-300 text-xs">0 / 100 XP</span>
              </div>
              <div className="h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full w-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Missions Preview */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">오늘의 미션</h3>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full border border-white/10">
                0/3 완료
              </span>
            </div>
            
            <div className="text-center py-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gamepad2 className="w-12 h-12 text-white/30 mx-auto mb-3" />
              </motion.div>
              <p className="text-white/50 text-sm">
                🎮 게임 UI는 2~3단계에서<br />구현될 예정입니다
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default GamePage;
