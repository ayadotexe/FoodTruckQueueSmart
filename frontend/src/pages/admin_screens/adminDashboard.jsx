import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./adminDashboard.css";

function AdminDashboard() {
    return (
        <div className="dashboard">
            <div className="profile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>

            <h1>Let's get started.</h1>

            <section className="buttons">
                <Link to="/paths/viewQueue">
                    <button>view/edit queue</button>
                </Link>

                <Link to="/paths/viewMenu">
                    <button>view/edit menu</button>
                </Link>

                <Link to="/paths/viewStats">
                    <button>usage statistics</button>
                </Link>

                <Link to="/viewHistory">
                    <button>view queue history</button>
                </Link>
            </section>
        </div>
    );
}

export default AdminDashboard;