# boyak-fe
보이는 약 FE

알약 사진을 등록하고, AI 판독 결과를 확인/마스킹한 뒤 약 이름을 찾는
React(Vite) 프론트엔드. 백엔드는 [boyak-be](../boyak-be)(FastAPI).

## 실행

```bash
npm install
npm run dev
```

`.env`(`.env.example` 참고)의 `VITE_API_BASE`가 boyak-be 주소를 가리켜야
한다 (기본값: `http://127.0.0.1:8000`). boyak-be를 먼저 띄워야 정상 동작한다.

## 화면 흐름

1. **등록** — 사진 업로드 → `POST /upload`
2. **판독** — AI가 찾은 알약 목록을 확인. 항목을 누르면
   `확인 대기 → 확인완료 → 마스킹 대상 → 확인완료 → ...` 순으로 순환.
   놓친 알약은 "+ 놓친 알약 있음"으로 추가.
3. **마스킹** — 마스킹 대상으로 표시된 항목만, 사진 위를 드래그해서
   실제 위치를 칠함. 이 마스크가 나중에 FastSAM 파인튜닝 재료로도 쓰인다
   (boyak-be의 `storage/ml_corrections/`).
4. **결과** — 확인/재분석된 모양+색상으로 약 이름 후보를 찾아 보여줌
   (지금은 DB가 없어 "알약" 고정값 - boyak-be의 `PillModel` 참고).
