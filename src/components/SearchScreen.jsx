import { useState } from "react";
import { searchDrugs, imageUrl } from "../api";

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(null); // null = 아직 검색 안 함
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchDrugs(q);
      setResults(data.drugs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 검색 전/결과 없음 상태에서는 검색창이 화면 상단에 붙어있으면 허전해
  // 보여서 세로로 살짝 가운데에 오도록 하고, 실제 결과 목록이 있을 땐
  // 목록이 화면을 채워야 하니 다시 상단 고정으로 되돌린다.
  const isEmpty = results === null || results.length === 0;

  return (
    <div className={isEmpty ? "search-screen search-screen-empty" : "search-screen"}>
      {error && <div className="error">{error}</div>}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="약 이름 또는 제조사로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" disabled={loading || !keyword.trim()}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {results === null && (
        <p className="hint">식품의약품안전처 의약품 정보를 이름으로 검색합니다.</p>
      )}
      {results !== null && results.length === 0 && (
        <p className="hint">검색 결과가 없습니다.</p>
      )}
      {results !== null && results.length > 0 && (
        <div className="drug-list">
          {results.map((d) => (
            <div className="drug-card" key={d.item_seq}>
              <img
                className="drug-thumb"
                src={imageUrl(d.image_url)}
                alt=""
                loading="lazy"
                onError={(e) => (e.target.style.visibility = "hidden")}
              />
              <div className="drug-info">
                <div className="drug-name">{d.item_name}</div>
                <div className="drug-entp">{d.entp_name}</div>
                <div className="drug-meta">
                  {d.chart && <span className="tag">{d.chart}</span>}
                  {d.class_name && <span className="tag">{d.class_name}</span>}
                  {d.etc_otc_name && <span className="tag">{d.etc_otc_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
