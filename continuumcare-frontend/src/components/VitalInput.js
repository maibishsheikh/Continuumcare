const VitalInput = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  unit,
  placeholder,
  maxDigits = 3
}) => {
  const handleChange = (e) => {
    const val = e.target.value;

    // Allow clearing while typing
    if (val === "") {
      onChange(e);
      return;
    }

    // Digits only
    if (!/^\d+$/.test(val)) return;

    // Max digits
    if (val.length > maxDigits) return;

    onChange(e);
  };

  const handleBlur = () => {
    if (value === "") return;

    let num = Number(value);

    if (Number.isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;

    onChange({
      target: {
        name,
        value: String(num)
      }
    });
  };

  const numeric = Number(value);
  const invalid =
    value !== "" && (numeric < min || numeric > max);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          name={name}
          value={value}
          placeholder={placeholder}
          required
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-5 py-3.5 rounded-xl border-2 transition
            focus:outline-none focus:ring-4
            ${
              invalid
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
            }`}
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600">
          {unit}
        </span>
      </div>

      <div className="mt-1 flex justify-between text-xs">
        <span className="text-gray-500">
          Range: {min} – {max}
        </span>
        {invalid && (
          <span className="text-red-600 font-semibold">
            Auto-corrected
          </span>
        )}
      </div>
    </div>
  );
};

export default VitalInput;
