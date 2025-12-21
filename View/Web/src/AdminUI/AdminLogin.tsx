import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './IMG_4545 1.png';

// CSS Keyframes for animations (injected via style tag)
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.03);
      box-shadow: 0 12px 40px rgba(157, 226, 208, 0.3);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes floatBubble1 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
  
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes floatHeart {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes sparkle {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.2);
    }
  }
`;



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
    animation: 'fadeInUp 0.6s ease-out forwards',
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
    transition: 'all 0.3s ease',
  },
  inputFocused: {
    border: '5px solid #9DE2D0',
    transform: 'scale(1.02)',
    boxShadow: '0 4px 20px rgba(157, 226, 208, 0.3)',
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
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
  },
  loginButtonHover: {
    background: '#d87c6d',
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: '0 8px 25px rgba(235, 143, 128, 0.5)',
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
    animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
    opacity: 0,
  },
  errorMessage: {
    color: '#EB8F80',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    marginTop: '8px',
    textAlign: 'center' as const,
    animation: 'fadeInUp 0.3s ease-out',
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

  // Inject animation styles on mount
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);


  const handleLogin = async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hardcoded admin credentials
    const validAdmins = [
      { username: 'admin001', password: 'password123', name: 'Admin One' },
      { username: 'admin002', password: 'password123', name: 'Admin Two' },
    ];

    const admin = validAdmins.find(
      a => a.username === username.trim() && a.password === password
    );

    if (admin) {
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminId', admin.username);
      localStorage.setItem('adminName', admin.name);
      setIsLoading(false);
      navigate('/admin');
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
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
