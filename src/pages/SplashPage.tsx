import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Logo from "@/assets/logo.png";
import { useAppStore } from "@/stores/appStore";

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const AUTO_LOGIN_KEY = "auto_login_checked";

const SplashPage = () => {
  const navigate = useNavigate();

  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const setManualData = useAppStore((state) => state.setManualData);
  const setInBodyData = useAppStore((state) => state.setInBodyData);
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const user = useAppStore((state) => state.user);

  const [loadingText, setLoadingText] = useState("앱 시작 중");
  const [progress, setProgress] = useState(0);

  const pendingRef = useRef(new Map<string, (msg: any) => void>());

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const rnRequest = (type: string, payload: any) => {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return new Promise<any>((resolve, reject) => {
      pendingRef.current.set(requestId, (msg) => {
        if (msg.ok) resolve(msg.data);
        else reject(new Error(msg.error || "Unknown error"));
      });

      if ((window as any).ReactNativeWebView?.postMessage) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type, requestId, payload })
        );
        return;
      }

      reject(new Error("ReactNativeWebView 연결이 없습니다. 앱(WebView)에서 실행해주세요."));
    });
  };

  useEffect(() => {
    const handler = (event: any) => {
      try {
        const raw = event?.data;
        const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
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

    window.addEventListener("message", handler);
    document.addEventListener("message", handler as any);

    return () => {
      window.removeEventListener("message", handler);
      document.removeEventListener("message", handler as any);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        if (!mounted) return;

        setLoadingText("자동로그인 설정 확인 중");
        setProgress(15);
        await wait(250);

        const autoLoginEnabled = localStorage.getItem(AUTO_LOGIN_KEY) === "true";
        const token = localStorage.getItem("access_token");

        if (!autoLoginEnabled) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("auth_token");

          if (mounted) {
            setLoadingText("로그인 화면으로 이동 중");
            setProgress(100);
            await wait(250);
            navigate("/auth", { replace: true });
          }
          return;
        }

        if (!token || isTokenExpired(token)) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("auth_token");

          logout();

          if (mounted) {
            setLoadingText("로그인 화면으로 이동 중");
            setProgress(100);
            await wait(250);
            navigate("/auth", { replace: true });
          }
          return;
        }

        setLoadingText("저장된 로그인 정보 확인 중");
        setProgress(35);
        await wait(250);

        if (!token || !user) {
          if (mounted) {
            logout();
            setLoadingText("로그인 화면으로 이동 중");
            setProgress(100);
            await wait(250);
            navigate("/auth", { replace: true });
          }
          return;
        }

        setLoadingText("서버 데이터 조회 중");
        setProgress(60);
        await wait(250);

        const latest = await rnRequest("HEALTHCARE_LATEST_FAST_REQUEST", { token });

        if (!mounted) return;

        setLoadingText("사용자 상태 복원 중");
        setProgress(85);
        await wait(250);

        // user는 persist로 복원된 값을 재사용
        if (!useAppStore.getState().isLoggedIn) {
          login(user, true, token);
        }

        if (latest?.inbody) {
          const r = latest.inbody;

          if (r.source === "healthconnect") {
            setInBodyData({
              id: String(r.id ?? "latest"),
              userId: String(r.user_id ?? user.id),
              syncedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
              name: r.name || user.nickname || "사용자",
              age: typeof r.age === "number" ? r.age : 25,
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
            setManualData({
              name: r.name || user.nickname || "사용자",
              age: typeof r.age === "number" ? r.age : 25,
              gender: r.gender || "male",
              height: Number(r.height || 0),
              weight: Number(r.weight || 0),
              body_fat: Number(r.body_fat || 0),
              muscle_mass: Number(r.muscle_mass || 0),
              goal: r.goal || "건강 유지",
            });
          }

          setOnboardingComplete(true);

          setLoadingText("메인 화면으로 이동 중");
          setProgress(100);
          await wait(250);
          navigate("/main", { replace: true });
          return;
        }

        setOnboardingComplete(false);

        setLoadingText("초기 설정 화면으로 이동 중");
        setProgress(100);
        await wait(250);
        navigate("/onboarding", { replace: true });
      } catch (error) {
        console.error("Splash initialize error:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("auth_token");

        logout();

        if (mounted) {
          setLoadingText("로그인 화면으로 이동 중");
          setProgress(100);
          await wait(250);
          navigate("/auth", { replace: true });
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, [navigate, login, logout, setManualData, setInBodyData, setOnboardingComplete, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-40 left-6 w-24 h-24 rounded-full bg-accent/20 blur-xl"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-60 right-10 w-20 h-20 rounded-full bg-white/15 blur-lg"
        />
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-12 w-16 h-16 rounded-full bg-warning/20 blur-lg"
        />

        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-32 right-16"
        >
          <Sparkles className="w-8 h-8 text-white/40" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
          className="absolute top-56 left-12"
        >
          <Sparkles className="w-5 h-5 text-white/30" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
          className="absolute top-72 right-24"
        >
          <Sparkles className="w-6 h-6 text-accent/50" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 1.2 }}
          className="absolute bottom-80 left-20"
        >
          <Sparkles className="w-4 h-4 text-white/25" />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.8
          }}
          className="mb-6 relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-3xl bg-white/30 blur-xl"
          />

          <div className="relative w-40 h-40 flex items-center justify-center">
            <motion.img
              src={Logo}
              alt="logo"
              className="w-36 h-36 object-contain drop-shadow-2xl"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-3"
        >
          <h1 className="text-5xl font-black text-white tracking-tight">
            <span className="bg-gradient-to-r from-blue-200 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
              업!
            </span>{" "}
            바디
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/80 text-lg mb-16"
        >
          게임과 함께 레벨업하는 나의 몸
        </motion.p>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.7 }}
          className="w-56"
        >
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.35 }}
              className="h-full bg-white rounded-full relative"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
            </motion.div>
          </div>

          <p className="text-sm text-white/70 text-center mt-4">
            {loadingText}
          </p>
          <p className="text-xs text-white/50 text-center mt-1">
            {Math.min(progress, 100)}%
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 flex flex-col items-center gap-1 z-10"
      >
        <p className="text-sm text-white/50">v1.0.0</p>
      </motion.div>
    </div>
  );
};

export default SplashPage;