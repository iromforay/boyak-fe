import { useState } from "react";
import { imageUrl } from "../api";

// 각인 인식이 실패한(빈 값) 결과에 한해 수동 입력 + 재검색 UI를 보여준다.
function ImprintRetry({ targetId, loading, onRetry }) {
  const [text, setText] = useState("");
  return (
    <div className="imprint-retry">
      <p className="hint">각인을 읽지 못했습니다. 알약에 새겨진 문자를 직접 입력해보세요.</p>
      <div className="imprint-retry-row">
        <input
          type="text"
          value={text}
          placeholder="예: V분할선8"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="inline-action" disabled={!text || loading} onClick={() => onRetry(targetId, text)}>
          다시 찾기
        </button>
      </div>
    </div>
  );
}

export default function ResultStep({ results, loading, onRetryImprint, onConfirmDrug, onReset }) {
  const [confirmedMap, setConfirmedMap] = useState({});

  function handleConfirm(targetId, itemSeq) {
    setConfirmedMap((prev) => ({ ...prev, [targetId]: itemSeq }));
    onConfirmDrug(targetId, itemSeq);
  }

  return (
    <>
      <h2>약 찾기 결과</h2>
      {results.map((r) => {
        const confirmedSeq = confirmedMap[r.target_id];
        return (
          <div key={r.target_id} className="result-group">
            <p className="result-group-title">
              알약 {r.target_id} <span className="dim">· {r.shape_label} / {r.color_label}</span>
            </p>
            {!r.imprint && <ImprintRetry targetId={r.target_id} loading={loading} onRetry={onRetryImprint} />}
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
            </div>
          </div>
        );
      })}
      <footer>
        <button className="primary" onClick={onReset}>처음부터</button>
      </footer>
    </>
  );
}
