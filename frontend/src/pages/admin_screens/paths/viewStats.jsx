import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./ViewStats.css";

function ViewStats() {
    const navigate = useNavigate();

    // simulated stats
    const stats = {
        totalOrders: 17,
        averageWait: "12 mins",
        topItem: "Tacos al Pastor",
        revenue: "$1,845.50"
    };

    return (
        <div className="dashboard view-stats-page">
            <header className="stats-header">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
                <button className="back-button" onClick={() => navigate(-1)}>
                    &#x2190; back
                </button>
            </header>

            <h1>STATISTICS</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Today's Orders</h3>
                    <p className="stat-value">{stats.totalOrders}</p>
                </div>
                
                <div className="stat-card">
                    <h3>Avg Wait Time</h3>
                    <p className="stat-value red-text">{stats.averageWait}</p>
                </div>
                
                <div className="stat-card">
                    <h3>Top Selling Item</h3>
                    <p className="stat-value">{stats.topItem}</p>
                </div>
                
                <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <p className="stat-value">{stats.revenue}</p>
                </div>
            </div>
        </div>
    );
}

export default ViewStats;