import { useState } from "react";
import { searchDrugs } from "../api";

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

  return (
    <>
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
        <div className="search-table-wrap">
          <table className="search-table">
            <thead>
              <tr>
                <th>약 이름</th>
                <th>제조사</th>
                <th>성상</th>
                <th>분류</th>
                <th>구분</th>
                <th>허가일자</th>
              </tr>
            </thead>
            <tbody>
              {results.map((d) => (
                <tr key={d.item_seq}>
                  <td className="name-cell">{d.item_name}</td>
                  <td>{d.entp_name}</td>
                  <td>{d.chart}</td>
                  <td>{d.class_name}</td>
                  <td>{d.etc_otc_name}</td>
                  <td>{d.item_permit_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
