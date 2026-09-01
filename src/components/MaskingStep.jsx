export default function MaskingStep({ maskTargets, strokes, activeMaskId, setActiveMaskId, brushSize, setBrushSize, allMasked, loading, onBack, onSubmit }) {
  return (
    <>
      <p className="hint">목록에서 항목을 선택하고, 사진 위를 <b>드래그</b>해서 칠하세요.</p>
      <div className="toolbar">
        <span>브러시</span>
        <input type="range" min="8" max="60" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
      </div>
      <div className="list">
        {maskTargets.map((t) => {
          const painted = strokes.some((s) => s.forId === t.id);
          return (
            <div key={t.id} className={`row ${t.id === activeMaskId ? "flagged" : ""}`} onClick={() => setActiveMaskId(t.id)}>
              <span className="idx">{t.id}</span>
              <span className="name">{t.label}</span>
              <span className={`status ${painted ? "confirmed" : "flagged"}`}>{painted ? "칠함" : "칠하기 대기"}</span>
            </div>
          );
        })}
      </div>
      {!allMasked && <p className="progress-note">아직 안 칠한 항목이 있습니다.</p>}
      <footer>
        <button className="secondary" onClick={onBack}>이전</button>
        <button className="primary" disabled={!allMasked || loading} onClick={onSubmit}>
          {loading ? "처리 중..." : "교정 결과 제출"}
        </button>
      </footer>
    </>
  );
}
