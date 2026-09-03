import { useState } from "react";
import { imageUrl, uploadImage, reanalyze, lookupDrug, rejectTarget, confirmResult, correctLabel } from "../api";
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

  // 판독화면에서 모양/색상/각인이 잘못 나왔을 때 사용자가 직접 고친 값 -
  // 화면에는 즉시 반영하고(이후 약 찾기에도 그대로 쓰임), 원본 이미지+정답
  // 라벨은 재학습용 raw 데이터로 백엔드에 남긴다(_save_label_correction).
  // 기록 실패가 사용자 흐름을 막으면 안 되니 실패해도 조용히 무시한다.
  function handleCorrect(pillId, field, value, label) {
    const pill = pills.find((p) => p.id === pillId);
    if (!pill) return;
    correctLabel({ image_path: image.path, target_id: pillId, points: pill.points, field, value }).catch(() => {});
    setPills((prev) =>
      prev.map((p) => {
        if (p.id !== pillId) return p;
        if (field === "shape") return { ...p, shape: value, shape_label: label, shape_confidence: null };
        if (field === "color") return { ...p, color: value, color_label: label };
        return { ...p, imprint: value, imprint_confidence: null };
      })
    );
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
      // 미대상(오탐)으로 표시한 항목은 검출 단계 재학습용 음성 예제로 기록만
      // 남기고 최종 결과에는 포함하지 않는다. 기록 실패가 사용자 흐름을
      // 막으면 안 되니 실패해도 조용히 무시한다.
      pills
        .filter((p) => decisions[p.id] === "rejected")
        .forEach((p) => {
          rejectTarget({ image_path: image.path, target_id: p.id, shape: p.shape, color: p.color, points: p.points }).catch(
            () => {}
          );
        });

      const confirmedResults = await Promise.all(
        pills
          .filter((p) => decisions[p.id] === "confirmed")
          .map(async (p) => {
            const lookup = await lookupDrug({ shape: p.shape, color: p.color, imprint: p.imprint });
            return {
              target_id: p.id,
              source: "confirmed",
              image_path: image.path,
              shape: p.shape,
              color: p.color,
              imprint: p.imprint,
              points: p.points,
              ...lookup,
            };
          })
      );

      const reanalyzedResults = await Promise.all(
        maskTargets.map(async (t) => {
          const mask_png_base64 = buildMaskDataUrl(t.id);
          const r = await reanalyze({ image_path: image.path, target_id: t.id, mask_png_base64 });
          const lookup = await lookupDrug({ shape: r.shape, color: r.color, imprint: r.imprint });
          // 마스킹 대상은 원래 탐지된 알약(재교정)이면 원본 폴리곤이 남아있지만,
          // "놓친 알약"으로 새로 추가한 항목은 애초에 폴리곤이 없다 - 그 경우
          // 결과화면에서 다시 고쳐도 재학습용 raw 데이터 저장은 건너뛴다.
          const original = pills.find((p) => p.id === t.id);
          return {
            target_id: t.id,
            source: "reanalyzed",
            image_path: image.path,
            shape: r.shape,
            color: r.color,
            imprint: r.imprint,
            points: original?.points,
            ...lookup,
          };
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

  // 결과화면에서도 모양/색상/각인이 잘못 나왔을 때(=약찾기 실패의 흔한
  // 원인) 직접 고칠 수 있게 한다 - 마스킹까지 끝난 뒤라 다시 처음부터
  // 돌아갈 필요 없이 고친 값으로 바로 재검색한다. 원본 폴리곤(points)이
  // 남아있는 경우에만 재학습용 raw 데이터로도 남긴다(_save_label_correction).
  async function handleCorrectResult(targetId, field, value, label) {
    const target = results.find((r) => r.target_id === targetId);
    if (!target) return;
    if (target.points) {
      correctLabel({ image_path: target.image_path, target_id: targetId, points: target.points, field, value }).catch(() => {});
    }
    const updated = { ...target };
    if (field === "shape") {
      updated.shape = value;
      updated.shape_label = label;
    } else if (field === "color") {
      updated.color = value;
      updated.color_label = label;
    } else {
      updated.imprint = value;
    }
    setLoading(true);
    setError("");
    try {
      const lookup = await lookupDrug({ shape: updated.shape, color: updated.color, imprint: updated.imprint });
      setResults((prev) => prev.map((r) => (r.target_id === targetId ? { ...updated, ...lookup } : r)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 결과화면에서 "이 약이 맞다" 확정 - 모양 분류기 학습용 정답 라벨을 남긴다.
  // 기록 실패가 사용자 흐름을 막으면 안 되니 실패해도 조용히 무시한다.
  function confirmDrug(targetId, itemSeq) {
    const target = results.find((r) => r.target_id === targetId);
    if (!target) return;
    confirmResult({ image_path: target.image_path, target_id: targetId, item_seq: itemSeq }).catch(() => {});
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
              onCorrect={handleCorrect}
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

      {step === "done" && (
        <ResultStep
          results={results}
          loading={loading}
          onCorrectResult={handleCorrectResult}
          onConfirmDrug={confirmDrug}
          onReset={reset}
        />
      )}
    </>
  );
}
