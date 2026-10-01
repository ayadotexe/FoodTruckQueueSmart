import { Link } from 'react-router-dom'
import './MainAuth.css'

function Login() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    Taco Express
                </Link>

                <h1 className="auth-title">Welcome back!</h1>
                <p className="auth-subtitle">Log in to join the queue and place an order.</p>

                <form className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email*</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password*</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button">
                        Log In
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    )
}

export default Login