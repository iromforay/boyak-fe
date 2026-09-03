import { useState } from "react";
import { SHAPE_OPTIONS, COLOR_OPTIONS, labelFor } from "../labelOptions";

// 판독/결과 화면 공통 - 모양/색상/각인을 언제든 직접 고칠 수 있는 연필 버튼.
export function EditButton({ onClick, title }) {
  return (
    <button
      className="edit-btn"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={title}
    >
      ✎
    </button>
  );
}

export function ShapeSelect({ value, onChange, onClose }) {
  return (
    <select
      autoFocus
      className="correct-select"
      defaultValue={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const code = e.target.value;
        onChange(code, labelFor(SHAPE_OPTIONS, code));
        onClose();
      }}
      onBlur={onClose}
    >
      {SHAPE_OPTIONS.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function ColorSelect({ value, onChange, onClose }) {
  return (
    <select
      autoFocus
      className="correct-select"
      defaultValue={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const code = e.target.value;
        onChange(code, labelFor(COLOR_OPTIONS, code));
        onClose();
      }}
      onBlur={onClose}
    >
      {COLOR_OPTIONS.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
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
