import { useEffect, useRef, useState } from "react";

// 앱(자체 웹뷰) 안에서 열렸을 때만 "사진 촬영" 버튼을 노출한다 - 일반 웹
// 브라우저에서는 갤러리 선택만 제공하고, 카메라 즉시 실행은 앱에서만
// 의미가 있어서(?app=1 파라미터로 앱이 자신을 표시) URL 파라미터로 판단한다.
function isAppMode() {
  try {
    const v = new URLSearchParams(window.location.search).get("app");
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

export default function UploadStep({ loading, fileName, onFileChange, onSubmit }) {
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const fileInputRef = useRef(null);
  const appMode = isAppMode();

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }

  function handleSubmit(e) {
    if (!fileName) {
      e.preventDefault();
      showToast("사진 등록 후 사용할 수 있어요.");
      return;
    }
    onSubmit(e);
  }

  // 같은 input을 갤러리/카메라 두 용도로 재사용한다(제출 로직이 name="image"
  // 하나만 읽으므로 input을 분리하지 않음) - capture 속성을 잠깐 붙였다가
  // 선택 창이 뜬 다음 바로 떼어내서, 다음 "사진 선택" 클릭은 다시 갤러리로 열리게 한다.
  function openCamera() {
    const el = fileInputRef.current;
    if (!el) return;
    el.setAttribute("capture", "environment");
    el.click();
    requestAnimationFrame(() => el.removeAttribute("capture"));
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>알약 사진 등록</h1>
      <p className="card-sub">알약이 잘 보이도록 찍은 사진을 올려주세요.</p>
      <div className="file-picker">
        <label className="file-picker-label" htmlFor="image">
          {fileName ? "다른 사진 선택" : "사진 선택"}
        </label>
        {appMode && (
          <button type="button" className="file-picker-label" onClick={openCamera}>
            사진 촬영
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files[0]?.name || "")}
        />
        {fileName && <span className="file-picker-name">{fileName}</span>}
      </div>
      <div className="submit-wrap">
        {toast && <span className="toast">{toast}</span>}
        <button type="submit" className={!fileName ? "is-disabled" : ""} disabled={loading}>
          {loading ? "분석 중..." : "분석 시작"}
        </button>
      </div>
    </form>
  );
}
