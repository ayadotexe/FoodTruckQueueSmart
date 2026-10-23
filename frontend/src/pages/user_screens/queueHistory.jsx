
import { useState, useEffect, useMemo } from "react";
import "./queueHistory.css";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../currentUser";

const ROWS_PER_PAGE = 5;

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

function QueueHistory() {
  const navigate = useNavigate();

  const [queueHistory, setQueueHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Calendar filter state
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadHistory() {
      try {
        const userId = encodeURIComponent(getCurrentUserId());

        const response = await fetch(
          `/api/queue/history/${userId}`
        );

        if (!response.ok) {
          throw new Error("Could not load queue history.");
        }

        const data = await response.json();
        setQueueHistory(data);
        setError("");
      } catch (err) {
        setError(err.message || "Could not load queue history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  // Calculate statistics from real history events.
  const stats = useMemo(() => {
    const joinedEvents = queueHistory.filter(
      (entry) => entry.event === "JOINED"
    );

    return {
      queuesJoined: joinedEvents.length,
      averageWaitTime: "N/A",
      feedback: "N/A",
      averageServeTime: "N/A",
    };
  }, [queueHistory]);

  // Filter history by the selected calendar dates.
  const filteredHistory = useMemo(() => {
    return [...queueHistory]
      .filter((entry) => {
        const eventDate = getLocalDateKey(entry.at);

        if (appliedStart && eventDate < appliedStart) {
          return false;
        }

        if (appliedEnd && eventDate > appliedEnd) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [queueHistory, appliedStart, appliedEnd]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ROWS_PER_PAGE)
  );

  const visibleHistory = filteredHistory.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  function applyFilter() {
    if (startDate && endDate && startDate > endDate) {
      setError("The start date must be before or equal to the end date.");
      return;
    }

    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setCurrentPage(1);
    setError("");
    setShowFilter(false);
  }

  function clearFilter() {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
    setCurrentPage(1);
    setError("");
    setShowFilter(false);
  }

  function getOutcome(event) {
    if (event === "SERVED") return "Fulfilled";
    if (event === "LEFT") return "Left queue";
    if (event === "JOINED") return "Joined";
    return event;
  }

  return (
    <main className="queue-history">
      <header className="queue-history-header">
        <h1>Queue History</h1>

        <div className="header-buttons">
          <button
            type="button"
            className="qback-button"
            onClick={() => navigate("/user-dash")}
          >
            ← Back
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={() => navigate("/")}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Statistics */}
      <section className="queue-history-stats">
        <div className="stat-card">
          <h2>Queues Joined</h2>
          <p>{stats.queuesJoined}</p>
        </div>

        <div className="stat-card">
          <h2>Average Wait Time</h2>
          <p>{stats.averageWaitTime}</p>
        </div>

        <div className="stat-card">
          <h2>Feedback Overall</h2>
          <p>{stats.feedback}</p>
        </div>

        <div className="stat-card">
          <h2>Average Serve Time</h2>
          <p>{stats.averageServeTime}</p>
        </div>
      </section>

      {/* Calendar date filter */}
      <section className="queue-history-filters">
        <button
          type="button"
          className="filter-button"
          onClick={() => setShowFilter((visible) => !visible)}
          aria-expanded={showFilter}
        >
          <span aria-hidden="true">▦</span> Add Filter
        </button>

        {(appliedStart || appliedEnd) && (
          <button
            type="button"
            className="active-filter"
            onClick={clearFilter}
            title="Clear date filter"
          >
            × {appliedStart || "Any date"} – {appliedEnd || "Any date"}
          </button>
        )}

        {showFilter && (
          <div className="date-filter-panel">
            <h2>Filter by date</h2>

            <label htmlFor="history-start-date">
              Start date
            </label>
            <input
              id="history-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />

            <label htmlFor="history-end-date">
              End date
            </label>
            <input
              id="history-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />

            <div className="date-filter-actions">
              <button type="button" onClick={clearFilter}>
                Clear
              </button>
              <button type="button" onClick={applyFilter}>
                Apply Filter
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {/* History table */}
      <section className="history-table">
        <div className="history-header">
          <span>Date</span>
          <span>Event</span>
          <span>Outcome</span>
        </div>

        {loading ? (
          <p>Loading queue history...</p>
        ) : visibleHistory.length === 0 ? (
          <p>
            {queueHistory.length === 0
              ? "No queue history yet."
              : "No history events found for these dates."}
          </p>
        ) : (
          visibleHistory.map((entry, index) => (
            <div
              className="history-row"
              key={`${entry.event}-${entry.at}-${index}`}
            >
              <span>{formatDate(entry.at)}</span>
              <span>{entry.event}</span>
              <span>{getOutcome(entry.event)}</span>
            </div>
          ))
        )}
      </section>

      {/* Pagination */}
      <div className="pagination">
        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.max(page - 1, 1))
          }
          disabled={currentPage === 1}
        >
          &lt; Prev
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.min(page + 1, totalPages))
          }
          disabled={currentPage >= totalPages}
        >
          Next &gt;
        </button>
      </div>
    </main>
  );
}

export default QueueHistory;
