import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import TopicsTable from "./components/TopicsTable";
import PaginationControls from "./components/PaginationControls";
import FilterPanel from "./components/FilterPanel";
import FontSizeToggle from "./components/FontSizeToggle";
import { FontSize } from "./types/FontSize";
import { Topic } from "./types/Topic";
import "./App.css";

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filters, setFilters] = useState<{
    programs: string[];
    components: string[];
    topic_statuses: string[];
    technology_areas: string[];
    modernization_priorities: string[];
    solicitations: string[];
  } | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fontSize, setFontSize] = useState<FontSize>("small");
  const [showFilters, setShowFilters] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      const apiTopics = res.data.data || [];

      const transformedTopics: Topic[] = apiTopics.map((topic: any) => ({
        topicCode: topic.topicCode,
        topicTitle: topic.topicTitle,
        phaseHierarchy: topic.phaseHierarchy,
        component: topic.component,
        program: topic.program,
        topicStatus: topic.topicStatus,
        solicitationTitle: topic.solicitationTitle,
        topicManagers: topic.topicManagers || [],
      }));

      setTopics(transformedTopics);

      interface DynamicFilters {
        programs: string[];
        components: string[];
        topic_statuses: string[];
        technology_areas: string[];
        modernization_priorities: string[];
        solicitations: string[];
      }

      interface ApiTopic {
        program?: string;
        component?: string;
        topicStatus?: string;
        technologyAreas?: string[];
        modernizationPriorities?: string[];
        solicitationTitle?: string;
      }
      

      const dynamicFilters: DynamicFilters = {
        programs: [...new Set(apiTopics.map((t: ApiTopic) => t.program).filter((v: string): v is string => typeof v === "string" && !!v))],
        components: [...new Set(apiTopics.map((t: ApiTopic) => t.component).filter((v: string): v is string => typeof v === "string" && !!v))],
        topic_statuses: [...new Set(apiTopics.map((t: ApiTopic) => t.topicStatus).filter((v: string): v is string => typeof v === "string" && !!v))],
        technology_areas: [...new Set(apiTopics.flatMap((t: ApiTopic) => t.technologyAreas || []).filter((v: string): v is string => typeof v === "string" && !!v))],
        modernization_priorities: [...new Set(apiTopics.flatMap((t: ApiTopic) => t.modernizationPriorities || []).filter((v: string): v is string => typeof v === "string" && !!v))],
        solicitations: [...new Set(apiTopics.map((t: ApiTopic) => t.solicitationTitle).filter((v: string): v is string => typeof v === "string" && !!v))],
      };



      setFilters(dynamicFilters);
      setTotalPages(Math.ceil(res.data.total / rowsPerPage));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
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
      "Topic Code",
      "Title",
      "Phase",
      "Component",
      "Program",
      "Status",
      "Solicitation",
      "TPOC Name",
      "TPOC Email",
      "TPOC Phone",
    ];

    const rows = topics.map((topic) => [
      topic.topicCode,
      topic.topicTitle,
      (() => {
        try {
          return JSON.parse(topic.phaseHierarchy)?.config
            ?.map((phase: any) => phase.displayValue)
            .join(", ");
        } catch {
          return "N/A";
        }
      })(),
      topic.component,
      topic.program,
      topic.topicStatus,
      topic.solicitationTitle,
      topic.topicManagers?.[0]?.name || "N/A",
      topic.topicManagers?.[0]?.email || "N/A",
      topic.topicManagers?.[0]?.phone || "N/A",
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "topics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen bg-[#355e93] text-white text-${fontSize} relative`}>
      <div className="flex justify-between items-center px-6 py-4 absolute w-full top-0">
        <button
          onClick={exportToCSV}
          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
        >
          Export CSV
        </button>
        <FontSizeToggle
          currentSize={fontSize}
          onChange={(size) => setFontSize(size)}
        />
      </div>

      <h1 className="text-center text-3xl mt-4">DoD SBIR Topic Search</h1>

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
      />

      <div className="flex justify-between items-center mt-4">
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
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
              fetchTopics();
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
