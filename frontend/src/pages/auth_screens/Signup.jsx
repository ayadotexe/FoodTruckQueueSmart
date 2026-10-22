import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './MainAuth.css'

function Signup() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    // const handleSubmit = (event) => {
    //     event.preventDefault()

    //     if (password !== confirmPassword) {
    //         setError('Passwords do not match.')
    //         return
    //     }

    //     setError('')
    //     setPassword('')
    //     setConfirmPassword('')
    //     event.target.reset()
    // }

    const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
    }

    const formData = new FormData(event.currentTarget)
    setLoading(true)

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            setError(data.error || 'Unable to create your account.')
            return
        }

        navigate('/login', {
            state: { message: 'Account created! Please log in.' },
        })
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

                <h1 className="auth-title">Create an account</h1>
                <p className="auth-subtitle">Sign up to join the queue and place an order.</p>

                <form className="auth-form" onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="firstName">First name*</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="Enter your first name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last name*</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Enter your last name"
                            required
                        />
                    </div>

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
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password*</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    {error && <p className="auth-subtitle">{error}</p>}

                    {/* <button type="submit" className="auth-button">
                        Sign up
                    </button> */}

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    )
}

export default Signup