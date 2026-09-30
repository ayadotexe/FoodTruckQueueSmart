import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

// this is just mock data rn
const MOCK_SERVICES = [
  { id: 1, name: "Tacos", queueLength: 4 }, //so item is tacos and approx 4 ppl waiting for that item rn
  { id: 2, name: "Drinks", queueLength: 1 },
];
//again this is mock
const MOCK_NOTIFICATIONS = [
  "Your order is being prepared.",
  "You are getting close to the front of the queue!",
];

const ordinal = (n) => { //this is what is allowing us to do like 3rd etc
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const WAIT_PER_PERSON = 2; // minutes- each person ahead of you adds abt 2 mins (so 3rd place with 2 mins=6mins)

function UserDashboard() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null); // null = not in queue
  const [served, setServed] = useState(false); //true means ready

  const inQueue = position !== null && !served;
//below are some things i defined- so not in queue, order is ready, close, and postion
  let status = "Not currently in a queue";
  if (served) status = "Your order is ready";
  else if (position === 1) status = "You're almost up!";
  else if (inQueue) status = `You are ${ordinal(position)} in line`; //thirds

  const handleJoin = () => setPosition(3); // moack- 3rd in line
  const handleLeave = () => setPosition(null);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome back!</h1>
        <p>What would you like to do?</p>
      </header>

      <section className="queue-card" aria-labelledby="queue-heading">
        <h2 id="queue-heading">Your Queue</h2>
        <p role="status">{status}</p>
        {inQueue && (
          <p>Estimated wait: <strong>{position * WAIT_PER_PERSON} minutes</strong></p>
        )}

        <div className="queue-buttons"> {/*these are the buttons */}
          <button type="button" onClick={() => navigate("/order")}>View Order</button>
          <button type="button" onClick={handleJoin} disabled={inQueue || served}>Join Queue</button>
          <button type="button" onClick={handleLeave} disabled={!inQueue}>Leave Queue</button>
        </div>
      </section>

      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Active Services</h2>
        <ul className="services">
          {MOCK_SERVICES.map((s) => (
            <li key={s.id}>{s.name} · {s.queueLength} in queue</li>
          ))}
        </ul>
        <button type="button" onClick={() => navigate("/menu")}>View Menu</button>
      </section>

      <section className="notifications" aria-labelledby="notif-heading">
        <h2 id="notif-heading">Notifications</h2>
        <ul>
          {MOCK_NOTIFICATIONS.slice(0, 2).map((n, i) => (
            <li key={i} className="notification">{n}</li>
          ))}
        </ul>
        <button type="button" onClick={() => navigate("/notifications")}>See all</button>
      </section>
    </div>
  );
}

export default UserDashboard;