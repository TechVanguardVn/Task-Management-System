import { useState } from 'react';
import type { FormEvent } from 'react';

interface LoginProps {
    onLogin: (token: string) => void;
}

function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            onLogin(data.accessToken);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Task Management</h1>
                <p>Sign in to manage your tasks</p>

                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                />

                {error && <div className="login-error">{error}</div>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <div className="demo-account">
                    <strong>Demo account</strong>
                    <span>demo1@test.com</span>
                    <span>12345678</span>
                </div>
            </form>
        </div>
    );
}

export default Login;