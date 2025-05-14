import * as React from "react";
import { Topic } from "../types/Topic";

type Props = {
  topics?: Topic[];
  sortColumn?: keyof Topic | null;
  sortDirection?: "asc" | "desc";
  onSort: (column: keyof Topic) => void;
  fontSize: string;
};

const TopicsTable: React.FC<Props> = ({ topics, sortColumn, sortDirection, onSort, fontSize }) => {
  const fontSizeStyle = {
    fontSize: fontSize === "small" ? "10pt" : fontSize === "large" ? "14pt" : "12pt",
  };

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
            <tr key={topic.topicCode} className="even:bg-blue-50 odd:bg-white">
              <td className="p-2 border">{topic.topicCode}</td>
              <td className="p-2 border">{topic.topicTitle}</td>
              <td className="p-2 border">
                {(() => {
                  try {
                    return JSON.parse(topic.phaseHierarchy)?.config
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