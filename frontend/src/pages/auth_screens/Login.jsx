import './MainAuth.css'
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function Login() {

    const navigate = useNavigate()
    const location = useLocation()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            setError(data.error || 'Unable to log in.')
            return
        }

        sessionStorage.setItem('currentUser', JSON.stringify(data.user))
        
        navigate(
            data.user.role === 'admin' ? '/admin-dash' : '/user-dash'
        )
    } catch {
        setError('Could not reach the server. Please try again.')
    } finally {
        setLoading(false)
    }
}

    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    Taco Express
                </Link>

                <h1 className="auth-title">Welcome back!</h1>
                <p className="auth-subtitle">Log in to join the queue and place an order.</p>

                {location.state?.message && (
                    <p role="status">{location.state.message}</p>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
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

                    {/* <button type="submit" className="auth-button">
                        Log In
                    </button> */}

                    {error && <p role="alert">{error}</p>}

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
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