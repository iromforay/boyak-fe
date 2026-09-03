import { useState } from "react";
import { imageUrl } from "../api";
import { EditButton, ShapeSelect, ColorSelect, TextEditor } from "./LabelEditors";

// 각인 인식이 실패한(빈 값) 결과에 한해 수동 입력 + 재검색 UI를 보여준다.
function ImprintRetry({ targetId, onCorrect }) {
  return (
    <div className="imprint-retry">
      <p className="hint">각인을 읽지 못했습니다. 알약에 새겨진 문자를 직접 입력해보세요.</p>
      <TextEditor
        value=""
        placeholder="예: V분할선8"
        submitLabel="다시 찾기"
        onSubmit={(text) => onCorrect(targetId, "imprint", text)}
        onClose={() => {}}
      />
    </div>
  );
}

export default function ResultStep({ results, loading, onCorrectResult, onConfirmDrug, onReset }) {
  const [confirmedMap, setConfirmedMap] = useState({});
  const [noMatchMap, setNoMatchMap] = useState({});
  const [editing, setEditing] = useState(null); // {targetId, field:"shape"|"color"|"imprint"} | null

  function handleConfirm(targetId, itemSeq) {
    setConfirmedMap((prev) => ({ ...prev, [targetId]: itemSeq }));
    onConfirmDrug(targetId, itemSeq);
  }

  function openEditor(e, targetId, field) {
    e.stopPropagation();
    setEditing({ targetId, field });
  }

  return (
    <>
      <h2>약 찾기 결과</h2>
      {results.map((r) => {
        const confirmedSeq = confirmedMap[r.target_id];
        const noMatch = noMatchMap[r.target_id];
        const editingShape = editing?.targetId === r.target_id && editing.field === "shape";
        const editingColor = editing?.targetId === r.target_id && editing.field === "color";
        const editingImprint = editing?.targetId === r.target_id && editing.field === "imprint";
        return (
          <div key={r.target_id} className="result-group">
            <p className="result-group-title">
              알약 {r.target_id} ·{" "}
              {editingShape ? (
                <ShapeSelect
                  value={r.shape}
                  onChange={(code, label) => onCorrectResult(r.target_id, "shape", code, label)}
                  onClose={() => setEditing(null)}
                />
              ) : (
                <span className="dim">
                  {r.shape_label}
                  <EditButton title="모양 직접 고치기" onClick={(e) => openEditor(e, r.target_id, "shape")} />
                </span>
              )}
              {" / "}
              {editingColor ? (
                <ColorSelect
                  value={r.color}
                  onChange={(code, label) => onCorrectResult(r.target_id, "color", code, label)}
                  onClose={() => setEditing(null)}
                />
              ) : (
                <span className="dim">
                  {r.color_label}
                  <EditButton title="색상 직접 고치기" onClick={(e) => openEditor(e, r.target_id, "color")} />
                </span>
              )}
            </p>
            {r.imprint ? (
              <p className="hint">
                각인 {editingImprint ? (
                  <TextEditor
                    value={r.imprint}
                    onSubmit={(text) => onCorrectResult(r.target_id, "imprint", text)}
                    onClose={() => setEditing(null)}
                  />
                ) : (
                  <>
                    {r.imprint}
                    <EditButton title="각인 직접 고치기" onClick={(e) => openEditor(e, r.target_id, "imprint")} />
                  </>
                )}
              </p>
            ) : (
              <ImprintRetry targetId={r.target_id} onCorrect={onCorrectResult} />
            )}
            <div className="list">
              {r.drugs.length === 0 && (
                <div className="row">
                  <span className="name">일치하는 약을 찾지 못했습니다.</span>
                </div>
              )}
              {r.drugs.map((d) => (
                <div key={d.item_seq} className="row drug-row">
                  <img className="drug-thumb" src={imageUrl(d.image_url)} alt="" loading="lazy" />
                  <span className="name-block">
                    <span className="name">{d.item_name}</span>
                    {d.class_name && <span className="imprint">{d.class_name}</span>}
                  </span>
                  {confirmedSeq === d.item_seq ? (
                    <span className="status confirmed">확정됨</span>
                  ) : (
                    <button className="inline-action" onClick={() => handleConfirm(r.target_id, d.item_seq)}>
                      이 약이 맞다
                    </button>
                  )}
                </div>
              ))}
              {r.drugs.length > 0 &&
                !confirmedSeq &&
                (noMatch ? (
                  <div className="row">
                    <span className="name dim">모두 아님으로 표시했습니다. 위 모양/색상/각인을 직접 고쳐 다시 찾아보세요.</span>
                  </div>
                ) : (
                  <div className="row" onClick={() => setNoMatchMap((prev) => ({ ...prev, [r.target_id]: true }))}>
                    <span className="name dim">모두 아님</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
      <footer>
        <button className="primary" disabled={loading} onClick={onReset}>
          처음부터
        </button>
      </footer>
    </>
  );
}
