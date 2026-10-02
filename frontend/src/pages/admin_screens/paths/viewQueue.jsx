import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./ViewQueue.css";

function ViewQueue() {
    const navigate = useNavigate();

    // queue simulation
    const [queue, setQueue] = useState([
        { id: 1, name: "user 1" },
        { id: 2, name: "user 2" },
        { id: 3, name: "user 3" },
    ]);

    // remove user
    const handleRemove = (id) => {
        setQueue(queue.filter(user => user.id !== id));
    };

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

            {/* queue */}
            <div className="queue-list">
                {queue.map(user => (
                    <div key={user.id} className="queue-item">
                        <span className="user-name">{user.name}</span>
                        <div className="queue-actions">
                            <span className="action-link">view order</span>
                            <span 
                                className="action-link remove" 
                                onClick={() => handleRemove(user.id)}>
                                remove from queue
                            </span>
                            <span className="action-link">notify for pickup</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="end-of-queue">
                end of queue
            </div>
        </div>
    );
}

export default ViewQueue;