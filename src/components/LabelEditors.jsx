import { useState } from "react";
import ShapePicker from "./ShapePicker";
import ColorPicker from "./ColorPicker";

// 판독/결과 화면 공통 - 모양/색상/각인을 언제든 직접 고칠 수 있는 연필 버튼.
export function EditButton({ onClick, title, dataTutorial }) {
  return (
    <button
      className="edit-btn"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={title}
      data-tutorial={dataTutorial}
    >
      ✎
    </button>
  );
}

// 텍스트 드롭다운 대신 모양 실루엣 아이콘 그리드(ShapePicker)를 모달로 띄운다 -
// 호출부(ReviewStep/ResultStep)는 그대로 두고 내부 구현만 바꿨다.
export function ShapeSelect({ value, onChange, onClose }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <ShapePicker value={value} onChange={onChange} onClose={onClose} />
    </span>
  );
}

// 모양 선택과 통일감을 맞추기 위해 텍스트 드롭다운 대신 색상 스와치
// 그리드(ColorPicker)를 모달로 띄운다.
export function ColorSelect({ value, onChange, onClose }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <ColorPicker value={value} onChange={onChange} onClose={onClose} />
    </span>
  );
}

// 각인처럼 자유 텍스트인 값을 고칠 때 쓰는 인라인 입력 - 빈 각인 재검색
// (ImprintRetry)과 이미 있는 각인 교정 둘 다 이걸 재사용한다.
export function TextEditor({ value, placeholder, submitLabel = "확인", onSubmit, onClose }) {
  const [text, setText] = useState(value || "");
  function submit() {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    onClose();
  }
  return (
    <span className="correct-inline" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button type="button" disabled={!text.trim()} onClick={submit}>
        {submitLabel}
      </button>
    </span>
  );
}
