/**
 * 🔄 루틴 체크 위젯 (B3_ROUTINE_CHECK)
 * 시작 → 인터벌 타이머 → 체크인 버튼 → 반복 → 완료
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Timer, Droplets } from "lucide-react";
interface MissionRoutineWidgetProps {
  totalRounds: number;
  intervalMinutes: number;
  onComplete: () => void;
}
const MissionRoutineWidget = ({ totalRounds, intervalMinutes, onComplete }: MissionRoutineWidgetProps) => {
  const [state, setState] = useState<"idle" | "waiting" | "ready" | "done">("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(intervalMinutes * 60);
  useEffect(() => {
    if (state !== "waiting" || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setState("ready");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, secondsLeft]);
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };
  const progress = 1 - secondsLeft / (intervalMinutes * 60);
  if (state === "idle") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setSecondsLeft(intervalMinutes * 60);
          setState("waiting");
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
          <span className="text-[10px] text-white/40">({currentRound}/{totalRounds}회)</span>
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
          const next = currentRound + 1;
          setCurrentRound(next);
          if (next >= totalRounds) {
            setState("done");
          } else {
            setSecondsLeft(intervalMinutes * 60);
            setState("waiting");
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold animate-pulse"
      >
        <Droplets className="w-3 h-3" />
        물 마셨어요! ({currentRound + 1}/{totalRounds})
      </motion.button>
    );
  }
  // done
  return (
    <motion.button
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onComplete}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold"
    >
      <CheckCircle2 className="w-3 h-3" />
      완료
    </motion.button>
  );
};
export default MissionRoutineWidget;