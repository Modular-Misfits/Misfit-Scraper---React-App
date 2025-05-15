import * as React from "react";
import { Topic } from "../types/Topic";

type Props = {
  topics?: Topic[];
  sortColumn?: keyof Topic | null;
  sortDirection?: "asc" | "desc";
  onSort: (column: keyof Topic) => void;
  fontSize: string;
  // INSERTION: Callback to notify parent component of selected topic codes
  onSelectionChange?: (selectedTopicCodes: Set<string>) => void;
};

const TopicsTable: React.FC<Props> = ({
  topics,
  sortColumn,
  sortDirection,
  onSort,
  fontSize,
  // INSERTION: Destructure the new prop
  onSelectionChange,
}) => {
  const fontSizeStyle = {
    fontSize: fontSize === "small" ? "10pt" : fontSize === "large" ? "14pt" : "12pt",
  };

  // --- INSERTION: State for selected topic codes ---
  const [selectedTopicCodes, setSelectedTopicCodes] = React.useState<Set<string>>(new Set());
  // --- END INSERTION ---

  // --- INSERTION: Effect to clear selections when topics list changes ---
  React.useEffect(() => {
    const newSelection = new Set<string>();
    setSelectedTopicCodes(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [topics, onSelectionChange]); // Added onSelectionChange to dependency array
  // --- END INSERTION ---

  // --- INSERTION: Determine if all current topics are selected ---
  const areAllCurrentTopicsSelected = React.useMemo(() => {
    if (!topics || topics.length === 0) {
      return false;
    }
    return topics.every(topic => selectedTopicCodes.has(topic.topicCode));
  }, [topics, selectedTopicCodes]);
  // --- END INSERTION ---

  // --- INSERTION: Handler for "Select All" checkbox change ---
  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedTopicCodes = new Set<string>();
    if (event.target.checked && topics) {
      topics.forEach(topic => newSelectedTopicCodes.add(topic.topicCode));
    }
    setSelectedTopicCodes(newSelectedTopicCodes);
    if (onSelectionChange) {
      onSelectionChange(newSelectedTopicCodes);
    }
  };
  // --- END INSERTION ---

  // --- INSERTION: Handler for individual topic row checkbox change ---
  const handleRowSelectChange = (topicCode: string, isSelected: boolean) => {
    const newSelectedTopicCodes = new Set(selectedTopicCodes);
    if (isSelected) {
      newSelectedTopicCodes.add(topicCode);
    } else {
      newSelectedTopicCodes.delete(topicCode);
    }
    setSelectedTopicCodes(newSelectedTopicCodes);
    if (onSelectionChange) {
      onSelectionChange(newSelectedTopicCodes);
    }
  };
  // --- END INSERTION ---

  if (!Array.isArray(topics) || topics.length === 0) {
    return (
      <div style={fontSizeStyle} className="text-center text-gray-300 mt-6">
        No topics found.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <table style={fontSizeStyle} className="w-full mt-6 text-black border-collapse">
        <thead>
          <tr className="bg-gray-700 text-white">
            {/* --- INSERTION: Checkbox for "Select All" --- */}
            <th className="p-2 border">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                aria-label="Select all topics on this page"
                checked={areAllCurrentTopicsSelected}
                onChange={handleSelectAllChange}
                disabled={!topics || topics.length === 0}
              />
            </th>
            {/* --- END INSERTION --- */}
            <th className="p-2 border cursor-pointer" onClick={() => onSort("topicCode")}>
              Topic Code {sortColumn === "topicCode" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-2 border cursor-pointer" onClick={() => onSort("topicTitle")}>
              Title {sortColumn === "topicTitle" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-2 border">Phase</th>
            <th className="p-2 border cursor-pointer" onClick={() => onSort("component")}>
              Component {sortColumn === "component" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-2 border cursor-pointer" onClick={() => onSort("program")}>
              Program {sortColumn === "program" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-2 border cursor-pointer" onClick={() => onSort("topicStatus")}>
              Status {sortColumn === "topicStatus" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="p-2 border">Solicitation</th>
            <th className="p-2 border">TPOC Name</th>
            <th className="p-2 border">TPOC Email</th>
            <th className="p-2 border">TPOC Phone</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr key={topic.topicCode} className={`even:bg-blue-50 odd:bg-white ${selectedTopicCodes.has(topic.topicCode) ? 'bg-blue-200' : ''}`}> {/* Optional: highlight selected row */}
              {/* --- INSERTION: Checkbox for individual row selection --- */}
              <td className="p-2 border">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  aria-label={`Select topic ${topic.topicTitle}`}
                  checked={selectedTopicCodes.has(topic.topicCode)}
                  onChange={(e) => handleRowSelectChange(topic.topicCode, e.target.checked)}
                />
              </td>
              {/* --- END INSERTION --- */}
              <td className="p-2 border">{topic.topicCode}</td>
              <td className="p-2 border">{topic.topicTitle}</td>
              <td className="p-2 border">
                {(() => {
                  try {
                    // Ensure topic.phaseHierarchy is a string before parsing
                    const phaseHierarchyString = typeof topic.phaseHierarchy === 'string' ? topic.phaseHierarchy : null;
                    if (!phaseHierarchyString) return "N/A";

                    const parsed = JSON.parse(phaseHierarchyString);
                    return parsed?.config
                      ?.map((phase: any) => phase.displayValue)
                      .join(", ");
                  } catch {
                    return "N/A";
                  }
                })()}
              </td>
              <td className="p-2 border">{topic.component}</td>
              <td className="p-2 border">{topic.program}</td>
              <td className="p-2 border">{topic.topicStatus}</td>
              <td className="p-2 border">{topic.solicitationTitle}</td>
              <td className="p-2 border">{topic.topicManagers?.[0]?.name || "N/A"}</td>
              <td className="p-2 border">{topic.topicManagers?.[0]?.email || "N/A"}</td>
              <td className="p-2 border">{topic.topicManagers?.[0]?.phone || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopicsTable;
