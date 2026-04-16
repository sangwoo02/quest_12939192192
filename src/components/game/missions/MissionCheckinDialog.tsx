/**
 * 📝 컨디션 기록 다이얼로그 (C1_HEALTH_CHECKIN)
 * 연필 아이콘 → 팝업 → minLength 이상 작성 → 완료
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
  onComplete: (text: string) => void;
  completed?: boolean;
  minLength?: number;
  title?: string;
}

const MissionCheckinDialog = ({
  onComplete,
  completed,
  minLength = 15,
  title = "컨디션 기록",
}: MissionCheckinDialogProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const requiredLength = Math.max(minLength, 1);
  const trimmed = text.trim();

  const lineCount = trimmed
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const hasMultiLine = lineCount >= 2;
  const hasLongSingleLine = trimmed.length >= requiredLength + 10;

  // 완성형 한글 / 자모 비율
  const hangulSyllables = (trimmed.match(/[가-힣]/g) || []).length;
  const jamoChars = (trimmed.match(/[ㄱ-ㅎㅏ-ㅣ]/g) || []).length;
  const totalKoreanChars = hangulSyllables + jamoChars;

  const hangulRatio =
    totalKoreanChars > 0 ? hangulSyllables / totalKoreanChars : 0;

  const koreanTextOk = hangulSyllables >= 8 && hangulRatio >= 0.7;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const hasSpaceOk = trimmed.includes(" ");
  const wordCountOk = words.length >= 2;

  const isValid =
    trimmed.length >= requiredLength &&
    koreanTextOk &&
    hasSpaceOk &&
    wordCountOk;

  if (completed) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        기록완료
      </div>
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
            <DialogTitle className="text-white text-base">{title}</DialogTitle>
          </DialogHeader>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`예시) - 오늘 가장 많이 움직인 활동: 산책 30분
         - 몸 상태: 조금 피곤했지만 가벼웠음
         - 2문장 이상으로 기록 (${requiredLength}자 이상)`}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px] resize-none"
          />

          <p
            className={`text-[10px] text-right ${
              isValid ? "text-emerald-400" : "text-white/30"
            }`}
          >
            {trimmed.length}/{requiredLength}자 · 완성형 한글 {hangulSyllables}자
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
              disabled={!isValid}
              onClick={() => {
                setOpen(false);
                onComplete(text.trim());
                setText("");
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