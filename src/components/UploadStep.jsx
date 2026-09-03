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

// 폰 카메라 원본은 3~4MB급 고해상도가 그대로 올라와 서버 FastSAM 세그멘테이션
// 시간을 늘린다 - 알약처럼 작은 피사체 인식엔 이 정도 해상도면 충분해서,
// 업로드 전에 브라우저에서 긴 변 기준으로 미리 줄이고 JPEG로 압축한다.
const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 0.85;

async function resizeImageFile(file) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    if (scale >= 1) {
      bitmap.close?.();
      return file; // 이미 충분히 작음 - 리사이즈 불필요
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file; // 리사이즈 실패해도 원본으로 업로드는 계속 진행한다
  }
}

export default function UploadStep({ loading, fileName, onFileChange, onSubmit }) {
  const [toast, setToast] = useState("");
  const [optimizing, setOptimizing] = useState(false);
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

  // 갤러리 선택/카메라 촬영 둘 다 이 input의 change로 들어온다 - 리사이즈된
  // 파일로 input.files를 다시 채워서, 제출 시점에 폼이 읽는 파일이 압축본이
  // 되도록 한다(handleUpload는 여전히 elements.image.files[0]만 읽음).
  async function handleFileChange(e) {
    const original = e.target.files[0];
    if (!original) {
      onFileChange("");
      return;
    }
    setOptimizing(true);
    try {
      const resized = await resizeImageFile(original);
      if (resized !== original && fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(resized);
        fileInputRef.current.files = dt.files;
      }
      onFileChange(resized.name);
    } finally {
      setOptimizing(false);
    }
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
        <input ref={fileInputRef} type="file" id="image" name="image" accept="image/*" onChange={handleFileChange} />
        {optimizing && <span className="file-picker-name">이미지 최적화 중...</span>}
        {!optimizing && fileName && <span className="file-picker-name">{fileName}</span>}
      </div>
      <div className="submit-wrap">
        {toast && <span className="toast">{toast}</span>}
        <button type="submit" className={!fileName ? "is-disabled" : ""} disabled={loading || optimizing}>
          {loading ? "분석 중..." : optimizing ? "이미지 최적화 중..." : "분석 시작"}
        </button>
      </div>
    </form>
  );
}
