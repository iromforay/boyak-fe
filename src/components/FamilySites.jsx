import { useEffect, useState } from "react";

// 패밀리 사이트 목록을 코드에 박아두지 않고 정적 파일(/family-apps.xml)에서
// 매번 fetch로 읽어온다 - 이 웹은 하이브리드 앱의 웹뷰가 그대로 불러오는
// 구조라, 목록을 추가/변경할 때 이 XML 파일만 서버에 교체하면 되고 프론트를
// 다시 빌드/배포할 필요가 없다.
export default function FamilySites() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/family-apps.xml")
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(text, "application/xml");
        const list = [...doc.querySelectorAll("app")]
          .map((el) => ({
            name: el.querySelector("name")?.textContent?.trim() || "",
            storeUrl: el.querySelector("storeUrl")?.textContent?.trim() || "",
          }))
          .filter((app) => app.name && app.storeUrl);
        setApps(list);
      })
      .catch(() => {
        // 목록을 못 가져와도 화면에는 그냥 안 보이면 그만 - 사용자 흐름을 막을 필요 없다.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (apps.length === 0) return null;

  function handleChange(e) {
    const url = e.target.value;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    e.target.selectedIndex = 0;
  }

  return (
    <select className="family-sites" defaultValue="" onChange={handleChange} aria-label="패밀리 사이트">
      <option value="" disabled>
        패밀리 사이트
      </option>
      {apps.map((app) => (
        <option key={app.storeUrl} value={app.storeUrl}>
          {app.name}
        </option>
      ))}
    </select>
  );
}
