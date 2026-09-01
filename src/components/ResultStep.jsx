import { imageUrl } from "../api";

export default function ResultStep({ results, onReset }) {
  return (
    <>
      <h2>약 찾기 결과</h2>
      {results.map((r) => (
        <div key={r.target_id} className="result-group">
          <p className="result-group-title">
            알약 {r.target_id} <span className="dim">· {r.shape_label} / {r.color_label}</span>
          </p>
          <div className="list">
            {r.drugs.length === 0 && (
              <div className="row">
                <span className="name">일치하는 약을 찾지 못했습니다.</span>
              </div>
            )}
            {r.drugs.map((d) => (
              <div key={d.item_seq} className="row drug-row">
                <img className="drug-thumb" src={imageUrl(d.image_url)} alt="" loading="lazy" />
                <span className="name-block">
                  <span className="name">{d.item_name}</span>
                  {d.class_name && <span className="imprint">{d.class_name}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <footer>
        <button className="primary" onClick={onReset}>처음부터</button>
      </footer>
    </>
  );
}
