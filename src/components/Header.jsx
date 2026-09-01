export default function Header({ mode, onModeChange }) {
  return (
    <header>
      <span className="brand">보약 · 보이는 약</span>
      <div className="mode-switch">
        <button
          type="button"
          className={mode === "photo" ? "active" : ""}
          onClick={() => onModeChange("photo")}
        >
          사진으로 찾기
        </button>
        <button
          type="button"
          className={mode === "search" ? "active" : ""}
          onClick={() => onModeChange("search")}
        >
          이름으로 검색
        </button>
      </div>
    </header>
  );
}
