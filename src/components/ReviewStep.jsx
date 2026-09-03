import { useState } from "react";

// pending -> confirmed -> flagged -> rejected -> confirmed -> ... (3단 순환)
// rejected("미대상")는 오검출(실제 알약이 아닌 영역)을 표시하는 용도 -
// confirmed/flagged와 달리 최종 결과 조회(submitAll)에서 완전히 제외된다.
function nextDecision(current) {
  if (current === "pending") return "confirmed";
  if (current === "confirmed") return "flagged";
  if (current === "flagged") return "rejected";
  return "confirmed";
}

// ML(모양/각인)이 서빙됐을 때만 0~1 값 - 규칙 기반 폴백이면 null이라 아예 안 보여준다
// (그 값이 "낮은 신뢰도"가 아니라 "신뢰도 자체가 없음"이라 구분해야 함).
function Confidence({ value }) {
  if (typeof value !== "number") return null;
  const pct = Math.round(value * 100);
  const level = value >= 0.9 ? "high" : value >= 0.7 ? "mid" : "low";
  return <span className={`confidence confidence-${level}`}>{pct}%</span>;
}

// DB의 drug_shape 코드값 <-> 한글 표시값 (app/services/pill_service.py의
// _SHAPE_LABELS와 동일하게 유지 - 교정 시 코드값을 그대로 서버에 보낸다).
const SHAPE_OPTIONS = [
  ["round", "원형"],
  ["oval", "타원형"],
  ["capsule", "캡슐형"],
  ["triangle", "삼각형"],
  ["square", "사각형"],
  ["diamond", "마름모형"],
  ["pentagon", "오각형"],
  ["hexagon", "육각형"],
  ["semicircle", "반원형"],
  ["oblong", "장방형"],
  ["octagon", "팔각형"],
  ["other", "기타"],
];

// DB의 color_class1 코드값 <-> 한글 표시값 (app/services/pill_service.py의
// _COLOR_LABELS와 동일하게 유지 - 교정 시 코드값을 그대로 서버에 보낸다).
const COLOR_OPTIONS = [
  ["white", "흰색"],
  ["ivory", "아이보리"],
  ["yellow", "노랑"],
  ["orange", "주황"],
  ["pink", "분홍"],
  ["red", "빨강"],
  ["brown", "갈색"],
  ["purple", "보라"],
  ["blue", "파랑"],
  ["green", "초록"],
  ["gray", "회색"],
  ["black", "검정"],
  ["clear", "투명"],
];

function ShapeEditor({ pill, onCorrect, onClose }) {
  return (
    <select
      autoFocus
      className="correct-select"
      defaultValue={pill.shape}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const code = e.target.value;
        const label = SHAPE_OPTIONS.find(([c]) => c === code)?.[1] || code;
        onCorrect(pill.id, "shape", code, label);
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

function ColorEditor({ pill, onCorrect, onClose }) {
  return (
    <select
      autoFocus
      className="correct-select"
      defaultValue={pill.color}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const code = e.target.value;
        const label = COLOR_OPTIONS.find(([c]) => c === code)?.[1] || code;
        onCorrect(pill.id, "color", code, label);
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

function ImprintEditor({ pill, onCorrect, onClose }) {
  const [value, setValue] = useState(pill.imprint || "");
  function submit() {
    onCorrect(pill.id, "imprint", value.trim());
    onClose();
  }
  return (
    <span className="correct-inline" onClick={(e) => e.stopPropagation()}>
      <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button type="button" onClick={submit}>
        확인
      </button>
    </span>
  );
}

export default function ReviewStep({ pills, decisions, setDecisions, addMissed, allDecided, hasMaskTargets, loading, onReset, onNext, onCorrect }) {
  const [editing, setEditing] = useState(null); // {id, field:"shape"|"color"|"imprint"} | null

  function cycle(id) {
    setDecisions((prev) => ({ ...prev, [id]: nextDecision(prev[id] || "pending") }));
  }

  function openEditor(e, id, field) {
    e.stopPropagation();
    setEditing({ id, field });
  }

  return (
    <>
      <p className="hint">
        각 항목을 눌러 <b>확인완료</b>, <b>마스킹 대상</b>, <b>미대상</b>(오검출) 중 하나로 표시하세요. 모양/색상/각인이 잘못
        나왔다면 <b>✎</b>로 직접 고칠 수 있습니다.
      </p>
      <div className="list">
        {pills.map((p) => {
          const state = decisions[p.id] || "pending";
          const editingShape = editing?.id === p.id && editing.field === "shape";
          const editingColor = editing?.id === p.id && editing.field === "color";
          const editingImprint = editing?.id === p.id && editing.field === "imprint";
          return (
            <div key={p.id} className={`row ${state}`} onClick={() => cycle(p.id)}>
              <span className="idx">알약 {p.id}</span>
              <span className="name-block">
                <span className="name">
                  {editingShape ? (
                    <ShapeEditor pill={p} onCorrect={onCorrect} onClose={() => setEditing(null)} />
                  ) : (
                    <>
                      {p.shape_label} <Confidence value={p.shape_confidence} />
                      <button className="edit-btn" onClick={(e) => openEditor(e, p.id, "shape")} title="모양 직접 고치기">
                        ✎
                      </button>
                    </>
                  )}
                  {" / "}
                  {editingColor ? (
                    <ColorEditor pill={p} onCorrect={onCorrect} onClose={() => setEditing(null)} />
                  ) : (
                    <>
                      {p.color_label}
                      <button className="edit-btn" onClick={(e) => openEditor(e, p.id, "color")} title="색상 직접 고치기">
                        ✎
                      </button>
                    </>
                  )}
                </span>
                {editingImprint ? (
                  <ImprintEditor pill={p} onCorrect={onCorrect} onClose={() => setEditing(null)} />
                ) : (
                  <span className="imprint">
                    각인 {p.imprint || "없음"} <Confidence value={p.imprint_confidence} />
                    <button className="edit-btn" onClick={(e) => openEditor(e, p.id, "imprint")} title="각인 직접 고치기">
                      ✎
                    </button>
                  </span>
                )}
              </span>
              <span className={`status ${state}`}>
                {state === "pending" ? "확인 대기" : state === "confirmed" ? "확인완료" : state === "flagged" ? "마스킹 대상" : "미대상"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="add-missed" onClick={addMissed}>
        + 놓친 알약 있음
      </div>
      {!allDecided && <p className="progress-note">아직 결정 안 된 항목이 있습니다.</p>}
      <footer>
        <button className="secondary" onClick={onReset}>
          처음부터
        </button>
        <button className="primary" disabled={!allDecided || loading} onClick={onNext}>
          {loading ? "처리 중..." : hasMaskTargets ? "마스킹하러 가기" : "약 찾기"}
        </button>
      </footer>
    </>
  );
}
