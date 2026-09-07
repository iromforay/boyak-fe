import { useEffect, useState } from "react";

// 모양 선택 그리드, 가입 모달, 설정 메뉴처럼 다른 오버레이가 열려 있는 동안은
// 튜토리얼을 잠깐 숨긴다 - 안 그러면 그 아래 가려진 다음 단계 요소를 poll이
// "화면이 넘어갔다"고 착각해 자동으로 앞질러 가버리고, 모달 위에 엉뚱한
// 위치의 빨간 박스가 겹쳐 보이는 문제가 있었다.
const OTHER_OVERLAY_SELECTOR = ".option-picker-backdrop, .signup-backdrop, .settings-backdrop";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// stepIndex부터 끝까지 순서대로 selector를 찾아, 화면에 실제로 존재하는 첫
// 대상을 짚어준다("다음"을 안 누르고 화면을 넘겨버려도(예: 판독에서 바로
// 결과로) 다음 화면에 나타나는 다음 단계 대상을 자동으로 따라간다).
export default function TutorialOverlay({ steps, stepIndex, onStepChange, onNext, onSkip }) {
  const [rect, setRect] = useState(null);
  const [demoText, setDemoText] = useState(null);
  const [tapPos, setTapPos] = useState(null);

  useEffect(() => {
    function poll() {
      if (document.querySelector(OTHER_OVERLAY_SELECTOR)) {
        setRect(null);
        return;
      }
      for (let i = stepIndex; i < steps.length; i++) {
        const el = document.querySelector(steps[i].selector);
        if (el) {
          if (i !== stepIndex) onStepChange(i);
          setRect(el.getBoundingClientRect());
          return;
        }
      }
      setRect(null);
    }

    poll();
    const id = setInterval(poll, 400);
    window.addEventListener("resize", poll);
    window.addEventListener("scroll", poll, true);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", poll);
      window.removeEventListener("scroll", poll, true);
    };
  }, [stepIndex, steps, onStepChange]);

  // "눌러보세요"라고 말만 하고 기다리는 대신, 실제로 탭 표시를 보여주며
  // 클릭을 대신 실행해서 대기→확인완료→마스킹 대상→미대상 상태 변화를
  // 직접 시연한다. stepIndex가 바뀌면(사용자가 "다음"/"종료"를 눌러도)
  // cancelled로 즉시 중단된다.
  useEffect(() => {
    const step = steps[stepIndex];
    if (!step?.demo) {
      setDemoText(null);
      setTapPos(null);
      return undefined;
    }

    let cancelled = false;
    setDemoText(null);

    async function waitForEl() {
      for (let tries = 0; tries < 40 && !cancelled; tries++) {
        const el = document.querySelector(step.selector);
        if (el) return el;
        await sleep(300);
      }
      return null;
    }

    async function run() {
      const el = await waitForEl();
      if (!el || cancelled) return;

      for (const stage of step.demo) {
        if (cancelled) return;
        const badge = el.querySelector(".status") || el;
        const r = badge.getBoundingClientRect();
        setTapPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        await sleep(500);
        if (cancelled) return;
        setTapPos(null);
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        setDemoText(stage.text);
        await sleep(stage.hold ?? 2000);
      }
      if (!cancelled) onNext();
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const step = steps[stepIndex];
  const showSpotlight = Boolean(step && rect);

  let boxStyle = null;
  let bubbleTop = 0;
  let bubbleLeft = 0;
  let blockerRects = null;
  if (showSpotlight) {
    const pad = 6;
    const b = {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };
    boxStyle = b;
    const spaceBelow = window.innerHeight - rect.bottom;
    bubbleTop = spaceBelow > 140 ? rect.bottom + 14 : Math.max(rect.top - 130, 12);
    bubbleLeft = Math.min(Math.max(rect.left + rect.width / 2 - 150, 12), window.innerWidth - 312);

    // 하이라이트된 실제 대상 위치(box)만 빼고 나머지 화면은 클릭이 안 먹히게
    // 막는다 - 딤 처리된 배경이 시각적으로만 "막힌 것처럼" 보이고 실제로는
    // 다른 버튼이 눌리던 문제(순서를 건너뛰고 엉뚱한 동작을 하게 됨)를 막는다.
    // 사각형 하나로는 구멍을 뚫을 수 없어 위/아래/좌/우 4개로 감싼다.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    blockerRects = [
      { top: 0, left: 0, width: vw, height: Math.max(b.top, 0) },
      { top: b.top + b.height, left: 0, width: vw, height: Math.max(vh - (b.top + b.height), 0) },
      { top: b.top, left: 0, width: Math.max(b.left, 0), height: b.height },
      { top: b.top, left: b.left + b.width, width: Math.max(vw - (b.left + b.width), 0), height: b.height },
    ];
  }

  // 종료 버튼은 화면 우하단에 항상 고정으로 떠 있다 - 다음 단계 대상을
  // 아직 못 찾아 스포트라이트가 안 보이는 순간(화면 전환 중)에도 언제든
  // 튜토리얼을 끝낼 수 있어야 한다.
  return (
    <>
      {showSpotlight && (
        <div className="tutorial-backdrop">
          {blockerRects.map((r, i) => (
            <div key={i} className="tutorial-blocker" style={r} />
          ))}
          <div className="tutorial-box" style={boxStyle} />
          <div className="tutorial-bubble" style={{ top: bubbleTop, left: bubbleLeft }}>
            <p className="tutorial-bubble-text">{demoText ?? step.text}</p>
            {!step.demo && (
              <div className="tutorial-bubble-actions">
                <button type="button" className="tutorial-bubble-next" onClick={onNext}>
                  {stepIndex === steps.length - 1 ? "완료" : "다음"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {tapPos && <div className="tutorial-tap" style={{ top: tapPos.y, left: tapPos.x }} />}
      <button type="button" className="tutorial-end-btn" onClick={onSkip}>
        튜토리얼 종료
      </button>
    </>
  );
}
