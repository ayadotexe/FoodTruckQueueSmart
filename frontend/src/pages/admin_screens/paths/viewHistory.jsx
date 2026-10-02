import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./ViewHistory.css";

function ViewHistory() {
    const navigate = useNavigate();

    // simulated history
    const historyData = [
        { id: 1, name: "user 4", status: "done", date: "August 2, 2026" },
        { id: 2, name: "user 5", status: "removed", date: "August 5, 2026" },
        { id: 3, name: "user 6", status: "done", date: "September 1, 2026" },
        { id: 4, name: "user 7", status: "done", date: "September 10, 2026" },
        { id: 5, name: "user 8", status: "removed", date: "September 30, 2026" }
    ];

    // day organized
    const groupedHistory = historyData.reduce((acc, curr) => {
        if (!acc[curr.date]) {
            acc[curr.date] = [];
        }
        acc[curr.date].push(curr);
        return acc;
    }, {});

    return (
        <div className="dashboard view-history-page">
            <header className="history-header">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
                <button className="back-button" onClick={() => navigate(-1)}>
                    &#x2190; back
                </button>
            </header>

            <h1>QUEUE HISTORY</h1>

            <div className="history-list">
                {Object.keys(groupedHistory)
                    .sort((a, b) => new Date(b) - new Date(a))
                    .map(date => (
                    <div key={date} className="date-group">
                        <h2 className="date-heading">{date}</h2>
                        
                        {groupedHistory[date].map(user => (
                            <div key={user.id} className="history-item">
                                <span className="user-name">{user.name}</span>
                                <span className={`status-label ${user.status}`}>
                                    {user.status === "done" ? "served" : "removed"}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ViewHistory;