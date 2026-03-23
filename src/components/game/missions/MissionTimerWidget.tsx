/**
 * ⏱️ 타이머 위젯 (B1_TIMER_STRETCH, B2_SLEEP_PREP)
 * 시작 → 카운트다운 → 완료 버튼
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Timer } from "lucide-react";
interface MissionTimerWidgetProps {
  minutes: number;
  label: string;
  onComplete: () => void;
}
const MissionTimerWidget = ({ minutes, label, onComplete }: MissionTimerWidgetProps) => {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  useEffect(() => {
    if (state !== "running" || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setState("done");
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
  const progress = 1 - secondsLeft / (minutes * 60);
  if (state === "idle") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setState("running")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[11px] font-semibold"
      >
        <Play className="w-3 h-3" />
        {label} 시작
      </motion.button>
    );
  }
  if (state === "running") {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Timer className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
        <span className="text-xs font-mono text-violet-300">{fmt(secondsLeft)}</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    );
  }
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
export default MissionTimerWidget;