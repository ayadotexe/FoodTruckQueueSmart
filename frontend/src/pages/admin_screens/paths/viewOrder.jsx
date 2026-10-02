import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./ViewOrder.css";

function ViewOrder() {
    const navigate = useNavigate();

    return (
        <div className="dashboard view-order-page">
            <header className="order-header">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
                <button className="back-button" onClick={() => navigate(-1)}>
                    &#x2190; back
                </button>
            </header>

            <h1>USER 1</h1>

            {/* order items */}
            <div className="order-items-container">
                <div className="order-item">
                    <div className="placeholder-image">
                        IMAGE<br/>HERE
                    </div>
                    <div className="item-details">
                        <h2>tacos al pastor</h2>
                        <p>
                            <span className="dotted-label">quantity:</span> <span className="red-text">5</span>
                        </p>
                        <p>
                            <span className="dotted-label">add-ons:</span> <span className="red-text">salsa verde, jalapeños</span>
                        </p>
                    </div>
                </div>

                <div className="order-item">
                    <div className="placeholder-image">
                        IMAGE<br/>HERE
                    </div>
                    <div className="item-details">
                        <h2>bottled coke</h2>
                        <p>
                            <span className="dotted-label">quantity:</span> <span className="red-text">1</span>
                        </p>
                        <p>
                            <span className="dotted-label">add-ons:</span> <span className="red-text">NONE</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* total */}
            <div className="order-total">
                TOTAL <span className="red-text">$8.34</span>
            </div>

            <button className="notify-button">
                notify for pickup
            </button>
        </div>
    );
}

export default ViewOrder;