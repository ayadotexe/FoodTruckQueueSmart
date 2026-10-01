import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinQueue.css";

// Mock data
// expectedDuration = minutes per person
const MOCK_SERVICES = [
  { id: 1, name: "Tacos", queueLength: 4, expectedDuration: 3 },
  { id: 2, name: "Drinks", queueLength: 1, expectedDuration: 2 },
  { id: 3, name: "Bento", queueLength: 6, expectedDuration: 4 },
];

function JoinQueue() {
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null); // service the user picked
  const [joinedId, setJoinedId] = useState(null);     // queue the user is in (null = none)
  const [error, setError] = useState("");             // validation message

  const inQueue = joinedId !== null;
  const selected = MOCK_SERVICES.find((s) => s.id === selectedId);
  const joined = MOCK_SERVICES.find((s) => s.id === joinedId);

  // estimated wait = people ahead of you x minutes per person for that service
  const waitFor = (service) => service.queueLength * service.expectedDuration;

  const handleSelect = (id) => {
    setSelectedId(id);
    setError(""); // clear the error once they pick something
  };

  const handleJoin = () => {
    if (selectedId === null) {
      setError("Please select a service.");
      return;
    }
    setJoinedId(selectedId); // replace later
  };

  const handleLeave = () => {
    setJoinedId(null);
    setSelectedId(null);
    setError("");
  };

  return (
    <div className="join-queue">
      <header className="join-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← back
        </button>
        <h1>Join a queue</h1>
      </header>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <fieldset className="service-list" disabled={inQueue}>
          <legend>Select a service</legend>

          {MOCK_SERVICES.map((s) => (
            <label
              key={s.id}
              className={`service-option ${selectedId === s.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="service"
                value={s.id}
                checked={selectedId === s.id}
                onChange={() => handleSelect(s.id)}
              />
              <span className="service-name">{s.name}</span>
              <span className="service-meta">{s.queueLength} in queue</span>
            </label>
          ))}
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {selected && !inQueue && (
          <p className="wait" role="status">
            Estimated wait time: <strong>{waitFor(selected)} minutes</strong>
          </p>
        )}

        {inQueue && (
          <p className="wait" role="status">
            You joined the <strong>{joined.name}</strong> queue.
            <br />
            Estimated wait time: <strong>{waitFor(joined)} minutes</strong>
          </p>
        )}

        <div className="join-buttons">
          <button type="button" onClick={handleJoin} disabled={inQueue}>
            Join Queue
          </button>
          <button type="button" onClick={handleLeave} disabled={!inQueue}>
            Leave Queue
          </button>
        </div>

        {inQueue && (
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/queue-status")}
          >
            View queue status
          </button>
        )}
      </form>
    </div>
  );
}

export default JoinQueue;
