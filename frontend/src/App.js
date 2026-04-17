import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot'; 
import Footer from './components/Footer';
import Login from './pages/Login';
import Home from './pages/Home';
import Theater from './pages/Theater';
import Payment from './pages/Payment';
import Feedback from './pages/Feedback';
import About from './pages/About';
import PaymentHistory from './pages/PaymentHistory';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import './App.css';
import { buildApiUrl, fetchJson } from './utils/api';
import { auth } from './firebase'; 
import { getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

// --- CONFIGURATION & UTILS ---
const BOOKING_STORAGE_KEY = 'bookmyseat_currentBooking';
const MOVIE_STORAGE_KEY = 'bookmyseat_selectedMovie';
const VIEW_STORAGE_KEY = 'bookmyseat_currentView';
const SEAT_SELECTION_STORAGE_KEY = 'bookmyseat_selectedSeats';

const parseStoredJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeUserProfile = (rawUser) => {
  if (!rawUser) return null;
  const preferredName =
    rawUser.name ||
    rawUser.displayName ||
    rawUser.fullName ||
    (rawUser.email ? rawUser.email.split('@')[0] : 'User');

  return {
    ...rawUser,
    id: rawUser.id || rawUser._id || rawUser.uid,
    name: preferredName,
  };
};

function App() {
  // ================ 1. STATE INITIALIZATION ================
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = parseStoredJson('user');
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (!savedUser || savedUser.role !== 'guest') {
      return savedView || 'login';
    }
    return savedView || 'home';
  });
  const [selectedMovie, setSelectedMovie] = useState(() => parseStoredJson(MOVIE_STORAGE_KEY));
  const [currentBooking, setCurrentBooking] = useState(() => parseStoredJson(BOOKING_STORAGE_KEY));
  const [allMovies, setAllMovies] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [unreadNotificationCount] = useState(0);
  const [globalNotice] = useState({ text: '', type: '' });

  const effectiveBooking = currentBooking || parseStoredJson(BOOKING_STORAGE_KEY);
  const normalizedMoviesForChat = allMovies.map((movie) => ({
    id: movie.id || movie._id,
    title: movie.title || movie.name,
    genre: movie.genre || '',
  }));
  const bookingHistoryForChat = bookingHistory.map((booking) => ({
    id: booking.id || booking._id,
    movieName: booking.movieName,
    genre: booking.genre || '',
    status: booking.status,
    seats: booking.seats || [],
  }));

  // ================ 2. AUTHENTICATION & DATA EFFECTS ================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const savedUser = parseStoredJson('user');
        const normalized = normalizeUserProfile({ ...savedUser, uid: firebaseUser.uid, email: firebaseUser.email });
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } else {
        const savedUser = parseStoredJson('user');
        if (savedUser?.role === 'guest') {
          setUser(normalizeUserProfile(savedUser));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const finalizeGoogleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) return;

        const firebaseUser = result.user;
        const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        const idToken = await firebaseUser.getIdToken();

        const normalizedFromFirebase = normalizeUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: fallbackName,
          displayName: fallbackName,
          provider: 'google',
          type: 'google'
        });

        // Don't block navigation on backend sync; user should land on Home right after Google auth.
        setUser(normalizedFromFirebase);
        localStorage.setItem('user', JSON.stringify(normalizedFromFirebase));
        setCurrentView('home');
        setSidebarOpen(false);

        const response = await fetch(buildApiUrl('/api/auth/google-login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: idToken,
            email: firebaseUser.email,
            name: fallbackName,
            googleId: firebaseUser.uid,
            uid: firebaseUser.uid,
            profilePicture: firebaseUser.photoURL,
          }),
        });

        if (!response.ok) {
          console.error('Google backend sync failed:', response.status);
          return;
        }

        const data = await response.json();
        const normalized = normalizeUserProfile({
          ...(data.user || {}),
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: fallbackName,
          displayName: fallbackName,
          provider: 'google',
        });

        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch (error) {
        console.error('Google redirect handling failed:', error);
      }
    };

    finalizeGoogleRedirect();
  }, []);

  useEffect(() => {
    if (!authLoading && !user && currentView !== 'login') {
      setCurrentView('login');
      setSidebarOpen(false);
    }
  }, [authLoading, user, currentView]);

  useEffect(() => {
    // Fail-safe redirect: any successful auth state should leave login screen immediately.
    if (!authLoading && user && currentView === 'login') {
      setCurrentView('home');
      setSidebarOpen(false);
    }
  }, [authLoading, user, currentView]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const movies = await fetchJson('/api/movies');
        setAllMovies(movies || []);
        if (user && user.role !== 'guest') {
          const emailQuery = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
          const historyResponse = await fetchJson(`/api/payments/history/${user.id || user._id || user.uid}${emailQuery}`);
          setBookingHistory(historyResponse?.history || []);
        }
      } catch (err) { setBookingHistory([]); }
    };
    fetchGlobalData();
  }, [user]);

  // Persistent View State
  useEffect(() => { localStorage.setItem(VIEW_STORAGE_KEY, currentView); }, [currentView]);

  useEffect(() => {
    if (selectedMovie) {
      localStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(selectedMovie));
    } else {
      localStorage.removeItem(MOVIE_STORAGE_KEY);
    }
  }, [selectedMovie]);

  useEffect(() => {
    if (currentBooking) {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(currentBooking));
    }
  }, [currentBooking]);

  // ================ 3. HANDLERS ================
  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) {}
    localStorage.removeItem('user');
    localStorage.removeItem(BOOKING_STORAGE_KEY);
    localStorage.removeItem(MOVIE_STORAGE_KEY);
    localStorage.removeItem(SEAT_SELECTION_STORAGE_KEY);
    setUser(null);
    setSelectedMovie(null);
    setCurrentBooking(null);
    setBookingHistory([]);
    setCurrentView('login');
    setSidebarOpen(false);
  };

  const goBackToHome = () => {
    setCurrentView('home');
    setSelectedMovie(null);
    setCurrentBooking(null);
    setHomeSearchQuery('');
    setSidebarOpen(false);
  };

  const openSignIn = () => {
    setCurrentView('login');
    setSidebarOpen(false);
  };

  const navigateToView = (view) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const buildTheaterMovieContext = () => {
    if (selectedMovie) return selectedMovie;
    if (!effectiveBooking) return null;

    const bookingMovieId = effectiveBooking.movieId;
    const bookingMovieName = effectiveBooking.movieName;

    const matchedMovie = allMovies.find((movie) => {
      const movieId = movie._id || movie.id;
      const movieTitle = movie.title || movie.name;
      return (
        (bookingMovieId && movieId && String(movieId) === String(bookingMovieId)) ||
        (bookingMovieName && movieTitle && String(movieTitle).toLowerCase() === String(bookingMovieName).toLowerCase())
      );
    });

    if (matchedMovie) return matchedMovie;
    return {
      id: bookingMovieId || bookingMovieName || 'movie',
      _id: bookingMovieId || undefined,
      title: bookingMovieName || 'Selected Movie',
    };
  };

  const handleEditSeatsNavigation = () => {
    const movieContext = buildTheaterMovieContext();
    if (movieContext) {
      setSelectedMovie(movieContext);
    }
    setCurrentView('theater');
    setSidebarOpen(false);
  };

  const resolveMovieSelection = (movie) => {
    if (!movie) return movie;
    if (movie?._id) return movie;

    const selectedId = String(movie?.id || '').trim();
    const selectedTitle = String(movie?.title || movie?.name || '').trim().toLowerCase();
    const matched = allMovies.find((item) => {
      const itemId = String(item?._id || item?.id || '').trim();
      const itemTitle = String(item?.title || item?.name || '').trim().toLowerCase();
      return (selectedId && itemId && selectedId === itemId) || (selectedTitle && itemTitle && selectedTitle === itemTitle);
    });

    return matched || movie;
  };

  const navigationItems = [
    { key: 'home', label: 'Home', onClick: goBackToHome },
    { key: 'about', label: 'About', onClick: () => navigateToView('about') },
    { key: 'profile', label: 'Profile', onClick: () => navigateToView('profile') },
    { key: 'payment-history', label: 'Payment History', onClick: () => navigateToView('payment-history') },
    { key: 'notifications', label: 'Notifications', onClick: () => navigateToView('notifications') },
    ...(user
      ? [{ key: 'sign-out', label: 'Sign Out', onClick: handleLogout }]
      : [{ key: 'sign-in', label: 'Sign In', onClick: openSignIn }]),
  ];

  const handleLogin = (userInfo) => {
    const normalized = normalizeUserProfile(userInfo);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
    setCurrentView('home');
    setSidebarOpen(false);
  };

  // ================ 4. UI LOGIC VARIABLES ================
  const isAboutView = currentView === 'about';
  const isHomeView = currentView === 'home';
  const shouldShowGlobalNavbar = !['payment', 'theater'].includes(currentView);
  const minimalNavbarViews = ['payment-history', 'notifications', 'profile'];
  const hideCenteredTitleViews = ['about', 'profile', 'notifications', 'payment-history'];
  const currentPageTitle = currentView === 'home' || hideCenteredTitleViews.includes(currentView) ? '' : 'BookMySeat';
  const shouldShowChatbot = currentView !== 'payment';
  const theaterMovieContext = buildTheaterMovieContext();

  if (authLoading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app-wrapper">
      {shouldShowGlobalNavbar && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onLogoClick={goBackToHome}
          onSignIn={openSignIn}
          onAbout={() => setCurrentView('about')}
          toggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          compact={isAboutView}
          homeMode={isHomeView}
          pageTitle={currentPageTitle}
          minimalMode={minimalNavbarViews.includes(currentView)}
          searchValue={homeSearchQuery}
          onSearchChange={setHomeSearchQuery}
          showNotificationDot={unreadNotificationCount > 0}
        />
      )}

      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}>
         <div className="sidebar-menu" onClick={(e) => e.stopPropagation()}>
           <div className="sidebar-header">
             <h3>Menu</h3>
           </div>
           {navigationItems.map((item) => (
             <h3
               key={item.key}
               onClick={item.onClick}
               className={item.key === 'sign-out' ? 'signout-link' : ''}
               role="button"
               tabIndex={0}
             >
               {item.label}
             </h3>
           ))}
         </div>
      </div>

      {shouldShowChatbot && (
        <Chatbot 
          user={user} 
          availableMovies={normalizedMoviesForChat} 
          movieHistory={bookingHistoryForChat} 
        />
      )}

      <main className="content-area">
        {globalNotice.text && <div className={`notice ${globalNotice.type}`}>{globalNotice.text}</div>}

        {currentView === 'home' && <Home onSelectMovie={(m) => { setSelectedMovie(resolveMovieSelection(m)); setCurrentView('theater'); }} searchQuery={homeSearchQuery} />}
        {currentView === 'theater' && theaterMovieContext && (
          <Theater
            movie={theaterMovieContext}
            user={user}
            setSidebarOpen={setSidebarOpen}
            onBack={goBackToHome}
            onBookingConfirm={(b) => { setCurrentBooking(b); setCurrentView('payment'); }}
            initialBooking={effectiveBooking}
          />
        )}
        {currentView === 'payment' && effectiveBooking && (
          <Payment
            booking={effectiveBooking}
            user={user}
            onPaymentSuccess={() => setCurrentView('profile')}
            onEditSeats={handleEditSeatsNavigation}
            menuItems={navigationItems}
          />
        )}
        {currentView === 'feedback' && <Feedback onBack={goBackToHome} />}
        {currentView === 'login' && <Login onLogin={handleLogin} onCancel={goBackToHome} />}
        {currentView === 'about' && <About />}
        {currentView === 'profile' && <Profile user={user} />}
        {currentView === 'notifications' && <Notifications user={user} />}
        {currentView === 'payment-history' && <PaymentHistory user={user} />}
      </main>

      <Footer />
    </div>
  );
}

export default App;