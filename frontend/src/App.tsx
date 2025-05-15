import * as React from "react"; // Retained for consistency if other files use it, though useState/useEffect are directly imported
import { useState, useEffect, useCallback } from "react"; // Added useCallback
import axios from "axios";
import TopicsTable from "./components/TopicsTable";
import PaginationControls from "./components/PaginationControls";
import FilterPanel from "./components/FilterPanel";
import FontSizeToggle from "./components/FontSizeToggle";
import { FontSize } from "./types/FontSize";
import { Topic } from "./types/Topic"; // Assuming Topic includes 'topicCode'
import "./App.css";

// --- MOVED INTERFACES FOR BETTER ORGANIZATION ---
interface ApiTopic {
  topicCode: string; // Assuming this is part of the API response and used as UID
  topicTitle?: string;
  phaseHierarchy?: string;
  component?: string;
  program?: string;
  topicStatus?: string;
  solicitationTitle?: string;
  topicManagers?: { name?: string; email?: string; phone?: string }[];
  technologyAreas?: string[];
  modernizationPriorities?: string[];
  // Add any other fields that come directly from the API topic object
}

interface DynamicFilters {
  programs: string[];
  components: string[];
  topic_statuses: string[];
  technology_areas: string[];
  modernization_priorities: string[];
  solicitations: string[];
}
// --- END MOVED INTERFACES ---

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filters, setFilters] = useState<DynamicFilters | null>(null); // Used DynamicFilters type here
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fontSize, setFontSize] = useState<FontSize>("small");
  const [showFilters, setShowFilters] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // --- INSERTION: State for selected topic codes for PDF download ---
  const [selectedTopicCodesForDownload, setSelectedTopicCodesForDownload] = useState<Set<string>>(new Set());
  // --- END INSERTION ---

  const BASE_API = "https://www.dodsbirsttr.mil/topics/api/public/topics/search";
  // --- INSERTION: PDF Download API Template ---
  // IMPORTANT: This uses "{topic_uid}". Ensure `topicCode` (which is used for selection)
  // is the correct identifier for this API endpoint. If the API expects a different `uid` field,
  // you'll need to adjust what's stored in `selectedTopicCodesForDownload` or how it's used here.
  const PDF_API_TEMPLATE = "https://www.dodsbirsttr.mil/topics/api/public/topics/{topic_uid}/download/PDF";
  // --- END INSERTION ---


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
      const apiTopics: ApiTopic[] = res.data.data || []; // Used ApiTopic[] type

      const transformedTopics: Topic[] = apiTopics.map((topic: ApiTopic) => ({
        topicCode: topic.topicCode, // Critical for selection and potentially PDF UID
        topicTitle: topic.topicTitle || "N/A",
        phaseHierarchy: topic.phaseHierarchy || "",
        component: topic.component || "N/A",
        program: topic.program || "N/A",
        topicStatus: topic.topicStatus || "N/A",
        solicitationTitle: topic.solicitationTitle || "N/A",
        topicManagers: topic.topicManagers || [],
        // Ensure all fields expected by your Topic type are mapped
      }));

      setTopics(transformedTopics);

      // Logic for dynamicFilters, using the moved interface definitions
      // This derives filters from the current page of topics.
      const dynamicFiltersData: DynamicFilters = {
        programs: [...new Set(apiTopics.map((t) => t.program).filter((v): v is string => typeof v === "string" && !!v))],
        components: [...new Set(apiTopics.map((t) => t.component).filter((v): v is string => typeof v === "string" && !!v))],
        topic_statuses: [...new Set(apiTopics.map((t) => t.topicStatus).filter((v): v is string => typeof v === "string" && !!v))],
        technology_areas: [...new Set(apiTopics.flatMap((t) => t.technologyAreas || []).filter((v): v is string => typeof v === "string" && !!v))],
        modernization_priorities: [...new Set(apiTopics.flatMap((t) => t.modernizationPriorities || []).filter((v): v is string => typeof v === "string" && !!v))],
        solicitations: [...new Set(apiTopics.map((t) => t.solicitationTitle).filter((v): v is string => typeof v === "string" && !!v))],
      };

      // Only update filters if it's the first load or if you intend them to be dynamic per page
      // For more stable filters, consider fetching them once from a dedicated endpoint or a broader query
      if (page === 0 && !filters) { // Example condition: load filters only on initial fetch
         setFilters(dynamicFiltersData);
      } else if (!filters) { // Fallback if filters are still null
         setFilters(dynamicFiltersData);
      }
      // If you want filters to update with every fetch based on current results:
      // setFilters(dynamicFiltersData);


      setTotalPages(Math.ceil(res.data.total / rowsPerPage));
    } catch (error) {
      console.error("Error fetching topics:", error);
      // Potentially set an error state here to show to the user
    }
  };

  useEffect(() => {
    fetchTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, page, searchTerm, rowsPerPage]); // Assuming fetchTopics is stable or wrapped in useCallback if it were a dependency

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
    // (Your existing CSV export logic is good)
    const headers = [
      "Topic Code", "Title", "Phase", "Component", "Program",
      "Status", "Solicitation", "TPOC Name", "TPOC Email", "TPOC Phone",
    ];
    const rows = topics.map((topic) => {
      let phaseDisplay = "N/A";
      try {
        if (topic.phaseHierarchy) { // Check if phaseHierarchy is not empty or undefined
          const parsedPhase = JSON.parse(topic.phaseHierarchy);
          phaseDisplay = parsedPhase?.config?.map((phase: any) => phase.displayValue).join(", ") || "N/A";
        }
      } catch { /* Keep N/A on error */ }
      return [
        topic.topicCode, topic.topicTitle, phaseDisplay, topic.component, topic.program,
        topic.topicStatus, topic.solicitationTitle,
        topic.topicManagers?.[0]?.name || "N/A",
        topic.topicManagers?.[0]?.email || "N/A",
        topic.topicManagers?.[0]?.phone || "N/A",
      ].map(cell => `"${String(cell === undefined || cell === null ? '' : cell).replace(/"/g, '""')}"`); // Added robust cell stringification and quote escaping
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "topics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- INSERTION: Callback to receive selected topic codes from TopicsTable ---
  const handleSelectionChange = useCallback((selectedCodes: Set<string>) => {
    setSelectedTopicCodesForDownload(selectedCodes);
  }, []);
  // --- END INSERTION ---

  // --- INSERTION: Function to handle PDF downloads ---
  const handleDownloadPdfs = () => {
    if (selectedTopicCodesForDownload.size === 0) {
      alert("Please select at least one topic to download its PDF.");
      return;
    }

    selectedTopicCodesForDownload.forEach(topicCode => { // Assuming topicCode is the {topic_uid}
      const pdfUrl = PDF_API_TEMPLATE.replace("{topic_uid}", topicCode);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', `${topicCode}.pdf`); // Attempt to suggest filename
      link.setAttribute('target', '_blank'); // Important for opening in new tab
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Note: Browsers might block multiple rapid popups.
    });
  };
  // --- END INSERTION ---

  return (
    <div className={`min-h-screen bg-[#355e93] text-white text-${fontSize} relative`}>
      <div className="flex justify-between items-center px-6 py-4 absolute w-full top-0 z-10"> {/* Added z-index */}
        <div> {/* Grouped left buttons */}
          <button
            onClick={exportToCSV}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 mr-2" // Added margin
          >
            Export CSV
          </button>
          {/* --- INSERTION: "Download PDFs" button --- */}
          <button
            onClick={handleDownloadPdfs}
            disabled={selectedTopicCodesForDownload.size === 0}
            className="bg-green-500 hover:bg-green-700 text-black px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download PDFs ({selectedTopicCodesForDownload.size})
          </button>
          {/* --- END INSERTION --- */}
        </div>
        <FontSizeToggle
          currentSize={fontSize}
          onChange={(size) => setFontSize(size)}
        />
      </div>

      <h1 className="text-center text-3xl pt-20 pb-4">DoD SBIR Topic Search</h1> {/* Added padding top */}

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
          onClick={() => fetchTopics()} // Explicit fetch on button click
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
          onApply={fetchTopics} // Re-fetch topics when filters are applied
          fontSize={fontSize}
        />
      )}

      <TopicsTable
        topics={topics}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        fontSize={fontSize}
        // --- INSERTION: Pass selection change handler to TopicsTable ---
        onSelectionChange={handleSelectionChange}
        // --- END INSERTION ---
      />

      <div className="flex justify-between items-center mt-4 pb-4 px-2"> {/* Added padding bottom and horizontal */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage} // setPage will trigger useEffect to fetch new page data
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
              const newRowsPerPage = Number(e.target.value);
              setRowsPerPage(newRowsPerPage);
              setPage(0); // Reset to first page
              // fetchTopics(); // useEffect will handle this due to rowsPerPage change
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
