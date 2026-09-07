// 햄버거 메뉴 - 지금은 "튜토리얼 다시 보기" 하나뿐이지만, 로그인/회원
// 관련 설정이 늘어나면 이 안에 계속 추가될 자리.
export default function SettingsMenu({ userName, tutorialActive, onReplayTutorial, onClose }) {
  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-menu" onClick={(e) => e.stopPropagation()}>
        {userName && <p className="settings-user">{userName}님</p>}
        {tutorialActive ? (
          <p className="settings-hint">튜토리얼 진행 중이에요.</p>
        ) : (
          <button type="button" className="settings-item" onClick={onReplayTutorial}>
            튜토리얼 다시 보기
          </button>
        )}
      </div>
    </div>
  );
}
