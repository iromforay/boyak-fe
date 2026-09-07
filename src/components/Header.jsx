export default function Header({ mode, onModeChange, onLogoClick, onMenuClick }) {
  return (
    <header>
      <button type="button" className="brand" onClick={onLogoClick}>
        <img src="/favicon.svg" alt="" className="brand-logo" />
        보약 · 보이는 약
      </button>
      <div className="mode-switch" data-tutorial="mode-switch">
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
      <button type="button" className="hamburger-btn" onClick={onMenuClick} aria-label="메뉴">
        ☰
      </button>
    </header>
  );
}
