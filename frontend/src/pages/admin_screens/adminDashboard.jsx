import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./adminDashboard.css";
import userIcon from "../../assets/icon.png";

function AdminDashboard() {
    return (
        <div className="dashboard">
            <div className="profile-icon">
                <div className="profile-icon">
                    <img src={userIcon} alt="icon" />
                </div>
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