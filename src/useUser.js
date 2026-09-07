import { useEffect, useState } from "react";
import { getUser, signup, setTutorialStatus } from "./api";

const STORAGE_KEY = "boyak_user_uuid";

// 네이티브 앱이 웹뷰로 이 페이지를 열 때 ?app=1을 붙여서 호출한다 - FCM
// 푸시는 순수 웹에서는 보낼 수 없으니, 가입 시점에 이 값으로 발송 대상을
// 구분해둔다.
function detectPlatform() {
  if (typeof window === "undefined") return "web";
  return new URLSearchParams(window.location.search).get("app") === "1" ? "app" : "web";
}

function ensureUuid() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

// 로그인 없는 하이브리드 앱 최소 가입 - 기기에 UUID를 한 번 만들어두고,
// 서버엔 이름/나이/튜토리얼 완료 여부만 붙여둔다. 화면(App)은 이 훅으로만
// 가입 여부와 튜토리얼 상태를 판단한다.
export function useUser() {
  const [uuid] = useState(ensureUuid);
  const [user, setUser] = useState(null);
  const [needsSignup, setNeedsSignup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUser(uuid)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setNeedsSignup(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  async function completeSignup(name, age) {
    const u = await signup({ uuid, name, age, platform: detectPlatform() });
    setUser(u);
    setNeedsSignup(false);
  }

  async function markTutorial(completed) {
    setUser((prev) => (prev ? { ...prev, tutorial_completed: completed } : prev));
    try {
      await setTutorialStatus(uuid, completed);
    } catch {
      // 네트워크 실패해도 화면 상태는 이미 반영됨 - 다음 접속 시 서버와 재동기화될 뿐
    }
  }

  return { uuid, user, needsSignup, completeSignup, markTutorial };
}
