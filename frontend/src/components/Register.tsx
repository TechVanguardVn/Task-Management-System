import { useState } from 'react';
import type { FormEvent } from 'react';

interface RegisterProps {
    onRegister: () => void;
    onBackToLogin: () => void;
}

function Register({ onRegister, onBackToLogin }: RegisterProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    Array.isArray(data.message)
                        ? data.message.join(', ')
                        : data.message || 'Registration failed',
                );
            }

            onRegister();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Task Management</h1>
                <p>Create your account</p>

                <label htmlFor="register-name">Name</label>
                <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    required
                />

                <label htmlFor="register-email">Email</label>
                <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                />

                <label htmlFor="register-password">Password</label>
                <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    minLength={8}
                    required
                />

                {error && <div className="login-error">{error}</div>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                </button>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={onBackToLogin}
                >
                    Back to Login
                </button>
            </form>
        </div>
    );
}

export default Register;