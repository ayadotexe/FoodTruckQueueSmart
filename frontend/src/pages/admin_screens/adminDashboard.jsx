import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./adminDashboard.css";
import userIcon from "../../assets/icon.png";

function AdminDashboard() {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="dashboard">
            <div className="profile-icon profile-menu">
                <img 
                    src={userIcon} 
                    alt="icon" 
                    className="clickable-icon"
                    onClick={() => setShowDropdown(!showDropdown)} 
                />
                {showDropdown && (
                    <div className="profile-dropdown">
                        <div className="dropdown-role">Admin</div>
                        <hr />
                        <div className="dropdown-action" onClick={handleLogout}>Log out</div>
                    </div>
                )}
            </div>

            <h1>Let's get started.</h1>

            <section className="buttons">
                <Link to="/admin-queue">
                    <button>view/edit queue</button>
                </Link>

                <Link to="/admin-menu">
                    <button>view/edit menu</button>
                </Link>

                <Link to="/admin-stats">
                    <button>usage statistics</button>
                </Link>

                <Link to="/admin-history">
                    <button>view queue history</button>
                </Link>
            </section>
        </div>
    );
}

export default AdminDashboard;