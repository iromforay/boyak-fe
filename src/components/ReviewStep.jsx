// pending -> confirmed -> flagged -> confirmed -> flagged ... (교차 토글)
function nextDecision(current) {
  if (current === "pending") return "confirmed";
  if (current === "confirmed") return "flagged";
  return "confirmed";
}

export default function ReviewStep({ pills, decisions, setDecisions, addMissed, allDecided, hasMaskTargets, loading, onReset, onNext }) {
  function cycle(id) {
    setDecisions((prev) => ({ ...prev, [id]: nextDecision(prev[id] || "pending") }));
  }

  return (
    <>
      <p className="hint">각 항목을 눌러 <b>확인완료</b> 또는 <b>마스킹 대상</b>으로 표시하세요.</p>
      <div className="list">
        {pills.map((p) => {
          const state = decisions[p.id] || "pending";
          return (
            <div key={p.id} className={`row ${state}`} onClick={() => cycle(p.id)}>
              <span className="idx">알약 {p.id}</span>
              <span className="name-block">
                <span className="name">{p.shape_label} / {p.color_label}</span>
                {p.imprint && <span className="imprint">각인 {p.imprint}</span>}
              </span>
              <span className={`status ${state}`}>
                {state === "pending" ? "확인 대기" : state === "confirmed" ? "확인완료" : "마스킹 대상"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="add-missed" onClick={addMissed}>+ 놓친 알약 있음</div>
      {!allDecided && <p className="progress-note">아직 결정 안 된 항목이 있습니다.</p>}
      <footer>
        <button className="secondary" onClick={onReset}>처음부터</button>
        <button className="primary" disabled={!allDecided || loading} onClick={onNext}>
          {loading ? "처리 중..." : hasMaskTargets ? "마스킹하러 가기" : "약 찾기"}
        </button>
      </footer>
    </>
  );
}
