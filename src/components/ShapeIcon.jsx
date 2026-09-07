// 알약 모양 12종을 실루엣 아이콘으로 표시한다. 텍스트 용어(오각형/장방형 등)만으론
// 실제 알약과 매칭하기 어렵다는 피드백에 따라 도입 - 실물 사진 대신 단순 도형으로
// 그려서 다크모드 대응(currentColor)과 용량 부담을 없앴다.
const SHAPES = {
  round: <circle cx="24" cy="24" r="18" />,
  oval: <ellipse cx="24" cy="24" rx="20" ry="13" />,
  capsule: <rect x="4" y="16" width="40" height="16" rx="8" ry="8" />, // 양끝이 완전히 둥근 스타디움형
  triangle: <polygon points="24,6 44,40 4,40" />,
  square: <rect x="8" y="8" width="32" height="32" rx="4" ry="4" />,
  diamond: <polygon points="24,4 44,24 24,44 4,24" />,
  pentagon: <polygon points="24,5 42.07,18.13 35.16,39.37 12.84,39.37 5.93,18.13" />,
  hexagon: <polygon points="43,24 33.5,40.45 14.5,40.45 5,24 14.5,7.55 33.5,7.55" />,
  semicircle: <path d="M6,30 A18,18 0 0 1 42,30 L6,30 Z" />,
  oblong: <rect x="4" y="14" width="40" height="20" rx="4" ry="4" />, // 캡슐형보다 덜 둥근 장방형
  octagon: (
    <polygon points="41.55,31.27 31.27,41.55 16.73,41.55 6.45,31.27 6.45,16.73 16.73,6.45 31.27,6.45 41.55,16.73" />
  ),
};

export default function ShapeIcon({ shape, className }) {
  if (shape === "other" || !SHAPES[shape]) {
    // "기타"는 정해진 형태가 없어 다른 도형과 구분되게 점선 원 + 물음표로 표시한다.
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 5" />
        <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">
          ?
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-hidden="true">
      {SHAPES[shape]}
    </svg>
  );
}
