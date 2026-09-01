import { useEffect, useRef, useState } from "react";

export default function UploadStep({ loading, fileName, onFileChange, onSubmit }) {
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

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

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>알약 사진 등록</h1>
      <p className="card-sub">알약이 잘 보이도록 찍은 사진을 올려주세요.</p>
      <div className="file-picker">
        <label className="file-picker-label" htmlFor="image">
          {fileName ? "다른 사진 선택" : "사진 선택"}
        </label>
        <input
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
