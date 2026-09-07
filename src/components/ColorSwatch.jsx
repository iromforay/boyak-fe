// 색상 코드값 -> 대표 HEX. 실제 알약 색상은 미묘한 편차가 있지만, 사용자가
// "이 색에 가깝다"고 고를 수 있게 대표색 하나씩만 보여준다(app/services/
// pill_service.py의 _COLOR_LABELS와 같은 코드값 기준).
const COLOR_HEX = {
  white: "#FFFFFF",
  ivory: "#FFF6E0",
  yellow: "#FFD60A",
  orange: "#FF9500",
  pink: "#FF7AA8",
  red: "#FF3B30",
  brown: "#8B5A2B",
  purple: "#AF52DE",
  blue: "#0A84FF",
  green: "#34C759",
  gray: "#8E8E93",
  black: "#1C1C1E",
};

export default function ColorSwatch({ color, className }) {
  const hex = COLOR_HEX[color];
  if (!hex) {
    // "투명(clear)"은 채울 색이 없어 점선 원 + 사선으로 무색임을 표시한다.
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="none" stroke="#8a8a8f" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="11" y1="37" x2="37" y2="11" stroke="#8a8a8f" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill={hex} stroke="#8a8a8f" strokeWidth="1.5" />
    </svg>
  );
}
