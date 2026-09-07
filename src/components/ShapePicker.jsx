import OptionPicker from "./OptionPicker";
import ShapeIcon from "./ShapeIcon";
import { SHAPE_OPTIONS } from "../labelOptions";

// 드롭다운(텍스트 용어)만으로는 실제 알약과 매칭하기 어렵다는 피드백에 따라,
// 모양 실루엣 아이콘을 직접 보고 고르는 그리드로 바꿨다. value/onChange/onClose
// 시그니처는 기존 ShapeSelect(select)와 동일하게 유지해 호출부는 안 건드린다.
export default function ShapePicker({ value, onChange, onClose }) {
  return (
    <OptionPicker
      title="모양을 골라주세요"
      options={SHAPE_OPTIONS}
      value={value}
      onChange={onChange}
      onClose={onClose}
      renderIcon={(code) => <ShapeIcon shape={code} className="option-item-icon" />}
    />
  );
}
