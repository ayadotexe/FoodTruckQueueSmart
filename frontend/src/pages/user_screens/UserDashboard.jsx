import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";
import NotificationBanner from "./notificationBanner";
import { CURRENT_USER_ID } from "../../currentUser";

// mock data for the truck (pickup info and now serving belong to other modules)
const MOCK_TRUCK = {
  orderingOpen: true,
  location: "Lot B, near the library",
  hours: "11:00 AM - 8:00 PM",
  nowServing: 42,
};

const MOCK_NOTIFICATIONS = [
  "Your order is being prepared.",
  "You are getting close to the front of the queue!",
];

const POLL_MS = 5000; // refresh from the backend every 5 seconds

const ordinal = (n) => {
  // turns 1 into 1st, 2 into 2nd, 3 into 3rd, etc.
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function UserDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null); // { count, estimatedWaitMinutes }
  const [myStatus, setMyStatus] = useState(null); // backend entry while waiting, else null
  const [served, setServed] = useState(false); // true = order is ready
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const userId = encodeURIComponent(CURRENT_USER_ID);

      // truck-wide numbers
      const sumRes = await fetch("/api/queue/summary");
      if (sumRes.ok) setSummary(await sumRes.json());

      // this user's own status
      const res = await fetch(`/api/queue/status/${userId}`);
      if (res.ok) {
        setMyStatus(await res.json());
        setServed(false);
      } else if (res.status === 404) {
        // not waiting: check history to see if the order was served
        setMyStatus(null);
        const histRes = await fetch(`/api/queue/history/${userId}`);
        const history = histRes.ok ? await histRes.json() : [];
        const latest = history[history.length - 1];
        setServed(Boolean(latest && latest.status === "served"));
      }
      setError("");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    }
  }, []);

  // load once, then keep refreshing so the numbers update on their own
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, POLL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  const inQueue = myStatus !== null;
  const position = myStatus ? myStatus.position : null;

  let status = "Not currently in a queue";
  if (served) status = "Your order is ready";
  else if (position === 1) status = "You're almost up!";
  else if (inQueue) status = `You are ${ordinal(position)} in line`;

  const handleLeave = async () => {
    setError("");
    try {
      const res = await fetch(
        `/api/queue/leave/${encodeURIComponent(CURRENT_USER_ID)}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 404) {
        const data = await res.json();
        setError(data.error || "Could not leave the queue.");
        return;
      }
      await loadData();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    }
  };

  return (
    <div className="dashboard">

      {/*<NotificationBanner message="You're getting close to the front of the queue!" />*/}

      <header className="dashboard-header">
        <h1>Welcome back!</h1>
        <p className="truck-wait">
          {summary ? (
            <>
              {summary.count} {summary.count === 1 ? "person" : "people"} in line &middot; current wait:{" "}
              <strong>{summary.estimatedWaitMinutes} minutes</strong>
            </>
          ) : (
            "Checking the line..."
          )}
        </p>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {/* your order status */}
      <section className="queue-card" aria-labelledby="queue-heading">
        <h2 id="queue-heading">Your Queue Status</h2>
        <p role="status">{status}</p>
        {inQueue && (
          <p>
            Estimated wait: <strong>{myStatus.estimatedWaitMinutes} minutes</strong>
          </p>
        )}

        <div className="queue-buttons">
          <button type="button" className="outline" onClick={() => navigate("/order")}>
            View Order
          </button>
          {/* joining means placing an order, so this goes to the place-order page */}
          <button type="button" onClick={() => navigate("/join-queue")} disabled={inQueue}>
            Join Queue
          </button>
          <button type="button" onClick={handleLeave} disabled={!inQueue}>
            Leave Queue
          </button>
          <button type="button" className="outline" onClick={() => navigate("/queue-history")}>
            Queue History
          </button>
        </div>
      </section>

      {/* active services */}
      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Active Services</h2>
        <p className="ordering-status">
          Online ordering -{" "}
          <span className={MOCK_TRUCK.orderingOpen ? "available" : "unavailable"}>
            {MOCK_TRUCK.orderingOpen ? "Available" : "Unavailable"}
          </span>
        </p>
        <ul className="services">
          <li>
            <span>Pickup location</span>
            <span>{MOCK_TRUCK.location}</span>
          </li>
          <li>
            <span>Hours today</span>
            <span>{MOCK_TRUCK.hours}</span>
          </li>
          <li>
            <span>Now serving</span>
            <span>Order #{MOCK_TRUCK.nowServing}</span>
          </li>
        </ul>
        <button type="button" onClick={() => navigate("/menu")}>
          View Menu
        </button>
      </section>

      <section className="notifications" aria-labelledby="notif-heading">
        <h2 id="notif-heading">Notifications</h2>
        <ul>
          {MOCK_NOTIFICATIONS.slice(0, 2).map((n, i) => (
            <li key={i} className="notification">{n}</li>
          ))}
        </ul>
        <button type="button" onClick={() => navigate("/notifications")}>
          See all
        </button>
      </section>
    </div>
  );
}

export default UserDashboard;