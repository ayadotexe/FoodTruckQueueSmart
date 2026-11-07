import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./QueueStatus.css";
import { getCurrentUserId } from "../../currentUser";

const PICKUP_LOCATION = "Lot B, near the library"; // mock

const STAGES = [
  { key: "waiting", label: "Waiting" },
  { key: "almost", label: "Almost ready" },
  { key: "served", label: "Served" },
];

const POLL_MS = 5000; // refresh from the backend every 5 seconds

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function QueueStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // backend entry while waiting, else null
  const [ready, setReady] = useState(false); // true = served, ready for pickup
  const [servedItems, setServedItems] = useState([]); // items of the served order
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const userId = encodeURIComponent(getCurrentUserId());
      const res = await fetch(`/api/queue/status/${userId}`);

      if (res.ok) {
        // still waiting in the queue
        setStatus(await res.json());
        setReady(false);
        setError("");
        return;
      }

      if (res.status === 404) {
        // not waiting: check history to see if the order was served
        setStatus(null);
        const histRes = await fetch(`/api/queue/history/${userId}`);
        const history = histRes.ok ? await histRes.json() : [];
        const latest = history[history.length - 1];
        if (latest && latest.status === "served") {
          setReady(true);
          setServedItems(latest.items);
        } else {
          setReady(false);
        }
        setError("");
        return;
      }

      const data = await res.json();
      setError(data.error || "Could not load your queue status.");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // load once, then keep refreshing so the position updates on its own
  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, POLL_MS);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const inQueue = status !== null || ready;
  const position = status ? status.position : null;

  // which of the three stages we're in
  let stage = null;
  if (ready) stage = "served";
  else if (position === 1) stage = "almost";
  else if (status) stage = "waiting";

  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  const orderItems = status ? status.items : servedItems;
  const itemCount = orderItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleLeave = async () => {
    setError("");
    try {
      const res = await fetch(
        `/api/queue/leave/${encodeURIComponent(getCurrentUserId())}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 404) {
        const data = await res.json();
        setError(data.error || "Could not leave the queue.");
        return;
      }
      await loadStatus();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    }
  };

  return (
    <div className="queue-status">
      <header className="status-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← back
        </button>
        <h1>Queue status</h1>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading && <p role="status">Loading...</p>}

      {/* not in a queue */}
      {!loading && !inQueue && (
        <section className="status-card">
          <p className="headline" role="status">Not currently in a queue</p>
          <button type="button" onClick={() => navigate("/menu")}>
            View menu
          </button>
        </section>
      )}

      {!loading && inQueue && (
        <>
          {/* position, wait time, and current status */}
          <section className="status-card" aria-live="polite">
            {stage === "served" && (
              <>
                <p className="headline ready">Your order is ready</p>
                <p className="wait">
                  Pick up at: <strong>{PICKUP_LOCATION}</strong>
                </p>
              </>
            )}
            {stage === "almost" && <p className="headline">You're almost up!</p>}
            {stage === "waiting" && (
              <>
                <p className="label">You are</p>
                <p className="position">{ordinal(position)}</p>
                <p className="label">in line</p>
              </>
            )}

            {stage !== "served" && (
              <p className="wait">
                Estimated wait time:{" "}
                <strong>{status.estimatedWaitMinutes} minutes</strong>
              </p>
            )}
          </section>

          {/* status updates: waiting -> almost ready -> served */}
          <ol className="stages" aria-label="Order progress">
            {STAGES.map((s, i) => (
              <li
                key={s.key}
                className={i < currentIndex ? "done" : i === currentIndex ? "current" : ""}
                aria-current={i === currentIndex ? "step" : undefined}
              >
                <span className="dot" />
                <span className="stage-label">{s.label}</span>
              </li>
            ))}
          </ol>

          {/* queue information */}
          <section className="queue-info" aria-labelledby="info-heading">
            <h2 id="info-heading">Queue information</h2>
            <dl>
              <div>
                <dt>People ahead of you</dt>
                <dd>{ready ? 0 : position - 1}</dd>
              </div>
              <div>
                <dt>Items in your order</dt>
                <dd>{itemCount}</dd>
              </div>
            </dl>
          </section>

          <div className="status-buttons">
            <button type="button" className="outline" onClick={() => navigate("/order")}>
              View Order
            </button>
            <button type="button" onClick={handleLeave} disabled={ready}>
              Leave Queue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default QueueStatus;