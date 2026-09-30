import { Link } from 'react-router-dom'
import './MainAuth.css'

function MainPage() {
    return (
        <div className="main-page">
            <div className="main-container">
                <h1 className="main-title">Welcome to Taco Express!</h1>
                <p className="main-slogan">Join the line. Skip the wait.</p>

                <div className="clipart-space">
                    {/* Food truck image will go here later */}
                </div>

                <div className="main-buttons">
                    <Link to="/login" className="login-button">
                        Log in
                    </Link>

                    <Link to="/signup" className="signup-button">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MainPage