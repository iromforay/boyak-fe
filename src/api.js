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

export async function lookupDrug({ shape, color }) {
  const res = await fetch(`${API_BASE}/drug_lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shape, color }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || `약 찾기 실패 (${res.status})`);
  return res.json();
}
