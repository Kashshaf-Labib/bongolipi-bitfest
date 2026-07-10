interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Switch = ({ checked, onChange }:SwitchProps) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <div className="flex items-center gap-2">
      <span>Publish</span>
      <div
        onClick={handleToggle}
        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-5 h-5 rounded-full shadow-md transform ${
            checked ? "translate-x-6" : "translate-x-0"
          } transition`}
        ></div>
      </div>
    </div>
  );
};

export default Switch;
