import { useState } from "react";
import { imageUrl, uploadImage, reanalyze, lookupDrug } from "../api";
import PillStage from "./PillStage";
import UploadStep from "./UploadStep";
import ReviewStep from "./ReviewStep";
import MaskingStep from "./MaskingStep";
import ResultStep from "./ResultStep";

export default function PhotoFlow() {
  const [step, setStep] = useState("upload"); // upload | review | masking | done
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const [image, setImage] = useState(null); // { path, url, size:[w,h] }
  const [pills, setPills] = useState([]); // [{id, shape, color, shape_label, color_label, points}]
  const [decisions, setDecisions] = useState({}); // { [id]: 'pending'|'confirmed'|'flagged' }
  const [missedItems, setMissedItems] = useState([]); // [{id, label}]
  const [strokes, setStrokes] = useState([]); // [{forId, points:[[x,y]], brushSize}]
  const [activeMaskId, setActiveMaskId] = useState(null);
  const [brushSize, setBrushSize] = useState(28);
  const [results, setResults] = useState([]);

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
      setStep("review");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // ---------- 마스킹 -> 제출 ----------
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
            const lookup = await lookupDrug({ shape: p.shape, color: p.color, imprint: p.imprint });
            return { target_id: p.id, source: "confirmed", ...lookup };
          })
      );

      const reanalyzedResults = await Promise.all(
        maskTargets.map(async (t) => {
          const mask_png_base64 = buildMaskDataUrl(t.id);
          const r = await reanalyze({ image_path: image.path, target_id: t.id, mask_png_base64 });
          const lookup = await lookupDrug({ shape: r.shape, color: r.color, imprint: r.imprint });
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
    setPills([]);
    setDecisions({});
    setMissedItems([]);
    setStrokes([]);
    setActiveMaskId(null);
    setResults([]);
    setError("");
    setFileName("");
  }

  return (
    <>
      <span className="step-label-row">
        {step === "upload" && "등록"}
        {step === "review" && "판독"}
        {step === "masking" && "마스킹"}
        {step === "done" && "결과"}
      </span>

      {error && <div className="error">{error}</div>}

      {step === "upload" && (
        <UploadStep loading={loading} fileName={fileName} onFileChange={setFileName} onSubmit={handleUpload} />
      )}

      {(step === "review" || step === "masking") && image && (
        <>
          <PillStage
            step={step}
            image={image}
            pills={pills}
            decisions={decisions}
            strokes={strokes}
            setStrokes={setStrokes}
            activeMaskId={activeMaskId}
            brushSize={brushSize}
          />

          {step === "review" && (
            <ReviewStep
              pills={pills}
              decisions={decisions}
              setDecisions={setDecisions}
              addMissed={addMissed}
              allDecided={allDecided}
              hasMaskTargets={maskTargets.length > 0}
              loading={loading}
              onReset={reset}
              onNext={goToMaskingOrSubmit}
            />
          )}

          {step === "masking" && (
            <MaskingStep
              maskTargets={maskTargets}
              strokes={strokes}
              activeMaskId={activeMaskId}
              setActiveMaskId={setActiveMaskId}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              allMasked={allMasked}
              loading={loading}
              onBack={() => setStep("review")}
              onSubmit={submitAll}
            />
          )}
        </>
      )}

      {step === "done" && <ResultStep results={results} onReset={reset} />}
    </>
  );
}
