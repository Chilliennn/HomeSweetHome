import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './IMG_4545 1.png';

// Styles following UC1ui.txt design specifications
const styles = {
  page: {
    position: 'relative' as const,
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFDF5', // Quarter Pearl Lusta
  },
  loginCard: {
    position: 'relative' as const,
    width: '400px',
    maxWidth: '90%',
    padding: '40px 40px',
    background: '#F9DCD7', // Light pink
    borderRadius: '50px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #9DE2D0 0%, #C8ADD6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    padding: '10px',
    boxSizing: 'border-box' as const,
  },
  avatarImage: {
    width: '190%',
    height: '190%',
    objectFit: 'contain' as const,
    objectPosition: 'center',
  },
  formGroup: {
    width: '100%',
    maxWidth: '544px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '19px',
    lineHeight: '23px',
    color: '#000000',
    marginLeft: '16px',
  },
  input: {
    width: '100%',
    height: '56px',
    boxSizing: 'border-box' as const,
    background: '#F3F7FB',
    border: '5px solid #9B9B9B',
    borderRadius: '44px',
    padding: '0 24px',
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '18px',
    lineHeight: '100%',
    letterSpacing: '0.01em',
    color: '#333333',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  inputFocused: {
    borderColor: '#9DE2D0',
  },
  inputPlaceholder: {
    color: '#8B8B8B',
  },
  loginButton: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 32px',
    minWidth: '120px',
    height: '48px',
    background: '#EB8F80', // Apricot
    borderRadius: '19px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  loginButtonHover: {
    background: '#d87c6d',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(235, 143, 128, 0.4)',
  },
  loginButtonText: {
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '20px',
    lineHeight: '24px',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute' as const,
    bottom: '40px',
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'normal',
    fontWeight: 100,
    fontSize: '10px',
    lineHeight: '32px',
    color: '#666666',
  },
  errorMessage: {
    color: '#EB8F80',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    marginTop: '8px',
    textAlign: 'center' as const,
  },
};

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple client-side mock login — replace with real auth
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminId', 'admin-001');
    localStorage.setItem('adminName', username);

    setIsLoading(false);
    navigate('/admin');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.loginCard}>
        {/* Avatar / Logo Area */}
        <div style={styles.avatar}>
          <img src={logoImage} alt="HomeSweetHome Logo" style={styles.avatarImage} />
        </div>

        {/* Admin Account Field */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Admin Account</label>
          <input
            type="text"
            placeholder="Admin123"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...styles.input,
              ...(focusedField === 'username' ? styles.inputFocused : {}),
            }}
          />
        </div>

        {/* Password Field */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Password123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...styles.input,
              ...(focusedField === 'password' ? styles.inputFocused : {}),
            }}
          />
        </div>

        {/* Error Message */}
        {error && <p style={styles.errorMessage}>{error}</p>}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          style={{
            ...styles.loginButton,
            ...(isButtonHovered ? styles.loginButtonHover : {}),
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <span style={styles.loginButtonText}>
            {isLoading ? '...' : 'Log In'}
          </span>
        </button>
      </div>

      {/* Footer */}
      <p style={styles.footer}>2025 HomeSweetHome All rights reserved.</p>
    </div>
  );
};

export default AdminLogin;
