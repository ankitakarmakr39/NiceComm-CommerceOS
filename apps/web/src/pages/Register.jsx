import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await register(fullName, email, password, phone);

            setSuccess("Registration successful. Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1000);
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

                {/* Brand */}
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

                {/* Register Card */}
                <div className="nice-auth-card nice-register-card">

                    <div className="nice-auth-header">
                        <div className="nice-auth-kicker">
                            GET STARTED
                        </div>

                        <h1>Create your NiceComm account</h1>

                        <p>
                            Join the NiceComm Commerce OS and manage your
                            commerce workspace from one place.
                        </p>
                    </div>

                    <form
                        className="nice-auth-form"
                        onSubmit={handleSubmit}
                    >

                        {/* Full Name */}
                        <div className="nice-auth-field">
                            <label htmlFor="fullName">
                                Full Name
                            </label>

                            <div className="nice-auth-input-wrap">
                                <span className="nice-auth-input-icon">
                                    ◉
                                </span>

                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(event.target.value)
                                    }
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        {/* Phone */}
                        <div className="nice-auth-field">
                            <label htmlFor="phone">
                                Phone Number
                                <span className="nice-auth-optional">
                                    Optional
                                </span>
                            </label>

                            <div className="nice-auth-input-wrap">
                                <span className="nice-auth-input-icon">
                                    ☎
                                </span>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="Enter your phone number"
                                    autoComplete="tel"
                                />
                            </div>
                        </div>

                        {/* Password */}
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
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="nice-auth-field">
                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <div className="nice-auth-input-wrap">
                                <span className="nice-auth-input-icon">
                                    ✓
                                </span>

                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="nice-auth-error">
                                <span className="nice-auth-error-icon">
                                    !
                                </span>

                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="nice-auth-success">
                                <span className="nice-auth-success-icon">
                                    ✓
                                </span>

                                <span>{success}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            className="nice-auth-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="nice-auth-spinner" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <span className="nice-auth-arrow">
                                        →
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="nice-auth-divider">
                        <span />
                        <span>NiceComm</span>
                        <span />
                    </div>

                    {/* Login link */}
                    <div className="nice-auth-footer">
                        <span>
                            Already have an account?
                        </span>

                        <button
                            type="button"
                            className="nice-auth-link"
                            onClick={() => navigate("/login")}
                        >
                            Sign in
                        </button>
                    </div>
                </div>

                {/* Bottom */}
                <div className="nice-auth-bottom">
                    NiceComm Commerce Operating System
                </div>
            </div>
        </div>
    );
}

export default Register;
