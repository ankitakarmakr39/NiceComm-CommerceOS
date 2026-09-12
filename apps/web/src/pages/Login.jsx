import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nice-auth-page">
            <div className="nice-auth-background" />

            <div className="nice-auth-container">
                <div className="nice-auth-brand">
                    <div className="nice-auth-brand-mark">N</div>

                    <div>
                        <div className="nice-auth-brand-name">
                            NiceComm
                        </div>
                        <div className="nice-auth-brand-subtitle">
                            Commerce OS
                        </div>
                    </div>
                </div>

                <div className="nice-auth-card">
                    <div className="nice-auth-header">
                        <div className="nice-auth-kicker">
                            WELCOME BACK
                        </div>

                        <h1>Sign in to NiceComm</h1>

                        <p>
                            Access your Commerce OS workspace securely.
                        </p>
                    </div>

                    <form
                        className="nice-auth-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="nice-auth-field">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <div className="nice-auth-input-wrap">
                                <span className="nice-auth-input-icon">
                                    @
                                </span>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="nice-auth-field">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="nice-auth-input-wrap">
                                <span className="nice-auth-input-icon">
                                    •
                                </span>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="nice-auth-error">
                                <span className="nice-auth-error-icon">
                                    !
                                </span>

                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            className="nice-auth-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="nice-auth-spinner" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <span className="nice-auth-arrow">
                                        →
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="nice-auth-divider">
                        <span />
                        <span>NiceComm</span>
                        <span />
                    </div>

                    <div className="nice-auth-footer">
                        <span>Don't have an account?</span>

                        <button
                            type="button"
                            className="nice-auth-link"
                            onClick={() => navigate("/register")}
                        >
                            Create an account
                        </button>
                    </div>
                </div>

                <div className="nice-auth-bottom">
                    NiceComm Commerce Operating System
                </div>
            </div>
        </div>
    );
}

export default Login;