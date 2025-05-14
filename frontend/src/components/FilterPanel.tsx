import * as React from "react";

type FilterPanelProps = {
  programs: string[];
  components: string[];
  topicStatuses: string[];
  technologyAreas: string[];
  modernizationPriorities: string[];
  solicitations: string[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterName: string, values: string[]) => void;
  onApply: () => void;
  fontSize: string; // Maintain fontSize functionality
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  programs = [],
  components = [],
  topicStatuses = [],
  technologyAreas = [],
  modernizationPriorities = [],
  solicitations = [],
  selectedFilters = {},
  onFilterChange,
  onApply,
  fontSize,
}) => {
  // Helper function to render a multi-select dropdown
  const renderSelect = (
    label: string,
    name: keyof FilterPanelProps["selectedFilters"],
    options: string[],
    selected: string[] = []
  ) => (
    <div className="flex flex-col items-start flex-1 min-w-[180px]">
      <label htmlFor={name} className="font-bold mb-1">
        {label}
      </label>
      <select
        id={name}
        multiple
        value={selected}
        onChange={(e) =>
          onFilterChange(
            name,
            Array.from(e.target.selectedOptions, (opt) => opt.value)
          )
        }
        className="w-full h-[100px] text-black p-1 rounded"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {/* Render filter dropdowns */}
      <div className={`flex flex-wrap justify-center gap-4 px-4 mt-6 ${fontSize}`}>
        {renderSelect("Program", "programs", programs, selectedFilters.programs || [])}
        {renderSelect("Component", "components", components, selectedFilters.components || [])}
        {renderSelect("Technology Areas", "technologyAreas", technologyAreas, selectedFilters.technologyAreas || [])}
        {renderSelect(
          "Modernization Priorities",
          "modernizationPriorities",
          modernizationPriorities,
          selectedFilters.modernizationPriorities || []
        )}
        {renderSelect("Solicitation", "solicitations", solicitations, selectedFilters.solicitations || [])}
        {renderSelect("Topic Status", "topicStatuses", topicStatuses, selectedFilters.topicStatuses || [])}
      </div>

      {/* Apply Filters button */}
      <div className="text-center mt-4">
        <button
          onClick={onApply}
          className="bg-yellow-500 text-black px-6 py-2 rounded hover:bg-yellow-600 transition"
        >
          Apply Filters
        </button>
      </div>
    </>
  );
};

export default FilterPanel;