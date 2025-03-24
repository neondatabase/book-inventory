"use client";

import { useState } from "react";

export function LoadComparisons() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>();
  const [showPopup, setShowPopup] = useState(false);

  const fetchComparisons = async () => {
    setResults([]);
    setLoading(true);
    try {
      const response = await fetch("/perf", {
        method: "POST",
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching comparisons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    setShowPopup(true);
    fetchComparisons();
  };

  return (
    <div>
      <button
        onClick={handleButtonClick}
        className="mb-4 text-sm text-gray-600 max-w-max border-b hover:border-black"
      >
        See performance comparison with ts_vector
      </button>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl max-h-[50vh] overflow-auto text-sm">
            {loading && (
              <table className="animate-pulse text-gray-600">
                Loading performance comparisons...
              </table>
            )}
            {results && results.length > 0 && (
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300">
                      Query (pg_search)
                    </th>
                    <th className="border border-gray-300">Time (ms)</th>
                    <th className="border border-gray-300">
                      Query (ts_vector)
                    </th>
                    <th className="border border-gray-300">Time (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const { query, executionPlanningTime } = result;
                    return index % 2 === 0 ? (
                      <tr key={index}>
                        <td className="border border-gray-300">{query}</td>
                        <td className="border border-gray-300">
                          {executionPlanningTime.join("\n")}
                        </td>
                        <td className="border border-gray-300">
                          {results[index + 1].query}
                        </td>
                        <td className="border border-gray-300">
                          {results[index + 1].executionPlanningTime.join("\n")}
                        </td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            )}
            <button
              className="mt-4 text-sm text-gray-600 border border-gray-300 rounded p-2"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
