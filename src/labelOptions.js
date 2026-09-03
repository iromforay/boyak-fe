// DB의 drug_shape/color_class1 코드값 <-> 한글 표시값 (app/services/pill_service.py의
// _SHAPE_LABELS/_COLOR_LABELS와 동일하게 유지 - 교정 시 코드값을 그대로 서버에 보낸다).
export const SHAPE_OPTIONS = [
  ["round", "원형"],
  ["oval", "타원형"],
  ["capsule", "캡슐형"],
  ["triangle", "삼각형"],
  ["square", "사각형"],
  ["diamond", "마름모형"],
  ["pentagon", "오각형"],
  ["hexagon", "육각형"],
  ["semicircle", "반원형"],
  ["oblong", "장방형"],
  ["octagon", "팔각형"],
  ["other", "기타"],
];

export const COLOR_OPTIONS = [
  ["white", "흰색"],
  ["ivory", "아이보리"],
  ["yellow", "노랑"],
  ["orange", "주황"],
  ["pink", "분홍"],
  ["red", "빨강"],
  ["brown", "갈색"],
  ["purple", "보라"],
  ["blue", "파랑"],
  ["green", "초록"],
  ["gray", "회색"],
  ["black", "검정"],
  ["clear", "투명"],
];

export function labelFor(options, code) {
  return options.find(([c]) => c === code)?.[1] || code;
}
