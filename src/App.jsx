import { useEffect, useRef, useState } from "react";
import { imageUrl, uploadImage, reanalyze, lookupDrug } from "./api";
import "./App.css";

// pending -> confirmed -> flagged -> confirmed -> flagged ... (교차 토글)
function nextDecision(current) {
  if (current === "pending") return "confirmed";
  if (current === "confirmed") return "flagged";
  return "confirmed";
}

export default function App() {
  const [step, setStep] = useState("upload"); // upload | review | masking | done
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [image, setImage] = useState(null); // { path, url, size:[w,h] }
  const [pills, setPills] = useState([]); // [{id, shape, color, shape_label, color_label, points}]
  const [decisions, setDecisions] = useState({}); // { [id]: 'pending'|'confirmed'|'flagged' }
  const [missedItems, setMissedItems] = useState([]); // [{id, label}]
  const [strokes, setStrokes] = useState([]); // [{forId, points:[[x,y]], brushSize}]
  const [activeMaskId, setActiveMaskId] = useState(null);
  const [brushSize, setBrushSize] = useState(28);
  const [results, setResults] = useState([]);
  const [imgLoaded, setImgLoaded] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const drawingRef = useRef(false);

  const maskTargets = [
    ...pills.filter((p) => decisions[p.id] === "flagged").map((p) => ({ id: p.id, label: `${p.shape_label} / ${p.color_label}` })),
    ...missedItems,
  ];
  const allDecided = pills.every((p) => decisions[p.id] && decisions[p.id] !== "pending");
  const allMasked = maskTargets.every((t) => strokes.some((s) => s.forId === t.id));

  // ---------- 업로드 ----------
  async function handleUpload(e) {
    e.preventDefault();
    const file = e.target.elements.image.files[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await uploadImage(file);
      setImage({ path: data.image_path, url: imageUrl(data.image_url), size: data.image_size });
      setPills(data.pills.map((p) => ({ ...p, id: p.index })));
      setDecisions(Object.fromEntries(data.pills.map((p) => [p.index, "pending"])));
      setMissedItems([]);
      setStrokes([]);
      setResults([]);
      setImgLoaded(false);
      setStep("review");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- 캔버스 렌더링 ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !image || !imgLoaded) return;

    const [W, H] = image.size;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    const toPx = (pts) => pts.map(([x, y]) => [x * W, y * H]);
    const drawPolygon = (pts, stroke, lineWidth) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };
    const labelAt = (pts, text) => {
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      ctx.font = `${Math.round(W * 0.026)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = W * 0.005;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText(text, cx, cy);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, cx, cy);
    };

    if (step === "review") {
      pills.forEach((p) => {
        const pts = toPx(p.points);
        const state = decisions[p.id];
        const color = state === "confirmed" ? "#4CAF7D" : state === "flagged" ? "#D9481F" : "#ffffffbf";
        drawPolygon(pts, color, W * 0.006);
        labelAt(pts, String(p.id));
      });
    } else if (step === "masking") {
      pills
        .filter((p) => decisions[p.id] === "flagged")
        .forEach((p) => {
          const pts = toPx(p.points);
          const active = p.id === activeMaskId;
          drawPolygon(pts, active ? "rgba(217,72,31,0.6)" : "rgba(217,72,31,0.3)", W * 0.004);
          labelAt(pts, String(p.id));
        });
      strokes.forEach((s) => {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = s.forId === activeMaskId ? "rgba(217,72,31,0.65)" : "rgba(217,72,31,0.4)";
        ctx.lineWidth = s.brushSize;
        ctx.beginPath();
        s.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      });
    }
  }, [step, image, pills, decisions, strokes, activeMaskId, imgLoaded]);

  function eventToImageXY(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return [x, y];
  }

  function onPointerDown(e) {
    if (step !== "masking" || activeMaskId === null) return;
    drawingRef.current = true;
    setStrokes((prev) => [...prev, { forId: activeMaskId, points: [eventToImageXY(e)], brushSize }]);
  }
  function onPointerMove(e) {
    if (!drawingRef.current) return;
    const pt = eventToImageXY(e);
    setStrokes((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], points: [...next[next.length - 1].points, pt] };
      return next;
    });
  }
  function onPointerUp() {
    drawingRef.current = false;
  }

  // ---------- 1단계: 확인/마스킹 결정 ----------
  function cycle(id) {
    setDecisions((prev) => ({ ...prev, [id]: nextDecision(prev[id] || "pending") }));
  }
  function addMissed() {
    const n = missedItems.length + 1;
    setMissedItems((prev) => [...prev, { id: `missed-${n}`, label: `놓친 알약 ${n}` }]);
  }
  function goToMaskingOrSubmit() {
    if (maskTargets.length > 0) {
      setActiveMaskId(maskTargets[0].id);
      setStep("masking");
    } else {
      submitAll();
    }
  }

  // ---------- 2단계: 마스킹 -> 제출 ----------
  function buildMaskDataUrl(targetId) {
    const [W, H] = image.size;
    const m = document.createElement("canvas");
    m.width = W;
    m.height = H;
    const mctx = m.getContext("2d");
    mctx.strokeStyle = "#fff";
    mctx.lineJoin = "round";
    mctx.lineCap = "round";
    strokes
      .filter((s) => s.forId === targetId)
      .forEach((s) => {
        mctx.lineWidth = s.brushSize;
        mctx.beginPath();
        s.points.forEach(([x, y], i) => (i === 0 ? mctx.moveTo(x, y) : mctx.lineTo(x, y)));
        mctx.stroke();
      });
    return m.toDataURL("image/png");
  }

  async function submitAll() {
    setLoading(true);
    setError("");
    try {
      const confirmedResults = await Promise.all(
        pills
          .filter((p) => decisions[p.id] === "confirmed")
          .map(async (p) => {
            const lookup = await lookupDrug({ shape: p.shape, color: p.color });
            return { target_id: p.id, source: "confirmed", ...lookup };
          })
      );

      const reanalyzedResults = await Promise.all(
        maskTargets.map(async (t) => {
          const mask_png_base64 = buildMaskDataUrl(t.id);
          const r = await reanalyze({ image_path: image.path, target_id: t.id, mask_png_base64 });
          const lookup = await lookupDrug({ shape: r.shape, color: r.color });
          return { target_id: t.id, source: "reanalyzed", ...lookup };
        })
      );

      setResults([...confirmedResults, ...reanalyzedResults]);
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("upload");
    setImage(null);
    setImgLoaded(false);
    setPills([]);
    setDecisions({});
    setMissedItems([]);
    setStrokes([]);
    setActiveMaskId(null);
    setResults([]);
    setError("");
  }

  return (
    <div className="app">
      <header>
        <span className="brand">보약 · 보이는 약</span>
        <span className="step-label">
          {step === "upload" && "등록"}
          {step === "review" && "판독"}
          {step === "masking" && "마스킹"}
          {step === "done" && "결과"}
        </span>
      </header>

      {error && <div className="error">{error}</div>}

      {step === "upload" && (
        <form className="card" onSubmit={handleUpload}>
          <h1>알약 사진 등록</h1>
          <input type="file" name="image" accept="image/*" required />
          <button type="submit" disabled={loading}>{loading ? "분석 중..." : "분석 시작"}</button>
        </form>
      )}

      {(step === "review" || step === "masking") && image && (
        <>
          <div className="stage">
            <img
              ref={imgRef}
              src={image.url}
              alt=""
              crossOrigin="anonymous"
              style={{ display: "none" }}
              onLoad={() => setImgLoaded(true)}
            />
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>

          {step === "review" && (
            <>
              <p className="hint">각 항목을 눌러 <b>확인완료</b> 또는 <b>마스킹 대상</b>으로 표시하세요.</p>
              <div className="list">
                {pills.map((p) => {
                  const state = decisions[p.id] || "pending";
                  return (
                    <div key={p.id} className={`row ${state}`} onClick={() => cycle(p.id)}>
                      <span className="idx">알약 {p.id}</span>
                      <span className="name">{p.shape_label} / {p.color_label}</span>
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
                <button className="secondary" onClick={reset}>처음부터</button>
                <button className="primary" disabled={!allDecided || loading} onClick={goToMaskingOrSubmit}>
                  {loading ? "처리 중..." : maskTargets.length > 0 ? "마스킹하러 가기" : "약 찾기"}
                </button>
              </footer>
            </>
          )}

          {step === "masking" && (
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
                <button className="secondary" onClick={() => setStep("review")}>이전</button>
                <button className="primary" disabled={!allMasked || loading} onClick={submitAll}>
                  {loading ? "처리 중..." : "교정 결과 제출"}
                </button>
              </footer>
            </>
          )}
        </>
      )}

      {step === "done" && (
        <>
          <h2>약 찾기 결과</h2>
          <div className="list">
            {results.map((r) => (
              <div key={r.target_id} className="row">
                <span className="idx">알약 {r.target_id}</span>
                <span className="name">{r.shape_label} / {r.color_label} → {r.drug_names.join(", ")}</span>
              </div>
            ))}
          </div>
          <footer>
            <button className="primary" onClick={reset}>처음부터</button>
          </footer>
        </>
      )}
    </div>
  );
}
