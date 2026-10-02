import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";
import "./notificationBanner";

// mock data for the truck
const MOCK_TRUCK = {
  orderingOpen: true,
  peopleInLine: 4,
  location: "Lot B, near the library",
  hours: "11:00 AM - 8:00 PM",
  nowServing: 42,
};

const MOCK_NOTIFICATIONS = [
  "Your order is being prepared.",
  "You are getting close to the front of the queue!",
];

const ordinal = (n) => {
  // turns 1 into 1st, 2 into 2nd, 3 into 3rd, etc.
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const WAIT_PER_PERSON = 2; // minutes each person ahead adds (3rd place = 6 mins)

function UserDashboard() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null); // null = not in queue
  const [served, setServed] = useState(false); // true = order is ready

  const inQueue = position !== null && !served;

  let status = "Not currently in a queue";
  if (served) status = "Your order is ready";
  else if (position === 1) status = "You're almost up!";
  else if (inQueue) status = `You are ${ordinal(position)} in line`;

  const handleJoin = () => setPosition(3); // mock: 3rd in line
  const handleLeave = () => setPosition(null);

  // truck-wide wait, shown under the welcome heading
  const truckWait = MOCK_TRUCK.peopleInLine * WAIT_PER_PERSON;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome back!</h1>
        <p className="truck-wait">
          {MOCK_TRUCK.peopleInLine} people in line &middot; current wait:{" "}
          <strong>{truckWait} minutes</strong>
        </p>
      </header>

      {/* your order status */}
      <section className="queue-card" aria-labelledby="queue-heading">
        <h2 id="queue-heading">Your Queue Status</h2>
        <p role="status">{status}</p>
        {inQueue && (
          <p>
            Estimated wait: <strong>{position * WAIT_PER_PERSON} minutes</strong>
          </p>
        )}

        <div className="queue-buttons">
          <button type="button" className="outline" onClick={() => navigate("/order")}>
            View Order
          </button>
          <button type="button" onClick={handleJoin} disabled={inQueue || served}>
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