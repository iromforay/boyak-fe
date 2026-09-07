import OptionPicker from "./OptionPicker";
import ColorSwatch from "./ColorSwatch";
import { COLOR_OPTIONS } from "../labelOptions";

// 모양 선택창과 통일감을 맞추기 위해 드롭다운 대신 같은 그리드 모달을 쓰고,
// 텍스트 대신(과 함께) 대표 색상값(스와치)을 보여준다.
export default function ColorPicker({ value, onChange, onClose }) {
  return (
    <OptionPicker
      title="색상을 골라주세요"
      options={COLOR_OPTIONS}
      value={value}
      onChange={onChange}
      onClose={onClose}
      renderIcon={(code) => <ColorSwatch color={code} className="option-item-icon" />}
    />
  );
}
