import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./ViewQueue.css";

// Temporary admin check until login is connected (the backend expects this header)
const ADMIN_HEADERS = { "x-user-role": "admin" };

function ViewQueue() {
    const navigate = useNavigate();

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadQueue = async () => {
        try {
            const res = await fetch("/api/queue", { headers: ADMIN_HEADERS });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Could not load the queue.");
                return;
            }
            setQueue(data);
            setError("");
        } catch {
            setError("Could not reach the server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleRemove = async (userId) => {
        try {
            const res = await fetch(
                `/api/queue/leave/${encodeURIComponent(userId)}`,
                { method: "DELETE" }
            );
            if (!res.ok && res.status !== 404) {
                const data = await res.json();
                setError(data.error || "Could not remove that user.");
                return;
            }
            await loadQueue();
        } catch {
            setError("Could not reach the server. Is the backend running?");
        }
    };

    const handleServeNext = async () => {
        try {
            const res = await fetch("/api/queue/serve-next", {
                method: "POST",
                headers: ADMIN_HEADERS,
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Could not serve the next user.");
                return;
            }
            await loadQueue();
        } catch {
            setError("Could not reach the server. Is the backend running?");
        }
    };

    const describeItems = (items) =>
        items.map((i) => `${i.name} x${i.quantity}`).join(", ");

    return (
        <div className="dashboard view-queue-page">
            <header className="queue-header">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
                <button className="back-button" onClick={() => navigate(-1)}>
                    &#x2190; back
                </button>
            </header>

            <h1>CURRENT QUEUE</h1>

            {error && <p className="error" role="alert">{error}</p>}

            {!loading && queue.length > 0 && (
                <button className="action-link" onClick={handleServeNext}>
                    serve next
                </button>
            )}

            <div className="queue-list">
                {queue.map((entry) => (
                    <div key={entry.id} className="queue-item">
                        <div className="user-info">
                            <span className="user-name">
                                #{entry.position} {describeItems(entry.items)}
                            </span>
                        </div>

                        <div className="queue-actions">
                            <span
                                className="action-link"
                                onClick={() => navigate('/admin-order')}>
                                view order
                            </span>
                            <span
                                className="action-link remove"
                                onClick={() => handleRemove(entry.userId)}>
                                remove from queue
                            </span>
                            <span className="action-link">notify for pickup</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="end-of-queue">
                {loading ? "loading..." : queue.length === 0 ? "the queue is empty" : "end of queue"}
            </div>
        </div>
    );
}

export default ViewQueue;