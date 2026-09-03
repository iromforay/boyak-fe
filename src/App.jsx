import { useState } from "react";
import Header from "./components/Header";
import SearchScreen from "./components/SearchScreen";
import PhotoFlow from "./components/PhotoFlow";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("photo"); // photo | search
  // PhotoFlow에 key로 넘겨서, 로고 클릭 시 값을 바꿔 컴포넌트를 통째로
  // 리마운트한다 - 진행 중이던 등록/판독/결과 상태를 전부 초기화하는
  // 가장 간단한 방법(내부 state를 일일이 끌어올릴 필요가 없다).
  const [homeKey, setHomeKey] = useState(0);

  function goHome() {
    setMode("photo");
    setHomeKey((k) => k + 1);
  }

  return (
    <div className="app">
      <Header mode={mode} onModeChange={setMode} onLogoClick={goHome} />
      {mode === "search" ? <SearchScreen /> : <PhotoFlow key={homeKey} />}
      <div className="legal-footer">
        <p>
          <a href="/terms.html">이용약관</a>
          <span aria-hidden="true">·</span>
          <a href="/privacy.html">개인정보처리방침</a>
        </p>
        <p>이롬 · 대표 나병연 · 사업자등록번호 257-38-01646</p>
        <p className="disclaimer">
          인식 결과는 참고용이며 의료 전문가의 진단을 대체하지 않습니다. 실제 복용 여부는 반드시 약사·의사와
          상담하세요.
        </p>
      </div>
    </div>
  );
}
