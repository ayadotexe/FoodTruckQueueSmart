import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userIcon from "../../../assets/icon.png";
import "./viewMenu.css";

function ViewMenu() {
    const navigate = useNavigate();

    // simulated menu
    const [menu, setMenu] = useState([
        { id: 1, name: "tacos al pastor" },
        { id: 2, name: "bottled coke" },
        { id: 3, name: "chicharrónes" },
    ]);

    // remove menu item
    const handleRemove = (id) => {
        setMenu(menu.filter(item => item.id !== id));
    };

    return (
        <div className="dashboard view-menu-page">
            <header className="menu-header">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
                <button className="back-button" onClick={() => navigate(-1)}>
                    &#x2190; back
                </button>
            </header>

            <h1>MENU</h1>

            {/* list */}
            <div className="menu-list">
                {menu.map(item => (
                    <div key={item.id} className="menu-item">
                        <span className="item-name">{item.name}</span>
                        <div className="menu-actions">
                            <span className="action-link">edit item</span>
                            
                            <span 
                                className="action-link remove" 
                                onClick={() => handleRemove(item.id)}>
                                remove from menu
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ViewMenu;