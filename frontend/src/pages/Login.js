import React, { useEffect, useRef, useState } from 'react';
import { auth, googleProvider } from '../firebase'; 
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { buildApiUrl } from '../utils/api';
import '../styles/Login.css';

const Login = ({ onLogin, onCancel }) => {
  const onLoginRef = useRef(onLogin);
  const isLocalDevelopment = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const [step, setStep] = useState('choice'); // choice, details
  const [mode, setMode] = useState('signup'); // signup, signin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const readErrorMessage = async (response, fallbackMessage) => {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        return payload?.error || payload?.message || fallbackMessage;
      }
      const text = await response.text();
      return text || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const normalizeAuthUser = (serverUser, fallbackUser = {}) => {
    const merged = { ...fallbackUser, ...(serverUser || {}) };
    const resolvedName =
      merged.name ||
      merged.displayName ||
      (merged.email ? merged.email.split('@')[0] : null) ||
      'User';

    return {
      ...merged,
      id: merged.id || merged._id,
      _id: merged._id || merged.id,
      name: resolvedName,
      displayName: merged.displayName || resolvedName,
      email: merged.email || fallbackUser.email || '',
      provider: merged.provider || fallbackUser.provider || 'email',
      type: merged.type || merged.provider || fallbackUser.provider || 'email'
    };
  };

  // ================ 1. LIVE VALIDATION LOGIC ================
  const validations = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@#$%&*!]/.test(password),
  };

  const allValid = Object.values(validations).every(Boolean);

  useEffect(() => {
    onLoginRef.current = onLogin;
  }, [onLogin]);

  useEffect(() => {
    const handleRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result) return;

        const user = result.user;
        const idToken = await user.getIdToken();
        const fallbackName = user.displayName || user.email?.split('@')[0] || 'User';

        const response = await fetch(buildApiUrl('/api/auth/google-login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: idToken,
            email: user.email,
            name: fallbackName,
            googleId: user.uid,
            uid: user.uid,
            profilePicture: user.photoURL
          })
        });

        if (!response.ok) {
          const message = await readErrorMessage(response, `Backend returned ${response.status}`);
          throw new Error(message);
        }

        const data = await response.json();
        const normalizedGoogleUser = normalizeAuthUser(data.user, {
          ...(data.user || {}),
          uid: user.uid,
          token: idToken,
          email: user.email,
          displayName: fallbackName,
          name: fallbackName,
          photoURL: user.photoURL,
          provider: 'google',
          type: 'google'
        });

        onLoginRef.current?.(normalizedGoogleUser);
        showStatus('Google sign-in successful.', 'success');
      } catch (error) {
        console.error('Google redirect login failed:', error);
      }
    };

    handleRedirectLogin();
  }, []);

  const showStatus = (text, type = 'error') => {
    setStatusMessage({ text, type });
  };

  const clearStatus = () => {
    setStatusMessage({ text: '', type: '' });
  };

  const resetEmailAuthFields = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setName('');
    setAge('');
    clearStatus();
  };

  const openEmailFlow = () => {
    resetEmailAuthFields();
    setMode('signup');
    setStep('details');
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
    setPassword('');
    setShowPassword(false);
    clearStatus();
  };

  // ================ 2. AUTH HANDLERS ================
  googleProvider.setCustomParameters({
  prompt: 'select_account'
});
  const handleGoogleSuccess = async () => {
    clearStatus();
    setLoading(true);
    try {
      if (!isLocalDevelopment) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const fallbackName = user.displayName || user.email?.split('@')[0] || 'User';

      const response = await fetch(buildApiUrl('/api/auth/google-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: idToken,
          email: user.email,
          name: fallbackName,
          googleId: user.uid,
          uid: user.uid,
          profilePicture: user.photoURL
        })
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, `Backend returned ${response.status}`);
        throw new Error(message);
      }

      const data = await response.json();
      const normalizedGoogleUser = normalizeAuthUser(data.user, {
        ...(data.user || {}),
        uid: user.uid,
        token: idToken,
        email: user.email,
        displayName: fallbackName,
        name: fallbackName,
        photoURL: user.photoURL,
        provider: 'google',
        type: 'google'
      });

      // Call onLogin to trigger redirect
      onLogin(normalizedGoogleUser);
      showStatus('Google sign-in successful.', 'success');
    } catch (error) {
      console.error('Google sign-in failed:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        showStatus('Google sign-in was cancelled.', 'warning');
      } else if (error.code === 'auth/unauthorized-domain') {
        showStatus('Google sign-in is blocked because this domain is not added in Firebase Authorized Domains.', 'error');
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error('Google sign-in redirect fallback failed:', redirectError);
          showStatus(redirectError.message || 'Google Sign-In Failed', 'error');
        }
      } else {
        showStatus(error.message || 'Google Sign-In Failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    clearStatus();
    if (!email || !password || (mode === 'signup' && (!name || !age))) {
      showStatus('Please fill in all fields.', 'warning');
      return;
    }

    if (mode === 'signup' && !allValid) {
      showStatus('Please fulfill all password requirements.', 'warning');
      return;
    }

    setLoading(true);
    try {
      let firebaseUser;

      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        // Sync with MongoDB for Signup
        const response = await fetch(buildApiUrl('/api/auth/signup'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, age, email, password, uid: firebaseUser.uid })
        });

          if (!response.ok) {
            const message = await readErrorMessage(response, 'Signup sync failed');
            throw new Error(message);
        }

        const data = await response.json();
        showStatus('Signup successful.', 'success');
        onLogin(normalizeAuthUser(data.user, {
          uid: firebaseUser.uid,
          name,
          email,
          provider: 'email',
          type: 'email'
        }));
      } else {
        // Sign In logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        // Fetch user from MongoDB for Signin
        const response = await fetch(buildApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, uid: firebaseUser.uid })
        });

          if (!response.ok) {
            const message = await readErrorMessage(response, 'Login sync failed');
            throw new Error(message);
        }

        const data = await response.json();
        showStatus('Login successful.', 'success');
        onLogin(normalizeAuthUser(data.user, {
          uid: firebaseUser.uid,
          email,
          provider: 'email',
          type: 'email'
        }));
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showStatus('Invalid email or password.', 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showStatus('Account already exists. Please Sign In instead.', 'warning');
        setMode('signin');
      } else {
        showStatus(error.message || 'Authentication failed.', 'error');
      }
      console.error('Email auth failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => onLogin({ name: 'Guest User', role: 'guest' });

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    handleEmailAuth();
  };

  return (
    <div className="login-page-wrapper" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/login_bg.jpeg')` }}>
      <button className="back-nav-btn" onClick={step === 'choice' ? onCancel : () => { setStep('choice'); clearStatus(); }}> 
        {step === 'choice' ? '✕ Close' : '← Back'} 
      </button>
      
      <div className="login-glass-card">
        <div className="avatar-circle">👤</div>

        {step === 'choice' && (
          <div className="login-content">
            <h2>Get Started!</h2>
            <button className="social-btn google" onClick={handleGoogleSuccess} disabled={loading}>
              <img src="https://cdn-icons-png.flaticon.com/128/300/300221.png" alt="Google" />
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
            <button className="social-btn mail" onClick={openEmailFlow}>
              <img src="https://cdn-icons-png.flaticon.com/128/732/732200.png" alt="Mail" /> Continue with Mail
            </button>
            <p className="guest-link" style={{ marginTop: '20px' }} onClick={handleGuestLogin}>Continue as Guest</p>
          </div>
        )}

        {step === 'details' && (
          <div className="login-content">
            <h2>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>

            {statusMessage.text && (
              <div className={`status-box ${statusMessage.type || 'info'}`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleEmailSubmit}>
              {mode === 'signup' && (
                <>
                  <input id="fullName" name="fullName" className="ui-field" type="text" placeholder="Full Name" value={name} autoComplete="off" onChange={(e)=>setName(e.target.value)} />
                  <input id="age" name="age" className="ui-field" type="number" placeholder="Age" value={age} autoComplete="off" onChange={(e)=>setAge(e.target.value)} />
                </>
              )}

              <input id="email" name="email" className="ui-field" type="email" placeholder="Email Address" value={email} autoComplete="off" onChange={(e)=>setEmail(e.target.value)} />
              <div className="password-field-wrap">
                <input
                  id="password"
                  name="password"
                  className="ui-field password-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  autoComplete="off"
                  onChange={(e)=>setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {mode === 'signup' && (
                <div className="password-checker">
                  <div className={`rule-row ${validations.length ? 'valid' : 'invalid'}`}><span className="rule-icon">{validations.length ? '✅' : '○'}</span><span>6+ Characters</span></div>
                  <div className={`rule-row ${validations.upper ? 'valid' : 'invalid'}`}><span className="rule-icon">{validations.upper ? '✅' : '○'}</span><span>Uppercase (A-Z)</span></div>
                  <div className={`rule-row ${validations.lower ? 'valid' : 'invalid'}`}><span className="rule-icon">{validations.lower ? '✅' : '○'}</span><span>Lowercase (a-z)</span></div>
                  <div className={`rule-row ${validations.number ? 'valid' : 'invalid'}`}><span className="rule-icon">{validations.number ? '✅' : '○'}</span><span>Number (0-9)</span></div>
                  <div className={`rule-row ${validations.special ? 'valid' : 'invalid'}`}><span className="rule-icon">{validations.special ? '✅' : '○'}</span><span>Symbol (@#$%&*!)</span></div>
                </div>
              )}

              <button
                type="submit"
                className="ui-continue-btn"
                disabled={loading || (mode === 'signup' && !allValid)}
              >
                {loading ? 'Processing...' : mode === 'signup' ? 'Finish & Login' : 'Sign In'}
              </button>
            </form>

            <p className="toggle-mode-text" style={{ marginTop: '15px', fontSize: '13px', color: '#fff' }}>
              {mode === 'signup' ? "Already have an account? " : "Don't have an account? "}
              <span 
                style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }} 
                onClick={toggleMode}
              >
                {mode === 'signup' ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;