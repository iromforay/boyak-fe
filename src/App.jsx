import { useEffect, useState } from "react";
import Header from "./components/Header";
import SearchScreen from "./components/SearchScreen";
import PhotoFlow from "./components/PhotoFlow";
import SignupModal from "./components/SignupModal";
import SettingsMenu from "./components/SettingsMenu";
import Footer from "./components/Footer";
import TutorialOverlay from "./components/TutorialOverlay";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { useUser } from "./useUser";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("photo"); // photo | search
  // PhotoFlow에 key로 넘겨서, 로고 클릭 시 값을 바꿔 컴포넌트를 통째로
  // 리마운트한다 - 진행 중이던 등록/판독/결과 상태를 전부 초기화하는
  // 가장 간단한 방법(내부 state를 일일이 끌어올릴 필요가 없다).
  const [homeKey, setHomeKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const { user, needsSignup, completeSignup, markTutorial } = useUser();

  // "최초 진입 시점에 튜토리얼을 띄울지"는 여기 한 곳(App)에서만 판단한다.
  // 실제 하이라이트는 TutorialOverlay가 각 화면의 실제 버튼을 찾아가서 보여준다.
  useEffect(() => {
    if (user && !user.tutorial_completed) {
      setTutorialActive(true);
      setTutorialStep(0);
    }
  }, [user]);

  function goHome() {
    setMode("photo");
    setHomeKey((k) => k + 1);
  }

  function finishTutorial() {
    setTutorialActive(false);
    markTutorial(true);
  }

  function nextTutorialStep() {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
      finishTutorial();
    } else {
      setTutorialStep((i) => i + 1);
    }
  }

  function replayTutorial() {
    setMenuOpen(false);
    setTutorialStep(0);
    setTutorialActive(true);
    markTutorial(false);
  }

  return (
    <div className="app">
      <Header mode={mode} onModeChange={setMode} onLogoClick={goHome} onMenuClick={() => setMenuOpen((v) => !v)} />
      <p className="disclaimer">
        ⚠ 인식 결과는 참고용이며 의료 전문가의 진단을 대체하지 않습니다. 실제 복용 여부는 반드시 약사·의사와
        상담하세요.
      </p>
      {menuOpen && (
        <SettingsMenu
          userName={user?.name}
          tutorialActive={tutorialActive}
          onReplayTutorial={replayTutorial}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {needsSignup && <SignupModal onSubmit={completeSignup} />}
      {mode === "search" ? <SearchScreen /> : <PhotoFlow key={homeKey} />}
      {tutorialActive && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          stepIndex={tutorialStep}
          onStepChange={setTutorialStep}
          onNext={nextTutorialStep}
          onSkip={finishTutorial}
        />
      )}
      <Footer />
    </div>
  );
}
