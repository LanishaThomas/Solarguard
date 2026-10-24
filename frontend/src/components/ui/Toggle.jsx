/**
 * Accessible toggle switch.
 * Props: checked (bool), onChange (fn), label (string), disabled (bool)
 */
export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-green-600' : 'bg-[#2a3f30]'}`} />
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
    </label>
  )
}
