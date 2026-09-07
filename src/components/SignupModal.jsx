import { useState } from "react";

// 로그인 없는 최소 가입 - 이름/나이만 받는다. 기기 UUID는 이미 useUser에서
// 만들어져 있고, 여기선 그 UUID에 사람이 보이는 정보만 붙여준다.
export default function SignupModal({ onSubmit }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const ageNum = Number(age);
    if (!trimmedName) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("나이를 올바르게 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(trimmedName, ageNum);
    } catch (err) {
      setError(err.message || "가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-backdrop">
      <form className="signup-modal" onSubmit={handleSubmit}>
        <h2>처음 오셨네요!</h2>
        <p className="hint">
          이름과 나이만 알려주시면 바로 시작할 수 있어요. 비밀번호 없이 이 기기에서 계속 사용됩니다.
        </p>
        <label className="signup-field">
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" />
        </label>
        <label className="signup-field">
          나이
          <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 65" />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "처리 중..." : "시작하기"}
        </button>
      </form>
    </div>
  );
}
