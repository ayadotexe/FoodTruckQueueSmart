import { useState } from "react";
import "./queueHistory.css";
import { useNavigate } from "react-router-dom";

const queueHistory = [
  {
    date: "9/1/26",
    order: "tacos shrimp, drink",
    outcome: "Fulfilled",
  },
  {
    date: "9/5/26",
    order: "elote, drink",
    outcome: "Cancelled",
  },
  {
    date: "9/11/26",
    order: "burrito asada, drink",
    outcome: "Fulfilled",
  },
  {
    date: "9/16/26",
    order: "quesadilla chicken, drink",
    outcome: "No Show",
  },
  {
    date: "9/19/26",
    order: "enchilada al pastor, drink",
    outcome: "No Show",
  },
  {
    date: "9/20/26",
    order: "nacho chorizo, drink",
    outcome: "Fulfilled",
  },
  {
    date: "9/25/26",
    order: "churro, horchata",
    outcome: "Fulfilled",
  },
];

function QueueHistory() {
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();   

  const stats = {
    queuesJoined: 15,
    averageWaitTime: "5 min",
    feedback: "Good",
    averageServeTime: "2 min",
  };

  return (
    <main className="queue-history">

      {/* Header */}
      <header className="queue-history-header">
        <h1>Queue History</h1>

        <button className="logout-button" onClick={() => navigate("/")}>
          Log Out
        </button>
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

      {/* Filters */}
      <section className="queue-history-filters">

        <button className="filter-button">
          + Add Filter
        </button>

        <button className="active-filter">
          × 9/1/26-9/25/26
        </button>

      </section>

      {/* History Table */}
      <section className="history-table">

        <div className="history-header">
          <span>Date</span>
          <span>Order</span>
          <span>Outcome</span>
        </div>

        {queueHistory.map((queue, index) => (
          <div className="history-row" key={index}>
            <span>{queue.date}</span>
            <span>{queue.order}</span>
            <span>{queue.outcome}</span>
          </div>
        ))}

      </section>

      {/* Pagination */}
      <div className="pagination">

        <button
          onClick={() =>
            setCurrentPage((page) => Math.max(page - 1, 1))
          }
          disabled={currentPage === 1}
        >
          &lt; Prev
        </button>

        <button
          onClick={() =>
            setCurrentPage((page) => page + 1)
          }
        >
          Next &gt;
        </button>

      </div>

    </main>
  );
}

export default QueueHistory;