/**
 * 🔄 루틴 체크 위젯 (B3_ROUTINE_CHECK)
 * store 기반 상태 복원 버전
 * - startedAt / endsAt / uiState / currentRound를 외부 상태와 동기화
 * - 홈/상점 이동 후 돌아와도 진행 상태 복원
 * - 앱 재실행 후에도 persisted store 기준으로 복원 가능
 */
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Timer, Droplets } from "lucide-react";

interface MissionRoutineWidgetProps {
  totalRounds: number;
  intervalMinutes: number;
  completed?: boolean;
  startedAt?: number;
  endsAt?: number;
  currentRound?: number;
  uiState?: "idle" | "waiting" | "ready" | "done";
  onStateChange: (payload: {
    startedAt?: number;
    endsAt?: number;
    currentRound: number;
    checkedCount: number;
    uiState: "idle" | "waiting" | "ready" | "done";
  }) => void;
  onComplete: (payload: { checkedCount: number; routineCompleted: boolean }) => void;
}

const MissionRoutineWidget = ({
  totalRounds,
  intervalMinutes,
  completed = false,
  startedAt,
  endsAt,
  currentRound = 0,
  uiState = "idle",
  onStateChange,
  onComplete,
}: MissionRoutineWidgetProps) => {
  const [state, setState] = useState<"idle" | "waiting" | "ready" | "done">(() => {
    if (completed) return "done";
    if (uiState === "waiting" && endsAt && endsAt > Date.now()) return "waiting";
    if (uiState === "ready") return "ready";
    if (uiState === "done") return "done";
    return "idle";
  });

  const [round, setRound] = useState<number>(completed ? totalRounds : currentRound);

  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (completed) return 0;
    if (uiState === "waiting" && endsAt) {
      return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }
    return intervalMinutes * 60;
  });

  const completeCalledRef = useRef(completed);
  const readySyncedRef = useRef(false);

  useEffect(() => {
    if (completed) {
      setState("done");
      setRound(totalRounds);
      setSecondsLeft(0);
      completeCalledRef.current = true;
      readySyncedRef.current = false;
      return;
    }

    setRound(currentRound);

    if (uiState === "waiting" && endsAt) {
      const remain = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

      if (remain <= 0) {
        setState("ready");
        setSecondsLeft(0);
      } else {
        setState("waiting");
        setSecondsLeft(remain);
      }

      completeCalledRef.current = false;
      readySyncedRef.current = false;
      return;
    }

    if (uiState === "ready") {
      setState("ready");
      setSecondsLeft(0);
      completeCalledRef.current = false;
      readySyncedRef.current = true;
      return;
    }

    if (uiState === "done") {
      setState("done");
      setSecondsLeft(0);
      completeCalledRef.current = true;
      readySyncedRef.current = false;
      return;
    }

    setState("idle");
    setSecondsLeft(intervalMinutes * 60);
    completeCalledRef.current = false;
    readySyncedRef.current = false;
  }, [completed, currentRound, endsAt, intervalMinutes, totalRounds, uiState]);

  useEffect(() => {
    if (state !== "waiting" || !endsAt) return;

    const id = setInterval(() => {
      const remain = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(remain);

      if (remain <= 0) {
        setState("ready");
      }
    }, 1000);

    return () => clearInterval(id);
  }, [state, endsAt]);

  useEffect(() => {
    if (state === "ready" && !readySyncedRef.current) {
      readySyncedRef.current = true;
      onStateChange({
        startedAt,
        endsAt,
        currentRound: round,
        checkedCount: round,
        uiState: "ready",
      });
    }
  }, [state, startedAt, endsAt, round, onStateChange]);

  useEffect(() => {
    if (state === "done" && !completeCalledRef.current) {
      completeCalledRef.current = true;
      onComplete({
        checkedCount: totalRounds,
        routineCompleted: true,
      });
    }
  }, [state, totalRounds, onComplete]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const totalSeconds = Math.max(intervalMinutes * 60, 1);
  const progress = 1 - secondsLeft / totalSeconds;

  if (state === "idle") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const now = Date.now();
          const nextEndsAt = now + intervalMinutes * 60 * 1000;

          setSecondsLeft(intervalMinutes * 60);
          setState("waiting");
          setRound(currentRound);
          completeCalledRef.current = false;
          readySyncedRef.current = false;

          onStateChange({
            startedAt: now,
            endsAt: nextEndsAt,
            currentRound,
            checkedCount: currentRound,
            uiState: "waiting",
          });
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[11px] font-semibold"
      >
        <Play className="w-3 h-3" />
        시작
      </motion.button>
    );
  }

  if (state === "waiting") {
    return (
      <div className="space-y-1 mt-1">
        <div className="flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="text-xs font-mono text-violet-300">{fmt(secondsLeft)}</span>
          <span className="text-[10px] text-white/40">
            ({round}/{totalRounds}회)
          </span>
        </div>

        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const nextRound = round + 1;
          setRound(nextRound);

          if (nextRound >= totalRounds) {
            setState("done");
            return;
          }

          const now = Date.now();
          const nextEndsAt = now + intervalMinutes * 60 * 1000;

          setSecondsLeft(intervalMinutes * 60);
          setState("waiting");
          readySyncedRef.current = false;

          onStateChange({
            startedAt: now,
            endsAt: nextEndsAt,
            currentRound: nextRound,
            checkedCount: nextRound,
            uiState: "waiting",
          });
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold animate-pulse"
      >
        <Droplets className="w-3 h-3" />
        체크 완료 ({round + 1}/{totalRounds})
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
      <CheckCircle2 className="w-3 h-3" />
      완료됨
    </div>
  );
};

export default MissionRoutineWidget;