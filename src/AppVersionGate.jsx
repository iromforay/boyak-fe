import { useEffect, useState } from "react";
import { checkAppVersion } from "./api";

/**
 * 네이티브 앱(TWA)이 처음 여는 화면. start URL 쿼리파라미터로 넘어온
 * 자기 버전을 BE에 물어보고, 통과면 "/"(본 화면)로, 거절이면 구글
 * 플레이스토어로 즉시 리다이렉트한다 - 화면을 직접 렌더링할 일이
 * 거의 없어서(성공/실패 둘 다 바로 다른 곳으로 튕겨나감) 별도 UI 없이
 * 진행 상태만 최소한으로 보여준다.
 */
export default function AppVersionGate() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const versionCode = params.get("version_code");
    const platform = params.get("platform") || "android";

    // 브라우저로 직접 /intro에 들어온 경우 등 버전값이 없으면 체크할
    // 대상이 없으므로 그냥 본 화면으로 보낸다.
    if (!versionCode) {
      window.location.replace("/");
      return;
    }

    checkAppVersion({ version_code: versionCode, platform })
      .then(({ allowed, store_url }) => {
        if (allowed) {
          window.location.replace("/");
        } else if (store_url) {
          window.location.replace(store_url);
        } else {
          setError("업데이트가 필요하지만 스토어 이동 정보를 받지 못했습니다.");
        }
      })
      .catch(() => {
        // BE 장애로 체크 자체가 안 되는 경우까지 앱을 막으면 안 되니
        // 통과시킨다 (거절은 오직 BE가 명시적으로 응답했을 때만).
        window.location.replace("/");
      });
  }, []);

  return (
    <div className="app-version-gate">
      <p>{error || "버전을 확인하는 중입니다..."}</p>
    </div>
  );
}
