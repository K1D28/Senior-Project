import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USERS } from '../../data';
import { Role, User } from '../../types';
import { supabase } from './supabaseClient';
import { BACKEND_URL } from '../../utils/api';
import './LoginScreen.css';

const roleToDashboardMap: Record<string, string> = {
  ADMIN: '/admin-dashboard/cuppingevents',
  HEAD_JUDGE: '/headjudge-dashboard/adjudicate',
  FARMER: '/farmer-dashboard',
  Q_GRADER: '/qgrader-dashboard/cuppingevents',
};

const normalizeRoles = (user: Partial<User>): string[] => {
  if (Array.isArray(user.roles)) {
    return user.roles.filter(Boolean) as string[];
  }
  if (user.role) return [user.role];
  return [];
};

const handleRoleBasedRedirection = (role: string, navigate: (path: string) => void, setError: (message: string) => void) => {
  const dashboardPath = roleToDashboardMap[role];
  if (dashboardPath) {
    navigate(dashboardPath);
  } else {
    console.error('No dashboard path defined for role:', role);
    setError('No dashboard available for your role.');
  }
};

const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState(''); // Declare username state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingLogin = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
            credentials: 'include',
          });
          if (response.ok) {
            const user = JSON.parse(storedUser);
            console.log('Stored user:', user); // Debugging log

            // Normalize role to roles array
            const roles = normalizeRoles(user);
            console.log('Normalized roles:', roles); // Debugging log

            if (roles.length === 0) {
              console.error('User has no roles defined');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('token');
              return;
            }

            const primaryRole = roles[0]; // Assuming the first role is the primary role
            handleRoleBasedRedirection(primaryRole, navigate, setError);
            onLogin(user);
          } else {
            console.error('Failed to verify user:', response.status); // Debugging log
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
        }
      }
    };
    checkExistingLogin();
  }, [navigate, onLogin]);

  const handleLogin = async () => {
    try {
      // Call backend login endpoint which handles everything
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
        credentials: 'include',
      });

      // Read response text first to avoid JSON parse errors
      const responseText = await response.text();
      console.log('Login response status:', response.status);
      console.log('Login response body:', responseText.substring(0, 200));

      let loginData;
      try {
        loginData = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse login response:', responseText.substring(0, 500));
        setError('Server returned invalid response. Please try again.');
        return;
      }

      if (response.ok && loginData.token) {
        // Store token for future API calls
        localStorage.setItem('token', loginData.token);

        // If we already have user data from login, use it directly
        if (loginData.user) {
          const user = { ...loginData.user, roles: normalizeRoles(loginData.user) };
          if (user.roles.length === 0) {
            console.error('User returned from login has no role');
            setError('Login failed: User has no assigned role.');
            return;
          }
          localStorage.setItem('currentUser', JSON.stringify(user));
          const primaryRole = user.roles[0];
          handleRoleBasedRedirection(primaryRole, navigate, setError);
          onLogin(user);
          return;
        }

        // Fallback: verify with token
        const userResponse = await fetch(`${BACKEND_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          },
        });

        if (userResponse.ok) {
          const user = await userResponse.json();
          localStorage.setItem('currentUser', JSON.stringify(user));
          const roles = normalizeRoles(user);
          if (roles.length === 0) {
            console.error('Verified user has no roles');
            setError('Login failed: User has no assigned role.');
            return;
          }
          const primaryRole = roles[0];
          handleRoleBasedRedirection(primaryRole, navigate, setError);
          onLogin(user);
        } else {
          console.error('Failed to verify user role:', userResponse.status);
          setError('Failed to verify user role.');
        }
      } else if (response.ok && loginData.user) {
        // Login successful but no token - use user data directly
        if (!loginData.user.role) {
          console.error('User has no role assigned');
          setError('Login failed: User has no assigned role.');
          return;
        }
        const user = { ...loginData.user, roles: [loginData.user.role] };
        localStorage.setItem('currentUser', JSON.stringify(user));
        handleRoleBasedRedirection(user.role, navigate, setError);
        onLogin(user);
      } else {
        console.error('Login failed:', response.status, loginData);
        setError(loginData.message || 'Login failed. Invalid email or password.');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An error occurred during login.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="login-screen min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-2xl font-bold mb-8">Welcome to Cupping Hub</h1>
      <div className="w-full max-w-md bg-surface p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-2 border border-border rounded"
            />
          </div>
          <div className="relative mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-2 border border-border rounded"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-primary focus:outline-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
