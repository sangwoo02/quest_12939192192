/**
 * 📜 AI 미션 목록 뷰 (타입별 슬롯 시스템)
 *
 * 슬롯 구조: A(활동), B(루틴), C(기록) 각 1개씩 총 3슬롯
 * 각 슬롯은 해당 타입 풀에서만 미션 생성/재생성
 *
 * 미션 서브타입:
 * - A1_STEP_TARGET: 걸음수 목표 (00시 초기화)
 * - A2_ACTIVE_KCAL_TARGET: 활동칼로리 목표 (00시 초기화)
 * - B1_TIMER_STRETCH: 스트레칭 타이머
 * - B2_SLEEP_PREP: 휴식 루틴 타이머
 * - B3_ROUTINE_CHECK: 반복 체크인 (물 마시기 등)
 * - C1_HEALTH_CHECKIN: 컨디션 기록 (15자 이상)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Footprints,
  Activity,
  RefreshCw,
  Play,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Ticket,
  ShoppingCart,
  Moon,
  Droplets,
  PenLine,
  Flame,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MissionTimerWidget from "./missions/MissionTimerWidget";
import MissionRoutineWidget from "./missions/MissionRoutineWidget";
import MissionCheckinDialog from "./missions/MissionCheckinDialog";

// ── Types ──────────────────────────────────────────────
type MissionType = "A" | "B" | "C";
type MissionSubType =
  | "A1_STEP_TARGET"
  | "A2_ACTIVE_KCAL_TARGET"
  | "B1_TIMER_STRETCH"
  | "B2_SLEEP_PREP"
  | "B3_ROUTINE_CHECK"
  | "C1_HEALTH_CHECKIN";
type MissionStatus = "pending" | "in_progress" | "completed" | "ended";

interface GameMission {
  id: number;
  title: string;
  description: string;
  icon: typeof Activity;
  xp: number;
  coins: number;
  type: MissionType;
  subType: MissionSubType;
  status: MissionStatus;
  interactionCompleted?: boolean;
  // A-type
  targetSteps?: number;
  targetKcal?: number;
  // B-type
  timerMinutes?: number;
  routineCount?: number;
  routineIntervalMinutes?: number;
}

// ── Config ─────────────────────────────────────────────
const TYPE_CONFIG: Record<
  MissionType,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Activity }
> = {
  A: { label: "활동", color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-blue-400/30", icon: Activity },
  B: { label: "루틴", color: "text-green-400", bgColor: "bg-green-500/15", borderColor: "border-green-400/30", icon: Moon },
  C: { label: "기록", color: "text-orange-400", bgColor: "bg-orange-500/15", borderColor: "border-orange-400/30", icon: PenLine },
};

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  pending: { label: "대기", color: "text-white/50", bgColor: "bg-white/5", borderColor: "border-white/10" },
  in_progress: { label: "진행중", color: "text-violet-400", bgColor: "bg-violet-500/15", borderColor: "border-violet-400/30" },
  completed: { label: "완료", color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-400/30" },
  ended: { label: "종료", color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-400/20" },
};

// ── Mission Pools ──────────────────────────────────────
type MissionTemplate = Omit<GameMission, "status" | "interactionCompleted">;

const A_POOL: MissionTemplate[] = [
  { id: 101, title: "5,000보 걷기 도전", description: "5,000보 걷기에 도전해보세요 (00시가 넘어가면 초기화됨)", icon: Footprints, xp: 25, coins: 12, type: "A", subType: "A1_STEP_TARGET", targetSteps: 5000 },
  { id: 102, title: "8,000보 걷기 도전", description: "8,000보 걷기에 도전해보세요 (00시가 넘어가면 초기화됨)", icon: Footprints, xp: 35, coins: 18, type: "A", subType: "A1_STEP_TARGET", targetSteps: 8000 },
  { id: 103, title: "10,000보 걷기 도전", description: "10,000보 걷기에 도전해보세요 (00시가 넘어가면 초기화됨)", icon: Footprints, xp: 40, coins: 20, type: "A", subType: "A1_STEP_TARGET", targetSteps: 10000 },
  { id: 104, title: "활동칼로리 200kcal 달성", description: "활동칼로리 200kcal 달성에 도전해보세요", icon: Flame, xp: 25, coins: 12, type: "A", subType: "A2_ACTIVE_KCAL_TARGET", targetKcal: 200 },
  { id: 105, title: "활동칼로리 300kcal 달성", description: "활동칼로리 300kcal 달성에 도전해보세요", icon: Flame, xp: 35, coins: 18, type: "A", subType: "A2_ACTIVE_KCAL_TARGET", targetKcal: 300 },
  { id: 106, title: "활동칼로리 150kcal 달성", description: "활동칼로리 150kcal 달성에 도전해보세요", icon: Flame, xp: 15, coins: 8, type: "A", subType: "A2_ACTIVE_KCAL_TARGET", targetKcal: 150 },
];

const B_POOL: MissionTemplate[] = [
  { id: 201, title: "스트레칭 5분", description: "스트레칭 5분을 완료해보세요", icon: Activity, xp: 15, coins: 8, type: "B", subType: "B1_TIMER_STRETCH", timerMinutes: 5 },
  { id: 202, title: "스트레칭 10분", description: "스트레칭 10분을 완료해보세요", icon: Activity, xp: 25, coins: 12, type: "B", subType: "B1_TIMER_STRETCH", timerMinutes: 10 },
  { id: 203, title: "휴식 루틴 5분", description: "편안한 휴식을 위한 5분 루틴을 진행해보세요", icon: Moon, xp: 20, coins: 10, type: "B", subType: "B2_SLEEP_PREP", timerMinutes: 5 },
  { id: 204, title: "휴식 루틴 10분", description: "편안한 휴식을 위한 10분 루틴을 진행해보세요", icon: Moon, xp: 30, coins: 15, type: "B", subType: "B2_SLEEP_PREP", timerMinutes: 10 },
  { id: 205, title: "물 마시기 루틴 3회", description: "물 마시기 루틴 3회(10분마다)를 체크해보세요", icon: Droplets, xp: 20, coins: 10, type: "B", subType: "B3_ROUTINE_CHECK", routineCount: 3, routineIntervalMinutes: 10 },
  { id: 206, title: "물 마시기 루틴 5회", description: "물 마시기 루틴 5회(10분마다)를 체크해보세요", icon: Droplets, xp: 30, coins: 15, type: "B", subType: "B3_ROUTINE_CHECK", routineCount: 5, routineIntervalMinutes: 10 },
];

const C_POOL: MissionTemplate[] = [
  { id: 301, title: "컨디션 기록", description: "컨디션 기록 미션에 도전해보세요", icon: PenLine, xp: 15, coins: 8, type: "C", subType: "C1_HEALTH_CHECKIN" },
  { id: 302, title: "컨디션 체크인", description: "컨디션을 기록해보세요", icon: PenLine, xp: 15, coins: 8, type: "C", subType: "C1_HEALTH_CHECKIN" },
];

const getPool = (type: MissionType): MissionTemplate[] => {
  if (type === "A") return A_POOL;
  if (type === "B") return B_POOL;
  return C_POOL;
};

const pickRandom = (pool: MissionTemplate[], excludeId?: number): MissionTemplate => {
  const candidates = excludeId ? pool.filter((m) => m.id !== excludeId) : pool;
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)];
};

// ── Component ──────────────────────────────────────────
const MissionsView = () => {
  const navigate = useNavigate();
  const { addCoins, addExp, missionCoins, useMissionCoin, incrementDailyRegen, getDailyRegenRemaining, activityHistory } =
    useAppStore();

  // 오늘의 활동 데이터 (A-type 진행도)
  const today = new Date().toISOString().split("T")[0];
  const todayActivity = activityHistory.find((a) => a.date === today);
  const currentSteps = todayActivity?.steps || 0;
  const currentCalories = todayActivity?.calories || 0;

  const [missions, setMissions] = useState<GameMission[]>(() => [
    { ...pickRandom(A_POOL), status: "pending", interactionCompleted: false },
    { ...pickRandom(B_POOL), status: "pending", interactionCompleted: false },
    { ...pickRandom(C_POOL), status: "pending", interactionCompleted: false },
  ]);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [giveUpTargetId, setGiveUpTargetId] = useState<number | null>(null);
  const [completeTargetId, setCompleteTargetId] = useState<number | null>(null);
  const [showDailyLimitDialog, setShowDailyLimitDialog] = useState(false);
  const [showUseCoinDialog, setShowUseCoinDialog] = useState(false);
  const [showNoCoinDialog, setShowNoCoinDialog] = useState(false);
  const [pendingCoinAction, setPendingCoinAction] = useState<{ type: "refresh" | "complete"; missionId: number } | null>(null);

  const hasActiveMission = missions.some((m) => m.status === "in_progress");
  const dailyRemaining = getDailyRegenRemaining();

  // ── Helpers ────────────────────────────────────────
  const doRegenerate = async (missionId: number) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;
    setRefreshingId(missionId);
    incrementDailyRegen();
    await new Promise((r) => setTimeout(r, 800));
    const newMission = pickRandom(getPool(mission.type), missionId);
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...newMission, status: "pending" as const, interactionCompleted: false } : m)),
    );
    setRefreshingId(null);
  };

  const setInteractionCompleted = (missionId: number) => {
    setMissions((prev) => prev.map((m) => (m.id === missionId ? { ...m, interactionCompleted: true } : m)));
  };

  const canCompleteMission = (mission: GameMission): boolean => {
    if (mission.subType === "A1_STEP_TARGET") return currentSteps >= (mission.targetSteps || 0);
    if (mission.subType === "A2_ACTIVE_KCAL_TARGET") return currentCalories >= (mission.targetKcal || 0);
    return mission.interactionCompleted === true;
  };

  // ── Handlers ───────────────────────────────────────
  const handleRefresh = async (missionId: number) => {
    if (refreshingId !== null) return;
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.status !== "pending") return;
    if (dailyRemaining <= 0) {
      setPendingCoinAction({ type: "refresh", missionId });
      setShowDailyLimitDialog(true);
      return;
    }
    await doRegenerate(missionId);
  };

  const handleAccept = (missionId: number) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status: "in_progress" as const, interactionCompleted: false } : m)),
    );
  };

  const handleGiveUp = async () => {
    if (giveUpTargetId === null) return;
    const missionId = giveUpTargetId;
    setGiveUpTargetId(null);
    if (dailyRemaining <= 0) {
      setPendingCoinAction({ type: "refresh", missionId });
      setShowDailyLimitDialog(true);
      return;
    }
    await doRegenerate(missionId);
  };

  const handleComplete = async () => {
    if (completeTargetId === null) return;
    const mission = missions.find((m) => m.id === completeTargetId);
    if (!mission) return;
    addExp(mission.xp);
    addCoins(mission.coins);
    const missionId = completeTargetId;
    setCompleteTargetId(null);
    if (dailyRemaining > 0) {
      await doRegenerate(missionId);
    } else {
      setMissions((prev) => prev.map((m) => (m.id === missionId ? { ...m, status: "ended" as const } : m)));
    }
  };

  const handleInlineUseCoin = (missionId: number) => {
    setPendingCoinAction({ type: "complete", missionId });
    if (missionCoins > 0) setShowUseCoinDialog(true);
    else setShowNoCoinDialog(true);
  };

  const handleUseCoinConfirm = () => {
    setShowDailyLimitDialog(false);
    if (missionCoins > 0) setShowUseCoinDialog(true);
    else setShowNoCoinDialog(true);
  };

  const handleCoinUseYes = async () => {
    setShowUseCoinDialog(false);
    if (!pendingCoinAction || missionCoins <= 0) {
      setShowNoCoinDialog(true);
      return;
    }
    const success = useMissionCoin();
    if (!success) {
      setShowNoCoinDialog(true);
      return;
    }
    await doRegenerate(pendingCoinAction.missionId);
    setPendingCoinAction(null);
  };

  // ── Render Interaction UI ──────────────────────────
  const renderInteractionUI = (mission: GameMission) => {
    if (mission.status !== "in_progress") return null;

    switch (mission.subType) {
      case "A1_STEP_TARGET": {
        const target = mission.targetSteps || 0;
        const pct = Math.min(100, (currentSteps / target) * 100);
        return (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-blue-300 font-mono">{currentSteps.toLocaleString()}보</span>
              <span className="text-white/40">{target.toLocaleString()}보</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        );
      }
      case "A2_ACTIVE_KCAL_TARGET": {
        const target = mission.targetKcal || 0;
        const pct = Math.min(100, (currentCalories / target) * 100);
        return (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-orange-300 font-mono">{currentCalories.toLocaleString()}kcal</span>
              <span className="text-white/40">{target.toLocaleString()}kcal</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        );
      }
      case "B1_TIMER_STRETCH":
        return (
          <div className="mt-2">
            <MissionTimerWidget
              minutes={mission.timerMinutes || 5}
              label="스트레칭"
              onComplete={() => setInteractionCompleted(mission.id)}
            />
          </div>
        );
      case "B2_SLEEP_PREP":
        return (
          <div className="mt-2">
            <MissionTimerWidget
              minutes={mission.timerMinutes || 5}
              label="휴식"
              onComplete={() => setInteractionCompleted(mission.id)}
            />
          </div>
        );
      case "B3_ROUTINE_CHECK":
        return (
          <div className="mt-2">
            <MissionRoutineWidget
              totalRounds={mission.routineCount || 3}
              intervalMinutes={mission.routineIntervalMinutes || 10}
              onComplete={() => setInteractionCompleted(mission.id)}
            />
          </div>
        );
      case "C1_HEALTH_CHECKIN":
        return (
          <div className="mt-2">
            <MissionCheckinDialog
              completed={mission.interactionCompleted}
              onComplete={() => setInteractionCompleted(mission.id)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">오늘의 미션</h2>
          </div>
          <span className="text-xs text-white/50 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            재생성 {dailyRemaining}/3
          </span>
        </div>

        {/* 타입 범례 */}
        <div className="flex items-center gap-2 mb-1">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div
              key={key}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cfg.bgColor} border ${cfg.borderColor} ${cfg.color}`}
            >
              <cfg.icon className="w-3 h-3" />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* 미션 카드들 */}
        {missions.map((mission, index) => {
          const typeConfig = TYPE_CONFIG[mission.type];
          const statusConfig = STATUS_CONFIG[mission.status];
          const isRefreshing = refreshingId === mission.id;
          const isDisabledByActive = hasActiveMission && mission.status === "pending";

          // ── ended 슬롯 ──
          if (mission.status === "ended") {
            return (
              <motion.div
                key={`ended-${mission.id}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-2xl p-5 border backdrop-blur-sm bg-cyan-500/5 border-cyan-400/20"
              >
                <AnimatePresence>
                  {isRefreshing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <RefreshCw className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm font-medium">미션 재생성 중...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
                    <typeConfig.icon className={`w-6 h-6 ${typeConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{typeConfig.label} 미션이 종료되었습니다</p>
                    <p className="text-xs text-white/40 mt-1">
                      추가 미션을 진행하고 싶으면
                      <br />
                      <span className="text-cyan-400 font-semibold">미션 코인</span>을 사용하세요
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleInlineUseCoin(mission.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold border border-white/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      미션 코인 사용
                    </motion.button>
                    <motion.button
                      whileTap={dailyRemaining > 0 ? { scale: 0.95 } : undefined}
                      disabled={dailyRemaining <= 0}
                      onClick={() => dailyRemaining > 0 && doRegenerate(mission.id)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        dailyRemaining > 0
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          : "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      무료 미션 재생성 ({dailyRemaining}/3)
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          }

          // ── 일반 미션 카드 ──
          const canComplete = mission.status === "in_progress" && canCompleteMission(mission);

          return (
            <motion.div
              key={`${mission.id}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDisabledByActive ? 0.5 : 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-4 border backdrop-blur-sm ${statusConfig.bgColor} ${statusConfig.borderColor}`}
            >
              <AnimatePresence>
                {isRefreshing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      <span className="text-sm font-medium">미션 재생성 중...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    mission.status === "completed"
                      ? "bg-gradient-to-br from-emerald-500 to-green-600"
                      : mission.status === "in_progress"
                        ? "bg-gradient-to-br from-violet-500 to-purple-600"
                        : "bg-white/10"
                  }`}
                >
                  {mission.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <mission.icon
                      className={`w-5 h-5 ${mission.status === "in_progress" ? "text-white" : "text-white/50"}`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3
                      className={`font-semibold text-sm ${
                        mission.status === "completed" ? "text-emerald-300 line-through" : "text-white"
                      }`}
                    >
                      {mission.title}
                    </h3>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${typeConfig.bgColor} border ${typeConfig.borderColor} ${typeConfig.color}`}
                    >
                      {typeConfig.label}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig.bgColor} border ${statusConfig.borderColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{mission.description}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-yellow-400 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />+{mission.xp} XP
                    </span>
                    <span className="text-[10px] text-yellow-300 font-semibold">+{mission.coins} 코인</span>
                  </div>

                  {/* 타입별 인터랙션 UI */}
                  {renderInteractionUI(mission)}

                  {/* 액션 버튼 */}
                  {mission.status === "pending" && (
                    <div className="flex items-center gap-2 mt-3">
                      <motion.button
                        whileTap={!isDisabledByActive ? { scale: 0.95 } : undefined}
                        onClick={() => !isDisabledByActive && handleAccept(mission.id)}
                        disabled={isDisabledByActive}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shadow-lg transition-all ${
                          isDisabledByActive
                            ? "bg-white/5 border-white/10 text-white/25 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-violet-600 to-purple-600 border-white/20 text-white"
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        미션 수락
                      </motion.button>
                      <motion.button
                        whileTap={!isDisabledByActive ? { scale: 0.95 } : undefined}
                        onClick={() => !isDisabledByActive && handleRefresh(mission.id)}
                        disabled={isDisabledByActive || refreshingId !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 text-white/60 text-[11px] font-medium border border-white/10 hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="w-3 h-3" />
                        새로고침
                      </motion.button>
                    </div>
                  )}
                  {mission.status === "in_progress" && (
                    <div className="flex items-center gap-2 mt-3">
                      <motion.button
                        whileTap={canComplete ? { scale: 0.95 } : undefined}
                        onClick={() => canComplete && setCompleteTargetId(mission.id)}
                        disabled={!canComplete}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shadow-lg transition-all ${
                          !canComplete
                            ? "bg-emerald-600/30 border-white/10 text-white/40 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-emerald-600 to-green-600 border-white/20 text-white"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {canComplete ? "미션 완료" : "진행 중"}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGiveUpTargetId(mission.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-medium border border-red-500/20 hover:bg-red-500/25 transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        포기
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="space-y-1 mt-4">
          <p className="text-center text-white/30 text-xs">미션 완료 시 XP와 코인을 획득할 수 있어요</p>
          <p className="text-center text-white/20 text-[10px]">한 번에 1개의 미션만 진행할 수 있습니다</p>
          <p className="text-center text-white/20 text-[10px]">하루 무료 재생성 {dailyRemaining}회 남음</p>
        </div>
      </motion.div>

      {/* 포기 확인 */}
      <AlertDialog open={giveUpTargetId !== null} onOpenChange={(open) => !open && setGiveUpTargetId(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              미션을 포기하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              포기하시면 해당 미션이 삭제되고 같은 타입의 새 미션이 재생성됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-white">
              아니요
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGiveUp} className="flex-1 m-0 bg-red-600 hover:bg-red-700 text-white border-none">
              포기하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 완료 확인 */}
      <AlertDialog open={completeTargetId !== null} onOpenChange={(open) => !open && setCompleteTargetId(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              미션을 완료하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {completeTargetId &&
                (() => {
                  const m = missions.find((m) => m.id === completeTargetId);
                  return m ? `보상: +${m.xp} XP, +${m.coins} 코인이 지급됩니다.` : "";
                })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-white">
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} className="flex-1 m-0 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              완료!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일일 한도 초과 */}
      <AlertDialog open={showDailyLimitDialog} onOpenChange={setShowDailyLimitDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-cyan-400" />
              오늘의 무료 새로고침 소진
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              오늘의 무료 미션 재생성 횟수(3회)를 모두 사용했습니다. 추가 재생성을 원하시면 미션 코인을 사용하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-white">
              닫기
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUseCoinConfirm} className="flex-1 m-0 bg-cyan-600 hover:bg-cyan-700 text-white border-none">
              <Ticket className="w-3.5 h-3.5 mr-1" />
              미션 코인 사용
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 코인 사용 확인 */}
      <AlertDialog open={showUseCoinDialog} onOpenChange={setShowUseCoinDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-cyan-400" />
              미션 코인 사용
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              코인 1개로 미션을 재생성 하시겠습니까?
              <br />
              <span className="text-cyan-300 text-xs">(보유 미션 코인: {missionCoins}개)</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-white">
              아니요
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCoinUseYes} className="flex-1 m-0 bg-cyan-600 hover:bg-cyan-700 text-white border-none">
              예
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 코인 없음 */}
      <AlertDialog open={showNoCoinDialog} onOpenChange={setShowNoCoinDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-yellow-400" />
              미션 코인이 부족합니다
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              미션 코인이 없습니다. 상점에서 미션 코인을 구매하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-white">
              닫기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoCoinDialog(false);
                setPendingCoinAction(null);
                navigate("/mission-coin-shop");
              }}
              className="flex-1 m-0 bg-yellow-600 hover:bg-yellow-700 text-white border-none"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              구매하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MissionsView;
