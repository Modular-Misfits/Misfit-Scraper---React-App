import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import TopicsTable from "./components/TopicsTable";
import PaginationControls from "./components/PaginationControls";
import FilterPanel from "./components/FilterPanel";
import FontSizeToggle from "./components/FontSizeToggle";
import { FontSize } from "./types/FontSize";
import { Topic } from "./types/Topic"; // Ensure Topic includes topicId: string;
import "./App.css";

// Interface for the raw data structure of a topic from the API
interface ApiTopicForFetch {
  topicCode: string;
  topicId: string; // Crucial for PDF downloads - ensure API provides this
  topicTitle?: string;
  phaseHierarchy?: string;
  component?: string;
  program?: string;
  topicStatus?: string;
  solicitationTitle?: string;
  topicManagers?: any[]; // Consider defining a stricter type if possible
  technologyAreas?: string[]; // Assumed to be an array of strings from API
  modernizationPriorities?: string[]; // Assumed to be an array of strings from API
}

// Interface for the structure of the dynamic filter options
interface DynamicFiltersData {
  programs: string[];
  components: string[];
  topic_statuses: string[];
  technology_areas: string[];
  modernization_priorities: string[];
  solicitations: string[];
}

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filters, setFilters] = useState<DynamicFiltersData | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fontSize, setFontSize] = useState<FontSize>("small");
  const [showFilters, setShowFilters] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedTopicIdsForDownload, setSelectedTopicIdsForDownload] = useState<Set<string>>(new Set());

  const BASE_API = "https://www.dodsbirsttr.mil/topics/api/public/topics/search";

  const fetchTopics = async () => {
    const formattedFilters = Object.fromEntries(
      Object.entries(selected).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : value,
      ])
    );

    const params: Record<string, any> = {
      size: rowsPerPage,
      page,
      q: searchTerm || "",
      ...formattedFilters,
    };

    try {
      const res = await axios.get(BASE_API, { params });
      const apiTopics: ApiTopicForFetch[] = res.data.data || [];

      const transformedTopics: Topic[] = apiTopics.map((topic: ApiTopicForFetch) => ({
        topicCode: topic.topicCode,
        topicId: topic.topicId,
        topicTitle: topic.topicTitle || "N/A",
        phaseHierarchy: topic.phaseHierarchy || "",
        component: topic.component || "N/A",
        program: topic.program || "N/A",
        topicStatus: topic.topicStatus || "N/A",
        solicitationTitle: topic.solicitationTitle || "N/A",
        topicManagers: topic.topicManagers || [],
      }));

      setTopics(transformedTopics);

      // Helper type guard to filter out undefined/null and empty/whitespace-only strings
      const isNonEmptyString = (v: string | undefined | null): v is string => 
        typeof v === "string" && v.trim() !== "";

      // Create arrays of definite strings first from the current batch of apiTopics
      const currentBatchPrograms: string[] = apiTopics
        .map(t => t.program)
        .filter(isNonEmptyString);
      const currentBatchComponents: string[] = apiTopics
        .map(t => t.component)
        .filter(isNonEmptyString);
      const currentBatchTopicStatuses: string[] = apiTopics
        .map(t => t.topicStatus)
        .filter(isNonEmptyString);
      const currentBatchTechAreas: string[] = apiTopics
        .flatMap(t => t.technologyAreas || []) // Assumes t.technologyAreas is string[] or undefined
        .filter(isNonEmptyString);
      const currentBatchModPriorities: string[] = apiTopics
        .flatMap(t => t.modernizationPriorities || []) // Assumes t.modernizationPriorities is string[] or undefined
        .filter(isNonEmptyString);
      const currentBatchSolicitations: string[] = apiTopics
        .map(t => t.solicitationTitle)
        .filter(isNonEmptyString);
      
      // Update filters by merging new options with existing ones
      setFilters(prevFilters => {
        const newPrograms = new Set([...(prevFilters?.programs || []), ...currentBatchPrograms]);
        const newComponents = new Set([...(prevFilters?.components || []), ...currentBatchComponents]);
        const newTopicStatuses = new Set([...(prevFilters?.topic_statuses || []), ...currentBatchTopicStatuses]);
        const newTechAreas = new Set([...(prevFilters?.technology_areas || []), ...currentBatchTechAreas]);
        const newModPriorities = new Set([...(prevFilters?.modernization_priorities || []), ...currentBatchModPriorities]);
        const newSolicitations = new Set([...(prevFilters?.solicitations || []), ...currentBatchSolicitations]);

        return {
          programs: Array.from(newPrograms).sort(),
          components: Array.from(newComponents).sort(),
          topic_statuses: Array.from(newTopicStatuses).sort(),
          technology_areas: Array.from(newTechAreas).sort(),
          modernization_priorities: Array.from(newModPriorities).sort(),
          solicitations: Array.from(newSolicitations).sort(),
        };
      });
      
      setTotalPages(Math.ceil(res.data.total / rowsPerPage));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, page, searchTerm, rowsPerPage]);

  const handleSort = (column: keyof Topic) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    if (topics.length === 0) {
      alert("No topics available to export.");
      return;
    }
    const headers = [
      "Topic Code", "Topic ID", "Title", "Phase", "Component", "Program", 
      "Status", "Solicitation", "TPOC Name", "TPOC Email", "TPOC Phone",
    ];
    const rows = topics.map((topic) => {
      let phaseDisplay = "N/A";
      try {
        if (topic.phaseHierarchy && typeof topic.phaseHierarchy === 'string') {
          const parsedPhase = JSON.parse(topic.phaseHierarchy);
          phaseDisplay = parsedPhase?.config?.map((phase: any) => phase.displayValue).join(", ") || "N/A";
        }
      } catch { /* Keep N/A */ }
      
      const sanitizeCell = (cellData: any): string => {
        const str = String(cellData === undefined || cellData === null ? '' : cellData);
        return `"${str.replace(/"/g, '""')}"`;
      };

      return [
        sanitizeCell(topic.topicCode),
        sanitizeCell(topic.topicId),
        sanitizeCell(topic.topicTitle),
        sanitizeCell(phaseDisplay),
        sanitizeCell(topic.component),
        sanitizeCell(topic.program),
        sanitizeCell(topic.topicStatus),
        sanitizeCell(topic.solicitationTitle),
        sanitizeCell(topic.topicManagers?.[0]?.name),
        sanitizeCell(topic.topicManagers?.[0]?.email),
        sanitizeCell(topic.topicManagers?.[0]?.phone),
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "topics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectionChange = useCallback((selectedIds: Set<string>) => {
    setSelectedTopicIdsForDownload(selectedIds);
  }, []);

  const handleDownloadPdfs = () => {
    if (selectedTopicIdsForDownload.size === 0) {
      alert("Please select at least one topic to download its PDF.");
      return;
    }
    selectedTopicIdsForDownload.forEach(topicId => {
      const downloadUrl = `/api/download_pdf/${topicId}`;
      window.open(downloadUrl, '_blank');
    });
  };

  return (
    <div className={`min-h-screen bg-[#355e93] text-white text-${fontSize} relative`}>
      <div className="flex justify-between items-center px-6 py-4 absolute w-full top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={exportToCSV}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 mr-3"
          >
            Export CSV
          </button>
          <button
            onClick={handleDownloadPdfs}
            disabled={selectedTopicIdsForDownload.size === 0}
            className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download PDFs ({selectedTopicIdsForDownload.size})
          </button>
        </div>
        <FontSizeToggle
          currentSize={fontSize}
          onChange={(size) => setFontSize(size)}
        />
      </div>

      <h1 className="text-center text-3xl pt-20 pb-4">DoD SBIR Topic Search</h1>

      <div className="flex justify-center my-4">
        <input
          type="text"
          placeholder="Enter search term"
          value={searchTerm}
          onChange={(e) => {
            setPage(0);
            setSearchTerm(e.target.value);
          }}
          className="px-4 py-2 text-black rounded w-[300px]"
        />
        <button
          onClick={() => fetchTopics()}
          className="ml-2 px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
        >
          Search
        </button>
      </div>

      <div className="text-center mb-4">
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="bg-gray-800 text-yellow-400 px-4 py-2 rounded hover:bg-gray-600"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && filters && (
        <FilterPanel
          programs={filters.programs}
          components={filters.components}
          topicStatuses={filters.topic_statuses}
          technologyAreas={filters.technology_areas}
          modernizationPriorities={filters.modernization_priorities}
          solicitations={filters.solicitations}
          selectedFilters={selected}
          onFilterChange={(name, values) => {
            setPage(0);
            setSelected((prev) => ({ ...prev, [name]: values }));
          }}
          onApply={fetchTopics}
          fontSize={fontSize}
        />
      )}

      <TopicsTable
        topics={topics}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        fontSize={fontSize}
        onSelectionChange={handleSelectionChange}
      />

      <div className="flex justify-between items-center mt-4 px-4 pb-4">
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          fontSize={fontSize}
        />
        <div className="flex items-center">
          <label htmlFor="rowsPerPage" className="mr-2 text-sm">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="px-2 py-1 border rounded text-black"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default App;
