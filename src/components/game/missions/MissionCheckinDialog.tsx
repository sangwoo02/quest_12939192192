/**
 * 📝 컨디션 기록 다이얼로그 (C1_HEALTH_CHECKIN)
 * 연필 아이콘 → 팝업 → 15자 이상 작성 → 완료
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
interface MissionCheckinDialogProps {
  onComplete: () => void;
  completed?: boolean;
}
const MissionCheckinDialog = ({ onComplete, completed }: MissionCheckinDialogProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (completed) {
    return (
      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        기록 완료
      </span>
    );
  }
  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[11px] font-semibold"
      >
        <PenLine className="w-3 h-3" />
        기록하기
      </motion.button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-base">컨디션 기록</DialogTitle>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="컨디션을 자유롭게 기록해보세요 (15자 이상)"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px] resize-none"
          />
          <p className={`text-[10px] text-right ${text.length >= 15 ? "text-emerald-400" : "text-white/30"}`}>
            {text.length}/15자 이상
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
            >
              취소
            </Button>
            <Button
              disabled={text.length < 15}
              onClick={() => {
                setOpen(false);
                onComplete();
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30"
            >
              완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default MissionCheckinDialog;