/**
 * 📜 AI 미션 목록 뷰 - 서버 연동 버전
 *
 * 이번 단계 목표
 * - 서버에서 받아온 missions(appStore.missions) 렌더링
 * - refresh-slot / complete-slot API 연결
 * - 완료/재생성 후 서버 상태 재조회
 * - null / 빈 미션 상태 안전 처리
 *
 * 아직 유지하는 것
 * - B1/B2/B3/C1 프론트 상호작용 위젯
 * - 타입별 UI 스타일
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Ticket,
  ShoppingCart,
  Moon,
  Droplets,
  PenLine,
  Flame,
  Sparkles,
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
import { healthcareApi, missionsApi } from "@/services/api";
import type { CurrentMission, MissionSlotCode } from "@/types";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// 타입 설정
// ─────────────────────────────────────────────
type LocalMissionStatus = "pending" | "in_progress" | "completed" | "ended";

const TYPE_CONFIG: Record<
  MissionSlotCode,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Activity;
  }
> = {
  A: {
    label: "활동",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-400/30",
    icon: Activity,
  },
  B: {
    label: "루틴",
    color: "text-green-400",
    bgColor: "bg-green-500/15",
    borderColor: "border-green-400/30",
    icon: Moon,
  },
  C: {
    label: "기록",
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    borderColor: "border-orange-400/30",
    icon: PenLine,
  },
};

const STATUS_CONFIG: Record<
  LocalMissionStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending: {
    label: "대기",
    color: "text-white/50",
    bgColor: "bg-white/5",
    borderColor: "border-white/10",
  },
  in_progress: {
    label: "진행중",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
    borderColor: "border-violet-400/30",
  },
  completed: {
    label: "완료",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-400/30",
  },
  ended: {
    label: "종료",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/20",
  },
};

const getMissionIcon = (missionType: string) => {
  switch (missionType) {
    case "A1_STEP_TARGET":
      return Footprints;
    case "A2_ACTIVE_KCAL_TARGET":
      return Flame;
    case "B1_TIMER_STRETCH":
      return Activity;
    case "B2_SLEEP_PREP":
      return Moon;
    case "B3_ROUTINE_CHECK":
      return Droplets;
    case "C1_HEALTH_CHECKIN":
      return PenLine;
    default:
      return Activity;
  }
};

const normalizeMissionStatus = (
  mission: CurrentMission,
  dailyFreeRegenRemaining: number
): LocalMissionStatus => {
  if (mission.status === "completed") return "completed";

  // refreshed 상태는 보통 current에서 안 잡히겠지만 방어적으로 처리
  if (mission.status === "refreshed") {
    return dailyFreeRegenRemaining <= 0 ? "ended" : "pending";
  }

  if (mission.status === "in_progress") return "in_progress";

  // active는 UI에서 pending으로 보여주기
  if (mission.status === "active") return "pending";

  return "pending";
};

const getSortedMissionSlots = (missions: CurrentMission[]) => {
  const slotOrder: MissionSlotCode[] = ["A", "B", "C"];

  return [...missions].sort((a, b) => {
    const aIndex = slotOrder.indexOf((a.slot_code as MissionSlotCode) || "A");
    const bIndex = slotOrder.indexOf((b.slot_code as MissionSlotCode) || "A");
    return aIndex - bIndex;
  });
};

const MissionsView = () => {
  const navigate = useNavigate();

  const {
    missions,
    missionCoins,
    dailyMissionRegenCount,
    gameProfile,
    refreshGameState,
    setMissions,
  } = useAppStore();

  // 서버 최신값 기준으로 다시 계산할 현재 활동 데이터
  const [currentSteps, setCurrentSteps] = useState(0);
  const [currentCalories, setCurrentCalories] = useState(0);

  const [refreshingSlot, setRefreshingSlot] = useState<MissionSlotCode | null>(null);
  const [submittingSlot, setSubmittingSlot] = useState<MissionSlotCode | null>(null);

  const [giveUpTargetSlot, setGiveUpTargetSlot] = useState<MissionSlotCode | null>(null);
  const [completeTargetSlot, setCompleteTargetSlot] = useState<MissionSlotCode | null>(null);

  const [showDailyLimitDialog, setShowDailyLimitDialog] = useState(false);
  const [showUseCoinDialog, setShowUseCoinDialog] = useState(false);
  const [showNoCoinDialog, setShowNoCoinDialog] = useState(false);

  const [pendingCoinAction, setPendingCoinAction] = useState<{
    type: "refresh" | "complete";
    slotCode: MissionSlotCode;
  } | null>(null);

  // B/C 타입의 프론트 상호작용 완료 상태
  const [interactionState, setInteractionState] = useState<
    Record<
      string,
      {
        completed: boolean;
        checkinText?: string;
      }
    >
  >({});

  const dailyRemaining = gameProfile?.daily_free_regen_remaining ?? Math.max(0, 3 - dailyMissionRegenCount);

  const sortedMissions = useMemo(() => getSortedMissionSlots(missions), [missions]);

  const hasActiveMission = sortedMissions.some((m) => m.status === "in_progress");

  // ─────────────────────────────────────────────
  // 서버 재조회
  // ─────────────────────────────────────────────
  const reloadMissionState = useCallback(async () => {
    try {
      const [gameState, healthResult] = await Promise.all([
        refreshGameState(),
        healthcareApi.getLatestFast().catch(() => null),
      ]);

      setCurrentSteps(healthResult?.activity?.steps ?? 0);
      setCurrentCalories(healthResult?.activity?.calories ?? 0);

      const nextMissions = gameState?.missions ?? [];

      setInteractionState((prev) => {
        const next: typeof prev = {};
        nextMissions.forEach((mission) => {
          const key = `${mission.slot_code}-${mission.id}`;
          if (prev[key]) next[key] = prev[key];
        });
        return next;
      });
    } catch (error) {
      console.error('미션 상태 재조회 실패:', error);
      toast.error('미션 상태를 다시 불러오지 못했습니다.');
    }
  }, [refreshGameState]);

  useEffect(() => {
    reloadMissionState();
  }, [reloadMissionState]);

  // ─────────────────────────────────────────────
  // 도우미 함수
  // ─────────────────────────────────────────────
  const getMissionKey = (mission: CurrentMission) => `${mission.slot_code}-${mission.id}`;

  const markInteractionCompleted = (mission: CurrentMission, payload?: { checkinText?: string }) => {
    const key = getMissionKey(mission);
    setInteractionState((prev) => ({
      ...prev,
      [key]: {
        completed: true,
        checkinText: payload?.checkinText,
      },
    }));
  };

  const isInteractionCompleted = (mission: CurrentMission) => {
    const key = getMissionKey(mission);
    return interactionState[key]?.completed === true;
  };

  const getMissionParams = (mission: CurrentMission) => mission.params || {};
  const getMissionProgress = (mission: CurrentMission) => mission.progress || {};

  const canCompleteMission = (mission: CurrentMission): boolean => {
    const params = getMissionParams(mission);

    if (mission.mission_type === "A1_STEP_TARGET") {
      return currentSteps >= Number(params.target_steps || 0);
    }

    if (mission.mission_type === "A2_ACTIVE_KCAL_TARGET") {
      return currentCalories >= Number(params.target_kcal || 0);
    }

    return isInteractionCompleted(mission);
  };

  const getCompletePayload = (mission: CurrentMission) => {
    const key = getMissionKey(mission);
    const interaction = interactionState[key];

    switch (mission.mission_type) {
      case "B1_TIMER_STRETCH":
      case "B2_SLEEP_PREP":
        return {
          interaction_completed: !!interaction?.completed,
        };

      case "B3_ROUTINE_CHECK":
        return {
          interaction_completed: !!interaction?.completed,
        };

      case "C1_HEALTH_CHECKIN":
        return {
          interaction_completed: !!interaction?.completed,
          checkin_text: interaction?.checkinText || "",
        };

      default:
        return {};
    }
  };

  const handleAccept = (slotCode: MissionSlotCode) => {
    setMissions(
      missions.map((mission) =>
        mission.slot_code === slotCode
          ? {
              ...mission,
              status: "in_progress",
            }
          : mission
      )
    );
  };

  const doRefreshSlot = async (slotCode: MissionSlotCode, useMissionCoinIfNeeded = false) => {
    try {
      setRefreshingSlot(slotCode);

      const result = await missionsApi.refreshSlot({
        slot_code: slotCode,
        use_mission_coin_if_needed: useMissionCoinIfNeeded,
      });

      // 백엔드가 coin 필요 상태를 정상 응답으로 줄 수 있음
      if (!result.ok && result.error_code === "MISSION_COIN_REQUIRED") {
        setPendingCoinAction({ type: "refresh", slotCode });
        if (missionCoins > 0) {
          setShowUseCoinDialog(true);
        } else {
          setShowNoCoinDialog(true);
        }
        return;
      }

      if (!result.ok) {
        toast.error(result.message || "미션 재생성에 실패했습니다.");
        return;
      }

      toast.success(result.message || "미션이 재생성되었습니다.");

      await reloadMissionState();
    } catch (error: any) {
      console.error("미션 재생성 실패:", error);
      toast.error(error?.message || "미션 재생성에 실패했습니다.");
    } finally {
      setRefreshingSlot(null);
    }
  };

  const handleRefresh = async (mission: CurrentMission) => {
    if (refreshingSlot || submittingSlot) return;

    if (mission.status !== "active") return;

    if (dailyRemaining <= 0) {
      setPendingCoinAction({
        type: "refresh",
        slotCode: mission.slot_code as MissionSlotCode,
      });
      setShowDailyLimitDialog(true);
      return;
    }

    await doRefreshSlot(mission.slot_code as MissionSlotCode, false);
  };

  const handleGiveUpConfirm = async () => {
    if (!giveUpTargetSlot) return;

    const slotCode = giveUpTargetSlot;
    setGiveUpTargetSlot(null);

    if (dailyRemaining <= 0) {
      setPendingCoinAction({ type: "refresh", slotCode });
      setShowDailyLimitDialog(true);
      return;
    }

    await doRefreshSlot(slotCode, false);
  };

  const doCompleteSlot = async (slotCode: MissionSlotCode) => {
    const mission = sortedMissions.find((m) => m.slot_code === slotCode);
    if (!mission) return;

    try {
      setSubmittingSlot(slotCode);

      const result = await missionsApi.completeSlot({
        slot_code: slotCode,
        client_payload: getCompletePayload(mission),
      });

      if (!result.ok) {
        toast.error(result.message || "미션 완료 처리에 실패했습니다.");
        return;
      }

      if (!result.completed) {
        toast.warning(result.message || "아직 완료 조건을 충족하지 않았습니다.");
        await reloadMissionState();
        return;
      }

      toast.success(result.message || "미션 완료!");

      await reloadMissionState();
    } catch (error: any) {
      console.error("미션 완료 실패:", error);
      toast.error(error?.message || "미션 완료 처리에 실패했습니다.");
    } finally {
      setSubmittingSlot(null);
      setCompleteTargetSlot(null);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!completeTargetSlot) return;

    const slotCode = completeTargetSlot;
    await doCompleteSlot(slotCode);
  };

  const handleInlineUseCoin = (slotCode: MissionSlotCode) => {
    setPendingCoinAction({
      type: "refresh",
      slotCode,
    });

    if (missionCoins > 0) {
      setShowUseCoinDialog(true);
    } else {
      setShowNoCoinDialog(true);
    }
  };

  const handleUseCoinConfirm = () => {
    setShowDailyLimitDialog(false);

    if (missionCoins > 0) {
      setShowUseCoinDialog(true);
    } else {
      setShowNoCoinDialog(true);
    }
  };

  const handleCoinUseYes = async () => {
    if (!pendingCoinAction) return;

    setShowUseCoinDialog(false);

    // 실제 코인 차감/슬롯 재생성은 refresh-slot API가 처리
    await doRefreshSlot(pendingCoinAction.slotCode, true);

    setPendingCoinAction(null);
  };

  // ─────────────────────────────────────────────
  // 타입별 인터랙션 UI
  // ─────────────────────────────────────────────
  const renderInteractionUI = (mission: CurrentMission) => {
    if (mission.status !== "in_progress") return null;

    const params = getMissionParams(mission);

    switch (mission.mission_type) {
      case "A1_STEP_TARGET": {
        const target = Number(params.target_steps || 0);
        const pct = target > 0 ? Math.min(100, (currentSteps / target) * 100) : 0;

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
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        );
      }

      case "A2_ACTIVE_KCAL_TARGET": {
        const target = Number(params.target_kcal || 0);
        const pct = target > 0 ? Math.min(100, (currentCalories / target) * 100) : 0;

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
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        );
      }

      case "B1_TIMER_STRETCH":
        return (
          <div className="mt-2">
            <MissionTimerWidget
              minutes={Number(params.duration_min || 5)}
              label="스트레칭"
              onComplete={() => markInteractionCompleted(mission)}
            />
          </div>
        );

      case "B2_SLEEP_PREP":
        return (
          <div className="mt-2">
            <MissionTimerWidget
              minutes={Number(params.duration_min || 5)}
              label="휴식"
              onComplete={() => markInteractionCompleted(mission)}
            />
          </div>
        );

      case "B3_ROUTINE_CHECK":
        return (
          <div className="mt-2">
            <MissionRoutineWidget
              totalRounds={Number(params.total_count || 3)}
              intervalMinutes={Number(params.interval_min || 10)}
              onComplete={() => markInteractionCompleted(mission)}
            />
          </div>
        );

      case "C1_HEALTH_CHECKIN":
        return (
          <div className="mt-2">
            <MissionCheckinDialog
              completed={isInteractionCompleted(mission)}
              onComplete={(text) => markInteractionCompleted(mission, { checkinText: text })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────
  // 빈 상태
  // ─────────────────────────────────────────────
  if (!sortedMissions || sortedMissions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-violet-300" />
          </div>

          <p className="text-white font-semibold">현재 표시할 AI 미션이 없습니다</p>
          <p className="text-white/50 text-sm mt-2">
            미션이 삭제되었거나 아직 생성되지 않았을 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────────
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

        {sortedMissions.map((mission, index) => {
          const slotCode = mission.slot_code as MissionSlotCode;
          const typeConfig = TYPE_CONFIG[slotCode] || TYPE_CONFIG.A;
          const status = normalizeMissionStatus(mission, dailyRemaining);
          const statusConfig = STATUS_CONFIG[status];
          const Icon = getMissionIcon(mission.mission_type);

          const isRefreshing = refreshingSlot === slotCode;
          const isSubmitting = submittingSlot === slotCode;
          const isDisabledByActive = hasActiveMission && mission.status === "active";
          const canComplete = mission.status === "in_progress" && canCompleteMission(mission);

          // 종료 UI: 무료 재생성이 없고, 이 슬롯이 더 이상 자동 재생성 없이 비어 있거나 막힌 경우용
          // 지금 current에 ended 슬롯이 따로 안 올 수 있어서, 실제 ended UI는 최소화해서 유지
          if (status === "ended") {
            return (
              <motion.div
                key={`${mission.id}-${slotCode}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                className="relative rounded-2xl p-5 border backdrop-blur-sm bg-cyan-500/5 border-cyan-400/20"
              >
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
                      onClick={() => handleInlineUseCoin(slotCode)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold border border-white/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      미션 코인 사용
                    </motion.button>

                    <motion.button
                      whileTap={dailyRemaining > 0 ? { scale: 0.95 } : undefined}
                      disabled={dailyRemaining <= 0}
                      onClick={() => dailyRemaining > 0 && doRefreshSlot(slotCode)}
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

          return (
            <motion.div
              key={`${mission.id}-${slotCode}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDisabledByActive ? 0.5 : 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative rounded-2xl p-4 border backdrop-blur-sm ${statusConfig.bgColor} ${statusConfig.borderColor}`}
            >
              <AnimatePresence>
                {(isRefreshing || isSubmitting) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      <span className="text-sm font-medium">
                        {isRefreshing ? "미션 재생성 중..." : "미션 처리 중..."}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    mission.status === "completed"
                      ? "bg-emerald-500/20 border border-emerald-400/30"
                      : `${typeConfig.bgColor} border ${typeConfig.borderColor}`
                  }`}
                >
                  {mission.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <Icon className={`w-5 h-5 ${typeConfig.color}`} />
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

                  <p className="text-xs text-white/55 mt-1 leading-relaxed">{mission.description}</p>

                  {/* 보상 */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-[10px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
                      EXP +{mission.reward_exp}
                    </div>
                    <div className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
                      코인 +{mission.reward_coins}
                    </div>
                  </div>

                  {/* 인터랙션 UI */}
                  {renderInteractionUI(mission)}

                  {/* 버튼 영역 */}
                  <div className="flex items-center gap-2 mt-3">
                    {mission.status === "active" && (
                      <>
                        <motion.button
                          whileTap={!isDisabledByActive ? { scale: 0.95 } : undefined}
                          disabled={isDisabledByActive || !!refreshingSlot || !!submittingSlot}
                          onClick={() => handleAccept(slotCode)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            isDisabledByActive
                              ? "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                              : "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          진행하기
                        </motion.button>

                        <motion.button
                          whileTap={!isDisabledByActive ? { scale: 0.95 } : undefined}
                          disabled={isDisabledByActive || !!refreshingSlot || !!submittingSlot}
                          onClick={() => handleRefresh(mission)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            isDisabledByActive
                              ? "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                              : "bg-white/10 text-white border-white/15 hover:bg-white/15"
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </motion.button>
                      </>
                    )}

                    {mission.status === "in_progress" && (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={!canComplete || !!submittingSlot || !!refreshingSlot}
                          onClick={() => setCompleteTargetSlot(slotCode)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            canComplete
                              ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                              : "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          미션 성공
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={!!submittingSlot || !!refreshingSlot}
                          onClick={() => setGiveUpTargetSlot(slotCode)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/15 transition-all"
                        >
                          포기
                        </motion.button>
                      </>
                    )}

                    {mission.status === "completed" && (
                      <div className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        미션 완료
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 포기 확인 */}
      <AlertDialog open={!!giveUpTargetSlot} onOpenChange={(open) => !open && setGiveUpTargetSlot(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">미션을 포기할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              포기하면 해당 슬롯의 미션이 재생성됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setGiveUpTargetSlot(null)}
              className="bg-white/5 text-white border-white/10 hover:bg-white/10"
            >
              아니요
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGiveUpConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              포기하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 완료 확인 */}
      <AlertDialog open={!!completeTargetSlot} onOpenChange={(open) => !open && setCompleteTargetSlot(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">미션을 완료 처리할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              성공 처리되면 보상이 지급되고 같은 슬롯에 새 미션이 생성될 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCompleteTargetSlot(null)}
              className="bg-white/5 text-white border-white/10 hover:bg-white/10"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              완료하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 하루 무료 재생성 소진 */}
      <AlertDialog open={showDailyLimitDialog} onOpenChange={setShowDailyLimitDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">오늘 무료 재생성을 모두 사용했어요</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              추가 미션을 진행하려면 미션 코인을 사용해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUseCoinConfirm}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              미션 코인 사용
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 미션 코인 사용 확인 */}
      <AlertDialog open={showUseCoinDialog} onOpenChange={setShowUseCoinDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">미션 코인을 사용할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              코인 1개를 사용해서 해당 슬롯의 미션을 다시 생성합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">
              아니요
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCoinUseYes}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              예
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 코인 부족 */}
      <AlertDialog open={showNoCoinDialog} onOpenChange={setShowNoCoinDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">미션 코인이 부족합니다</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              미션 코인을 구매하려면 결제 페이지로 이동해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">
              닫기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/mission-coin-shop")}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              결제 페이지로
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MissionsView;