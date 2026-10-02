import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QueueStatus.css";

// mock order (same as the Place Order page)
// ordersAhead = people ahead of you who ordered this item
// prepMinutes = how long one order of this item takes to make
const MOCK_ORDER = [
  { id: 1, name: "Tacos al pastor", quantity: 5, ordersAhead: 2, prepMinutes: 3 },
  { id: 2, name: "Bottled coke", quantity: 1, ordersAhead: 0, prepMinutes: 0 },
];

const PICKUP_LOCATION = "Lot B, near the library"; // mock

const START_POSITION = 3; // position when the order was placed

const STAGES = [
  { key: "waiting", label: "Waiting" },
  { key: "almost", label: "Almost ready" },
  { key: "served", label: "Served" },
];

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function QueueStatus() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(START_POSITION); // null = not in a queue
  const [ready, setReady] = useState(false); // true = ready for pickup

  const inQueue = position !== null;

  // which of the three stages we're in
  let stage = null;
  if (ready) stage = "served";
  else if (position === 1) stage = "almost";
  else if (inQueue) stage = "waiting";

  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  // how many people have been served since the order was placed
  const servedSoFar = inQueue ? START_POSITION - position : 0;

  // estimated wait: for each item, people still ahead who ordered it x prep time
  const estimatedWait = MOCK_ORDER.reduce((sum, i) => {
    const stillAhead = Math.max(0, i.ordersAhead - servedSoFar);
    return sum + stillAhead * i.prepMinutes;
  }, 0);

  const itemCount = MOCK_ORDER.reduce((sum, i) => sum + i.quantity, 0);

  const handleLeave = () => {
    setPosition(null);
    setReady(false);
  };

  // DEMO ONLY: steps through the states so you can screenshot each one.
  // Delete this function and the demo-controls div before the final version.
  const handleAdvance = () => {
    if (!inQueue) setPosition(START_POSITION);
    else if (ready) {
      setPosition(START_POSITION);
      setReady(false);
    } else if (position > 1) setPosition(position - 1);
    else setReady(true);
  };

  return (
    <div className="queue-status">
      <header className="status-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← back
        </button>
        <h1>Queue status</h1>
      </header>

      {/* not in a queue */}
      {!inQueue && (
        <section className="status-card">
          <p className="headline" role="status">Not currently in a queue</p>
          <button type="button" onClick={() => navigate("/menu")}>
            View menu
          </button>
        </section>
      )}

      {inQueue && (
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
                Estimated wait time: <strong>{estimatedWait} minutes</strong>
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

      {/* DEMO ONLY: delete before final */}
      <div className="demo-controls">
        <button type="button" className="demo" onClick={handleAdvance}>
          demo: next state
        </button>
      </div>
    </div>
  );
}

export default QueueStatus;