import { useEffect, useRef, useState } from "react";

// review/masking 단계에서 공유하는 사진+캔버스 영역.
// 알약 윤곽선/마스킹 브러시 스트로크를 그리는 로직을 이 컴포넌트 안에 캡슐화한다.
export default function PillStage({ step, image, pills, decisions, strokes, setStrokes, activeMaskId, brushSize }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const drawingRef = useRef(false);
  const [imgLoaded, setImgLoaded] = useState(false);

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
        const color =
          state === "confirmed" ? "#4CAF7D" : state === "flagged" ? "#D9481F" : state === "rejected" ? "#8E8E93" : "#ffffffbf";
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

  return (
    <div className="stage">
      <img
        ref={imgRef}
        src={image.url}
        alt=""
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
  );
}
