import { useState, useRef } from "react";
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

    // drag
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleRemove = (id) => {
        setQueue(queue.filter(user => user.id !== id));
    };

    const handleSort = () => {
        let _queue = [...queue];
        const draggedItemContent = _queue.splice(dragItem.current, 1)[0];
        _queue.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;
        setQueue(_queue);
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
                {queue.map((user, index) => (
                    <div 
                        key={user.id} 
                        className="queue-item"
                        draggable
                        onDragStart={() => (dragItem.current = index)}
                        onDragEnter={() => (dragOverItem.current = index)}
                        onDragEnd={handleSort}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                        
                        <span className="user-name">{user.name}</span>
                        
                        <div className="queue-actions">
                            <span 
                                className="action-link" 
                                onClick={() => navigate('/admin-order')}>
                                view order
                            </span>
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