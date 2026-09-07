// 튜토리얼이 실제 화면의 어떤 요소를 짚어줄지 정의한다. selector로 지정한
// 요소가 화면에 나타날 때까지 TutorialOverlay가 기다렸다가 그 위치에
// 빨간 박스 + 말풍선 설명을 띄운다 - 판독/결과 화면처럼 사진을 올려야만
// 나타나는 요소도 그대로 순서대로 짚어줄 수 있다.
//
// decision-row 단계는 "눌러보세요" 하고 사용자가 직접 누르길 기다리는 대신,
// TutorialOverlay가 탭 표시를 보여주며 실제로 클릭을 시뮬레이션해서 대기→
// 확인완료→마스킹 대상→미대상 상태 변화를 순서대로 직접 보여준다(demo 배열).
export const TUTORIAL_STEPS = [
  {
    selector: '[data-tutorial="mode-switch"]',
    text: "사진으로 찾거나, 이름으로 직접 검색할 수 있어요.",
  },
  {
    selector: '[data-tutorial="upload-pick"]',
    text: "분석할 사진을 선택하세요.",
  },
  {
    selector: '[data-tutorial="analyze-start"]',
    text: "사진을 골랐어요. 눌러서 분석을 시작하세요.",
  },
  {
    selector: '[data-tutorial="shape-edit"]',
    text: "모양이 다르면 연필(✎)을 눌러 직접 고치세요.",
  },
  {
    selector: '[data-tutorial="color-edit"]',
    text: "색상이 다르면 연필(✎)을 눌러 직접 고치세요.",
  },
  {
    selector: '[data-tutorial="imprint-edit"]',
    text: "각인(알약에 새겨진 글자)이 다르면 여기서 직접 입력하세요.",
  },
  {
    selector: '[data-tutorial="decision-row"]',
    text: "이렇게 눌러서 알약 상태를 바꿀 수 있어요.",
    demo: [
      { text: "확인완료: 이 약이 맞다는 뜻이에요. 이대로 분석 대상이 됩니다." },
      { text: "마스킹 대상: 약을 못 찾았어요. 다음 화면에서 브러시로 약 범위를 직접 칠해주세요." },
      { text: "미대상: 잘못 잡힌 영역이에요. 결과에서 제외됩니다." },
      { text: "다시 누르면 확인완료로 돌아와요. 실제로 눌러서 상태를 표시해보세요." },
    ],
  },
  {
    selector: '[data-tutorial="confirm-drug"]',
    text: "찾는 약이 있으면 '이 약이 맞다'를 눌러 확정하세요.",
  },
];
