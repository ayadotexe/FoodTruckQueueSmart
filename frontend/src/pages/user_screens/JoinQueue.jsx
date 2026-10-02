import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinQueue.css";

// mock order (matches the View Order mockup)
// ordersAhead = people ahead of you who ordered this item
// prepMinutes = how long one order of this item takes to make
const MOCK_ORDER = [
  {
    id: 1,
    name: "Tacos al pastor",
    quantity: 5,
    addOns: ["salsa verde", "jalapeños"],
    price: 1.4, // per item
    ordersAhead: 2,
    prepMinutes: 3,
  },
  {
    id: 2,
    name: "Bottled coke",
    quantity: 1,
    addOns: [],
    price: 1.34,
    ordersAhead: 0,
    prepMinutes: 0,
  },
];

const POSITION_AFTER_JOIN = 3; // mock: 2 people ahead, so you're 3rd

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function JoinQueue() {
  const navigate = useNavigate();

  const [items, setItems] = useState(MOCK_ORDER);
  const [placed, setPlaced] = useState(false); // true = order placed, in the queue
  const [error, setError] = useState("");

  // estimated wait: for each item, people ahead who ordered it x how long it takes
  const estimatedWait = items.reduce(
    (sum, i) => sum + i.ordersAhead * i.prepMinutes,
    0
  );

  const total = items
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2);

  const handleRemove = (id) => {
    setItems(items.filter((i) => i.id !== id));
    setError("");
  };

  // validation: you can't join the queue with an empty order
  const handlePlaceOrder = () => {
    if (items.length === 0) {
      setError("Add at least one item before placing your order.");
      return;
    }
    setError("");
    setPlaced(true); // replace with an API call later
  };

  const handleLeave = () => setPlaced(false);

  return (
    <div className="join-queue">
      <header className="join-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← back
        </button>
        <h1>{placed ? "You're in the queue" : "Place your order"}</h1>
      </header>

      {/* after the order is placed */}
      {placed && (
        <section className="confirm-card" aria-live="polite">
          <p className="label">You are</p>
          <p className="position">{ordinal(POSITION_AFTER_JOIN)}</p>
          <p className="label">in line</p>
          <p className="wait">
            Estimated wait time: <strong>{estimatedWait} minutes</strong>
          </p>
        </section>
      )}

      {/* the order */}
      <section aria-labelledby="order-heading">
        <h2 id="order-heading">Your order</h2>

        {items.length === 0 ? (
          <p className="empty">Your order is empty.</p>
        ) : (
          <ul className="order-list">
            {items.map((i) => (
              <li key={i.id} className="order-item">
                <div className="item-info">
                  <span className="item-name">{i.name}</span>
                  <span className="item-detail">quantity: {i.quantity}</span>
                  <span className="item-detail">
                    add-ons: {i.addOns.length ? i.addOns.join(", ") : "none"}
                  </span>
                </div>
                <div className="item-side">
                  <span className="item-price">
                    ${(i.price * i.quantity).toFixed(2)}
                  </span>
                  {!placed && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleRemove(i.id)}
                      aria-label={`Remove ${i.name}`}
                    >
                      remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="total">
          Total <strong>${total}</strong>
        </p>

        {!placed && (
          <button
            type="button"
            className="outline"
            onClick={() => navigate("/menu")}
          >
            Add more items
          </button>
        )}
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {/* buttons at the bottom */}
      <div className="join-buttons">
        {!placed && (
          <button type="button" onClick={handlePlaceOrder}>
            Place order &amp; join queue
          </button>
        )}

        {placed && (
          <>
            <button type="button" onClick={() => navigate("/queue-status")}>
              View queue status
            </button>
            <button type="button" className="outline" onClick={handleLeave}>
              Leave queue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default JoinQueue;