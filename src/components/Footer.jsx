import FamilySites from "./FamilySites";

// 앱 최하단 법적 고지 - 스토어 심사/법적 요건상 약관·개인정보처리방침은
// 항상 접근 가능해야 한다. 스텝별 sticky 액션바(<footer>)와는 별개다.
export default function Footer() {
  return (
    <div className="legal-footer">
      <p>
        <a href="/terms.html">이용약관</a>
        <span aria-hidden="true">·</span>
        <a href="/privacy.html">개인정보처리방침</a>
      </p>
      <p>이롬 · 대표 나병연 · 사업자등록번호 257-38-01646</p>
      <FamilySites />
    </div>
  );
}
