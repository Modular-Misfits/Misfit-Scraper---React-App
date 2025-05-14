import { FontSize } from "../types/FontSize";

interface FontSizeToggleProps {
  currentSize: FontSize;
  onChange: (size: FontSize) => void;
}

const FontSizeToggle: React.FC<FontSizeToggleProps> = ({ currentSize, onChange }) => {
  return (
    <div className="flex gap-2 justify-center mb-4">
      <button
        className={`px-4 py-2 rounded ${currentSize === "small" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300"}`}
        onClick={() => onChange("small")}
      >
        Small Font
      </button>
      <button
        className={`px-4 py-2 rounded ${currentSize === "medium" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300"}`}
        onClick={() => onChange("medium")}
      >
        Medium Font
      </button>
      <button
        className={`px-4 py-2 rounded ${currentSize === "large" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300"}`}
        onClick={() => onChange("large")}
      >
        Large Font
      </button>
    </div>
  );
};

export default FontSizeToggle;