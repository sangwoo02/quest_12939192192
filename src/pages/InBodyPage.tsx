import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Home,
  Scale,
  Ruler,
  Heart,
  Droplets,
  Flame,
  Footprints,
  Activity,
  Target,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

/** ✅ 나이 계산 함수 (AuthPage/OnboardingPage와 동일 로직) */
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  comparison?: {
    avgMin: number;
    avgMax: number;
    userValue: number;
  };
  icon: React.ElementType;
  delay?: number;
  showStatus?: boolean;
}

const MetricCard = ({
  label,
  value,
  unit,
  status = 'neutral',
  comparison,
  icon: Icon,
  delay = 0,
  showStatus = true,
}: MetricCardProps) => {
  const statusColors = {
    good: 'text-success',
    warning: 'text-warning',
    bad: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const statusLabels = {
    good: '정상',
    warning: '주의',
    bad: '위험',
    neutral: '-',
  };

  const getComparisonIcon = () => {
    if (!comparison) return null;
    const { avgMin, avgMax, userValue } = comparison;

    if (userValue < avgMin) return <TrendingDown className="w-4 h-4 text-warning" />;
    if (userValue > avgMax) return <TrendingUp className="w-4 h-4 text-warning" />;
    return <Minus className="w-4 h-4 text-success" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl p-4 card-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-info/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {showStatus && status !== 'neutral' && (
          <div className={`flex items-center gap-1 ${statusColors[status]}`}>
            {getComparisonIcon()}
            <span className="text-xs font-medium">{statusLabels[status]}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{label}</p>

      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>

      {comparison && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            평균: {comparison.avgMin} - {comparison.avgMax} {unit}
          </p>
          <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden relative">
            <div
              className="absolute h-full bg-success/30 rounded-full"
              style={{
                left: `${(comparison.avgMin / (comparison.avgMax * 1.5)) * 100}%`,
                width: `${((comparison.avgMax - comparison.avgMin) / (comparison.avgMax * 1.5)) * 100}%`,
              }}
            />
            <motion.div
              initial={{ left: 0 }}
              animate={{
                left: `${Math.min((comparison.userValue / (comparison.avgMax * 1.5)) * 100, 100)}%`,
              }}
              transition={{ delay: delay + 0.3, duration: 0.5 }}
              className="absolute w-2.5 h-2.5 -top-0.5 rounded-full gradient-primary border-2 border-card"
              style={{ transform: 'translateX(-50%)' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface DisabledActivityCardProps {
  label: string;
  icon: React.ElementType;
  delay?: number;
}

const DisabledActivityCard = ({ label, icon: Icon, delay = 0 }: DisabledActivityCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-muted/50 rounded-2xl p-4 relative overflow-hidden"
  >
    <div className="flex items-center gap-3 opacity-50">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-muted-foreground">데이터 없음</p>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-xs">삼성 헬스 연동 필요</span>
      </div>
    </div>
  </motion.div>
);

interface WeightGoalCardProps {
  currentWeight: number;
  height: number;
  targetWeight: number | null;
  onSetTarget: (weight: number) => void | Promise<void>;
  disabled?: boolean;
  averageWeightRange?: {
    min: number;
    max: number;
    avg: number;
  };
  averageReady?: boolean;
}

const WeightGoalCard = ({
  currentWeight,
  height,
  targetWeight,
  onSetTarget,
  disabled = false,
  averageWeightRange,
  averageReady = false,
}: WeightGoalCardProps) => {
  const [inputValue, setInputValue] = useState(targetWeight?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);

  const heightM = height / 100;
  const bmiMinWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const bmiMaxWeight = Math.round(24.9 * heightM * heightM * 10) / 10;

  // ✅ 공공데이터 평균 몸무게 범위가 있으면 우선 사용
  const minNormalWeight =
    averageWeightRange && Number.isFinite(averageWeightRange.min) && averageWeightRange.min > 0
      ? averageWeightRange.min
      : 0;

  const maxNormalWeight =
    averageWeightRange && Number.isFinite(averageWeightRange.max) && averageWeightRange.max > 0
      ? averageWeightRange.max
      : -100;

  const recommendedWeight =
    averageWeightRange && Number.isFinite(averageWeightRange.avg) && averageWeightRange.avg > 0
      ? averageWeightRange.avg
      : null;

  const handleSave = async () => {
    const weight = parseFloat(inputValue);

    if (!Number.isFinite(weight)) {
      toast.error('올바른 목표 체중을 입력해주세요.');
      return;
    }

    if (weight >= minNormalWeight && weight <= maxNormalWeight) {
      await onSetTarget(weight);
      setIsEditing(false);
      toast.success('목표 체중이 설정되었습니다!');
    } else {
      toast.error(`정상 범위(${minNormalWeight}~${maxNormalWeight}kg) 내에서 설정해주세요.`);
    }
  };

  const handleSetRecommended = () => {
    if (recommendedWeight !== null) {
      setInputValue(String(recommendedWeight));
    }
  };

  const weightDiff = targetWeight ? Math.abs(currentWeight - targetWeight) : 0;
  const isLosing = targetWeight ? currentWeight > targetWeight : false;
  const progressPercent = targetWeight
    ? Math.min(Math.max(((currentWeight - minNormalWeight) / (maxNormalWeight - minNormalWeight)) * 100, 0), 100)
    : 0;
  const targetPercent = targetWeight
    ? Math.min(Math.max(((targetWeight - minNormalWeight) / (maxNormalWeight - minNormalWeight)) * 100, 0), 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl p-5 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-info/15 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">목표 체중</p>
            {targetWeight ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{targetWeight}</span>
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">미설정</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {disabled && targetWeight && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">미션 진행중</span>
            </div>
          )}

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={disabled || !averageReady}
              className="text-xs text-primary border-primary/30 hover:bg-primary/5 disabled:opacity-50"
            >
              {targetWeight ? '수정' : '설정하기'}
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3 mt-1">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="목표 체중 입력"
              className="h-11 text-base"
              step="0.1"
              min={minNormalWeight}
              max={maxNormalWeight}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">kg</span>
          </div>

          {recommendedWeight !== null && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSetRecommended}
                className="h-9"
              >
                평균 체중 적용 ({recommendedWeight}kg)
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            공공데이터 기준 정상 범위:
            <span className="font-medium text-foreground"> {minNormalWeight} ~ {maxNormalWeight} kg</span>
          </p>

          <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
            <p className="text-xs text-warning flex items-start gap-2">
              <span className="text-base mt-[-2px]">⚠️</span>
              <span>AI 미션을 생성하면 목표 체중을 수정할 수 없습니다. 신중하게 설정해주세요.</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setInputValue(targetWeight?.toString() || '');
              }}
              className="flex-1 h-10"
            >
              취소
            </Button>
            <Button size="sm" onClick={handleSave} className="flex-1 h-10 gradient-primary text-primary-foreground">
              저장
            </Button>
          </div>
        </div>
      )}

      {!isEditing && targetWeight && (
        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">현재 체중 → 목표</span>
            <span className={`text-sm font-bold ${isLosing ? 'text-warning' : 'text-success'}`}>
              {isLosing ? '−' : '+'}{weightDiff.toFixed(1)} kg
            </span>
          </div>

          <div className="relative">
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-[-3px] w-0.5 h-[18px] bg-foreground/60 rounded-full"
              style={{ left: `${targetPercent}%`, transform: 'translateX(-50%)' }}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">{minNormalWeight}kg</span>
              <span className="text-[10px] text-muted-foreground">{maxNormalWeight}kg</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const InBodyPage = () => {
  const navigate = useNavigate();

  /** ✅ 여기서 user / setInBodyData 꺼내야 함 */
  const {
    user,
    setInBodyData,
    inBodyData,
    manualData,
    setManualData,
    hasInBodyData,
    hasInBodySynced,
    targetWeight,
    setTargetWeight,
    hasMissionsGenerated,
  } = useAppStore();

  /** ✅ RN 브릿지 요청 도우미 (InBodyPage 범위에서 1번만) */
  const pendingRef = useRef(new Map<string, (msg: any) => void>());

  const rnRequest = (type: string, payload: any) => {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return new Promise<any>((resolve, reject) => {
      pendingRef.current.set(requestId, (msg) => {
        if (msg.ok) resolve(msg.data);
        else reject(new Error(msg.error || 'Unknown error'));
      });

      if ((window as any).ReactNativeWebView?.postMessage) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type, requestId, payload })
        );
        return;
      }

      reject(new Error('ReactNativeWebView 연결이 없습니다.'));
    });
  };

  /** ✅ RN(WebView) -> React 메시지 수신 (InBodyPage에서 1번만) */
  useEffect(() => {
    const handler = (event: any) => {
      try {
        const raw = event?.data;
        const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const requestId = msg?.requestId;
        if (!requestId) return;

        const resolver = pendingRef.current.get(requestId);
        if (!resolver) return;

        pendingRef.current.delete(requestId);
        resolver(msg);
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handler as any);
    document.addEventListener('message', handler as any);

    return () => {
      window.removeEventListener('message', handler as any);
      document.removeEventListener('message', handler as any);
    };
  }, []);

  const applyFastData = useCallback((latest: any) => {
    if (latest?.inbody) {
      const r = latest.inbody;

      if (r.source === "manual") {
        setManualData({
          name: r.name || user?.nickname || "사용자",
          age:
            typeof r.age === "number"
              ? r.age
              : user?.birthDate
              ? calculateAge(user.birthDate)
              : 25,
          gender: r.gender || "male",
          height: Number(r.height || 0),
          weight: Number(r.weight || 0),
          body_fat: Number(r.body_fat || 0),
          muscle_mass: Number(r.muscle_mass || 0),
          goal: r.goal || "건강 유지",
        });
      } else if (r.source === "healthconnect") {
        setInBodyData({
          id: String(r.id ?? "latest"),
          userId: String(r.user_id ?? "me"),
          syncedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
          name: r.name || user?.nickname || "사용자",
          age:
            typeof r.age === "number"
              ? r.age
              : user?.birthDate
              ? calculateAge(user.birthDate)
              : 25,
          gender: r.gender || "male",
          height: Number(r.height || 0),
          weight: Number(r.weight || 0),
          body_fat: Number(r.body_fat || 0),
          muscle_mass: Number(r.muscle_mass || 0),
          goal: r.goal || "건강 유지",
          bmi: Number(r.bmi || 0),
          bmr: Number(r.bmr || 0),
        } as any);
      } else {
        console.warn("Unknown source in latest-fast, fallback manual:", r);

        setManualData({
          name: r.name || user?.nickname || "사용자",
          age:
            typeof r.age === "number"
              ? r.age
              : user?.birthDate
              ? calculateAge(user.birthDate)
              : 25,
          gender: r.gender || "male",
          height: Number(r.height || 0),
          weight: Number(r.weight || 0),
          body_fat: Number(r.body_fat || 0),
          muscle_mass: Number(r.muscle_mass || 0),
          goal: r.goal || "건강 유지",
        });
      }

      if (typeof r.target_weight === "number" && r.target_weight > 0) {
        setTargetWeight(Number(r.target_weight));
      }
    }

    if (latest?.activity) {
      const act = latest.activity;

      setActivityData({
        steps: typeof act.steps === "number" ? act.steps : Number(act.steps || 0),
        calories:
          typeof act.calories === "number"
            ? act.calories
            : Number(act.calories || 0),
      });
    } else {
      setActivityData(null);
    }

    // ✅ 활동 데이터가 있을 때만 활성화
    setHasFastData(Boolean(latest?.activity));
  }, [setInBodyData, setManualData, setTargetWeight, user]);


  const saveTargetWeight = useCallback(async (weight: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    await rnRequest("HEALTHCARE_TARGET_WEIGHT_SAVE_REQUEST", {
      token,
      targetWeight: weight,
    });

    setTargetWeight(weight);
  }, [setTargetWeight]);

  
  const applyAverageData = useCallback((avgResponse: any) => {
    const avg = avgResponse?.average;
    if (!avg) return;

    const avgHeight = Number(avg.avg_height);
    const avgWeight = Number(avg.avg_weight);
    const avgBodyFat = Number(avg.avg_body_fat);
    const avgBmi = Number(avg.avg_bmi);

    const range = (x: number, pct = 0.1) => ({
      min: +(x * (1 - pct)).toFixed(1),
      max: +(x * (1 + pct)).toFixed(1),
      avg: +x.toFixed(1),
    });

    setAverageData((prev) => ({
      ...prev,
      height: Number.isFinite(avgHeight) ? range(avgHeight, 0.03) : prev.height,
      weight: Number.isFinite(avgWeight) ? range(avgWeight, 0.10) : prev.weight,
      body_fat: Number.isFinite(avgBodyFat) ? range(avgBodyFat, 0.15) : prev.body_fat,
      bmi: Number.isFinite(avgBmi) ? range(avgBmi, 0.10) : prev.bmi,
    }));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsFastLoading(false);
      setIsAverageLoading(false);
      return;
    }

    let cancelled = false;

    const fetchFast = async () => {
      try {
        console.log("[InBodyPage] HEALTHCARE_LATEST_FAST_REQUEST start");
        const fast = await rnRequest("HEALTHCARE_LATEST_FAST_REQUEST", { token });
        if (cancelled) return;

        console.log("[InBodyPage] HEALTHCARE_LATEST_FAST_REQUEST done", fast);
        applyFastData(fast);
      } catch (err) {
        console.warn("HEALTHCARE_LATEST_FAST_REQUEST failed:", err);
      } finally {
        if (!cancelled) setIsFastLoading(false);
      }
    };

    const fetchAverage = async () => {
      try {
        console.log("[InBodyPage] HEALTHCARE_AVERAGE_REQUEST start");
        const avg = await rnRequest("HEALTHCARE_AVERAGE_REQUEST", { token });
        if (cancelled) return;

        console.log("[InBodyPage] HEALTHCARE_AVERAGE_REQUEST done", avg);
        applyAverageData(avg);
      } catch (err) {
        console.warn("HEALTHCARE_AVERAGE_REQUEST failed:", err);
      } finally {
        if (!cancelled) setIsAverageLoading(false);
      }
    };

    fetchFast();
    fetchAverage();

    return () => {
      cancelled = true;
    };
  }, [applyFastData, applyAverageData]);

  // Mock average data for comparison
  const [averageData, setAverageData] = useState({
    height: { min: 170, max: 180, avg: 175 },
    weight: { min: 0, max: 0, avg: 0 },
    bmi: { min: 0, max: 0, avg: 0 },
    body_fat: { min: 0, max: 0, avg: 0 },
    muscle_mass: { min: 28, max: 38, avg: 33 },
    bmr: { min: 1500, max: 1800, avg: 1650 },
  });

  const userData =
    inBodyData ||
    (manualData
      ? {
          height: manualData.height ?? 0,
          weight: manualData.weight ?? 0,
          bmi:
            manualData.height && manualData.weight
              ? manualData.weight / ((manualData.height / 100) ** 2)
              : 0,
          body_fat: manualData.body_fat ?? 0,
          muscle_mass: manualData.muscle_mass ?? 0,
          bmr:
            manualData.gender === 'male'
              ? 88.362 +
                13.397 * (manualData.weight ?? 0) +
                4.799 * (manualData.height ?? 0) -
                5.677 * (manualData.age ?? 0)
              : 447.593 +
                9.247 * (manualData.weight ?? 0) +
                3.098 * (manualData.height ?? 0) -
                4.33 * (manualData.age ?? 0),
        }
      : null);

  const getStatus = (value: number, range: { min: number; max: number }): 'good' | 'warning' | 'bad' => {
    if (value >= range.min && value <= range.max) return 'good';
    if (value < range.min * 0.9 || value > range.max * 1.1) return 'bad';
    return 'warning';
  };

  const [activityData, setActivityData] = useState<{ steps?: number; calories?: number } | null>(null);
  const [isFastLoading, setIsFastLoading] = useState(true);
  const [isAverageLoading, setIsAverageLoading] = useState(true);
  const [hasFastData, setHasFastData] = useState(false);

  const averageWeightReady =
    Number.isFinite(averageData.weight.avg) && averageData.weight.avg > 0;

/*   useEffect(() => {
    if (
      !targetWeight &&
      averageData.weight.avg > 0 &&
      !hasMissionsGenerated
    ) {
      saveTargetWeight(averageData.weight.avg);
    }
  }, [targetWeight, averageData.weight.avg, hasMissionsGenerated, saveTargetWeight]); */

  if (!isFastLoading && !userData) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full">
          <div className="gradient-primary px-6 pt-safe-top pb-6">
            <h1 className="text-xl font-bold text-primary-foreground">신체 분석 데이터</h1>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-locked/20 flex items-center justify-center mb-4">
                <Scale className="w-10 h-10 text-locked" />
              </div>
              <h2 className="text-xl font-bold text-foreground">데이터가 없습니다</h2>
              <p className="text-muted-foreground mt-2">
                신체 정보를 입력하면<br />상세 분석을 확인할 수 있어요
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="mt-6 px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold"
              >
                정보 입력하기
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="gradient-primary px-6 pt-safe-top pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-foreground">신체 분석 데이터</h1>
          <button
            onClick={() => navigate('/main')}
            className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center"
          >
            <Home className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {inBodyData && (
          <p className="text-primary-foreground/70 text-sm mt-3">
            마지막 동기화: {new Date(inBodyData.syncedAt).toLocaleString('ko-KR', {
              timeZone: 'Asia/Seoul',
            })}
          </p>
        )}
      </div>

      <div className="px-6 py-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            활동
          </h2>

            {isFastLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="걸음 수"
                  value="..."
                  unit="걸음"
                  icon={Footprints}
                  delay={0.1}
                  showStatus={false}
                />
                <MetricCard
                  label="활동 칼로리"
                  value="..."
                  unit="kcal"
                  icon={Flame}
                  delay={0.15}
                  showStatus={false}
                />
              </div>
            ) : hasFastData ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="걸음 수"
                  value={(activityData?.steps ?? 0).toLocaleString('ko-KR')}
                  unit="걸음"
                  icon={Footprints}
                  delay={0.1}
                  showStatus={false}
                />
                <MetricCard
                  label="활동 칼로리"
                  value={Math.round(activityData?.calories ?? 0).toLocaleString('ko-KR')}
                  unit="kcal"
                  icon={Flame}
                  delay={0.15}
                  showStatus={false}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <DisabledActivityCard label="걸음 수" icon={Footprints} delay={0.1} />
                <DisabledActivityCard label="활동 칼로리" icon={Flame} delay={0.15} />
              </div>
            )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            신체 지표
          </h2>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="키" value={userData.height.toFixed(1)} unit="cm" icon={Ruler} delay={0.3} showStatus={false} />
              <MetricCard
                label="몸무게"
                value={userData.weight.toFixed(1)}
                unit="kg"
                status={getStatus(userData.weight, averageData.weight)}
                comparison={{
                  avgMin: averageData.weight.min,
                  avgMax: averageData.weight.max,
                  userValue: userData.weight,
                }}
                icon={Scale}
                delay={0.35}
              />
            </div>

            <WeightGoalCard
              currentWeight={userData.weight}
              height={userData.height}
              targetWeight={targetWeight}
              onSetTarget={saveTargetWeight}
              disabled={hasMissionsGenerated}
              averageWeightRange={averageData.weight}
              averageReady={averageWeightReady}
            />

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="BMI"
                value={userData.bmi.toFixed(1)}
                unit=""
                status={getStatus(userData.bmi, averageData.bmi)}
                comparison={{
                  avgMin: averageData.bmi.min,
                  avgMax: averageData.bmi.max,
                  userValue: userData.bmi,
                }}
                icon={Heart}
                delay={0.4}
              />
              <MetricCard
                label="체지방률"
                value={userData.body_fat.toFixed(1)}
                unit="%"
                status={getStatus(userData.body_fat, averageData.body_fat)}
                comparison={{
                  avgMin: averageData.body_fat.min,
                  avgMax: averageData.body_fat.max,
                  userValue: userData.body_fat,
                }}
                icon={Droplets}
                delay={0.45}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InBodyPage;
