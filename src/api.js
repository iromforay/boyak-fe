const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export function imageUrl(path) {
  return `${API_BASE}${path}`;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json()).detail || `업로드 실패 (${res.status})`);
  return res.json();
}

export async function reanalyze({ image_path, target_id, mask_png_base64 }) {
  const res = await fetch(`${API_BASE}/reanalyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_path, target_id, mask_png_base64 }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `재분석 실패 (${res.status})`);
  return res.json();
}

export async function lookupDrug({ shape, color, imprint }) {
  const res = await fetch(`${API_BASE}/drug_lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shape, color, imprint }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `약 찾기 실패 (${res.status})`);
  return res.json();
}

export async function rejectTarget({ image_path, target_id, shape, color, points }) {
  const res = await fetch(`${API_BASE}/reject_target`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_path, target_id, shape, color, points }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `기록 실패 (${res.status})`);
  return res.json();
}

export async function confirmResult({ image_path, target_id, item_seq }) {
  const res = await fetch(`${API_BASE}/confirm_result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_path, target_id, item_seq }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `확정 실패 (${res.status})`);
  return res.json();
}

export async function correctLabel({ image_path, target_id, points, field, value }) {
  const res = await fetch(`${API_BASE}/correct_label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_path, target_id, points, field, value }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `교정 저장 실패 (${res.status})`);
  return res.json();
}

export async function searchDrugs(keyword) {
  const res = await fetch(`${API_BASE}/drug_search?q=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error((await res.json()).detail || `검색 실패 (${res.status})`);
  return res.json();
}
