// 모양/색상처럼 "텍스트 용어보다 이미지로 보고 고르는 게 낫다"는 항목에
// 공통으로 쓰는 그리드 선택 모달. 아이콘/스와치 렌더링만 renderIcon으로
// 갈아끼우고, 레이아웃과 동작(선택 시 즉시 반영+닫기)은 항상 동일하게
// 유지해서 모양 선택창과 색상 선택창이 서로 다르게 보이지 않게 한다.
export default function OptionPicker({ title, options, value, onChange, onClose, renderIcon }) {
  return (
    <div className="option-picker-backdrop" onClick={onClose}>
      <div className="option-picker" onClick={(e) => e.stopPropagation()}>
        <p className="option-picker-title">{title}</p>
        <div className="option-grid">
          {options.map(([code, label]) => (
            <button
              key={code}
              type="button"
              className={`option-item ${value === code ? "selected" : ""}`}
              onClick={() => {
                onChange(code, label);
                onClose();
              }}
            >
              {renderIcon(code)}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="option-picker-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
