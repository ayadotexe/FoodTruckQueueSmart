import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinQueue.css";
import { getCurrentUserId } from "../../currentUser";
import { useCart } from "../../context/CartContext";

// mock order (matches the View Order mockup)
// prepMinutes = how long one order of this item takes to make
// (ordersAhead is no longer used; the backend works out the wait)

// DELETE LATER
// const MOCK_ORDER = [
//   {
//     id: 1,
//     name: "Tacos al pastor",
//     quantity: 5,
//     addOns: ["salsa verde", "jalapeños"],
//     price: 1.4, // per item
//     ordersAhead: 2,
//     prepMinutes: 3,
//   },
//   {
//     id: 2,
//     name: "Bottled coke",
//     quantity: 1,
//     addOns: [],
//     price: 1.34,
//     ordersAhead: 0,
//     prepMinutes: 0,
//   },
// ];

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function JoinQueue() {
  const navigate = useNavigate();

  // DELETE LATER
  // const [items, setItems] = useState(MOCK_ORDER); 

  const { cart, clearCart } = useCart();

  const [items, setItems] = useState(() =>
      cart.map((item) => ({
          ...item,
          addOns: item.selectedAddons || [],
          prepMinutes: item.expectedDuration,
      }))
  );

  const [placed, setPlaced] = useState(false); // true = order placed, in the queue
  const [queueInfo, setQueueInfo] = useState(null); // backend response: position + estimated wait
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2);

  // const handleRemove = (id) => {
  //   setItems(items.filter((i) => i.id !== id));
  //   setError("");
  // };

  const handleRemove = (indexToRemove) => {
    setItems((previousItems) =>
        previousItems.filter((_, index) => index !== indexToRemove)
    );
    setError("");
  };

  // validation: you can't join the queue with an empty order
  const handlePlaceOrder = async () => {
    if (!getCurrentUserId()) {
      setError("Please log in before joining the queue.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one item before placing your order.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getCurrentUserId(),
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            prepMinutes: Math.max(1, i.prepMinutes), // backend requires at least 1
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join the queue.");
        return;
      }
      setQueueInfo(data);
      setPlaced(true);
      clearCart(); // added by aya
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/queue/leave/${encodeURIComponent(getCurrentUserId())}`,
        { method: "DELETE" }
      );
      // 404 means we're already not in the queue, so just reset the screen
      if (!res.ok && res.status !== 404) {
        const data = await res.json();
        setError(data.error || "Could not leave the queue.");
        return;
      }
      setPlaced(false);
      setQueueInfo(null);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-queue">
      <header className="join-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← back
        </button>
        <h1>{placed ? "You're in the queue" : "Place your order"}</h1>
      </header>

      {/* after the order is placed */}
      {placed && queueInfo && (
        <section className="confirm-card" aria-live="polite">
          <p className="label">You are</p>
          <p className="position">{ordinal(queueInfo.position)}</p>
          <p className="label">in line</p>
          <p className="wait">
            Estimated wait time:{" "}
            <strong>{queueInfo.estimatedWaitMinutes} minutes</strong>
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
            {/* {items.map((i) => (
              <li key={i.id} className="order-item"> */}

            {items.map((i, index) => (
              <li key={i.cartItemId || index} className="order-item">
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
                      // onClick={() => handleRemove(i.id)}
                      onClick={() => handleRemove(index)}
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
          <button type="button" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? "Placing order..." : "Place order & join queue"}
          </button>
        )}

        {placed && (
          <>
            <button type="button" onClick={() => navigate("/queue-status")}>
              View queue status
            </button>
            <button
              type="button"
              className="outline"
              onClick={handleLeave}
              disabled={loading}
            >
              Leave queue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default JoinQueue;