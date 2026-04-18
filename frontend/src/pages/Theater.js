import React, { useState, useEffect } from 'react';
import '../styles/Theater.css';

const SEAT_SELECTION_STORAGE_KEY = 'bookmyseat_selectedSeats';
const MOVIE_STORAGE_KEY = 'bookmyseat_selectedMovie';
const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));
const normalizeTitle = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const Theater = ({ movie, user, setSidebarOpen, onBookingConfirm, initialBooking }) => {
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [statusCard, setStatusCard] = useState({ text: '', type: '' });
  const [resolvedMovieId, setResolvedMovieId] = useState(() => (isObjectId(movie?._id) ? movie._id : null));
  const [resolvedMovieName, setResolvedMovieName] = useState(() => movie?.title || movie?.name || 'Jana Nayagan');
  const [isMovieLoading, setIsMovieLoading] = useState(false);
  
  const ELITE_ROWS = ['A', 'B'];
  const CLASSIC_ROWS = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

  useEffect(() => {
    const directMovieId = movie?._id || movie?.id;
    if (isObjectId(directMovieId)) {
      let mounted = true;
      const loadMovieById = async () => {
        setIsMovieLoading(true);
        try {
          const response = await fetch(`/api/movies/${directMovieId}`);
          if (!response.ok) {
            throw new Error('movie-fetch-failed');
          }
          const data = await response.json();
          if (mounted && isObjectId(data?._id)) {
            setResolvedMovieId(String(data._id));
            setResolvedMovieName(data?.title || data?.name || movie?.title || movie?.name || 'Jana Nayagan');
            localStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(data));
            setStatusCard({ text: '', type: '' });
          }
        } catch (error) {
          if (mounted) {
            setResolvedMovieId(String(directMovieId));
            setResolvedMovieName(movie?.title || movie?.name || 'Jana Nayagan');
            setStatusCard({ text: '', type: '' });
          }
        } finally {
          if (mounted) {
            setIsMovieLoading(false);
          }
        }
      };

      loadMovieById();
      return () => {
        mounted = false;
      };
    }

    const movieTitle = String(movie?.title || movie?.name || '').trim();
    const normalizedMovieTitle = normalizeTitle(movieTitle);
    if (!movieTitle) {
      setResolvedMovieId(null);
      setResolvedMovieName(movie?.title || movie?.name || 'Jana Nayagan');
      setIsMovieLoading(false);
      return;
    }

    try {
      const storedMovieRaw = localStorage.getItem(MOVIE_STORAGE_KEY);
      const storedMovie = storedMovieRaw ? JSON.parse(storedMovieRaw) : null;
      const storedTitle = normalizeTitle(storedMovie?.title || storedMovie?.name);
      if (isObjectId(storedMovie?._id) && storedTitle && storedTitle === normalizedMovieTitle) {
        setResolvedMovieId(String(storedMovie._id));
        setResolvedMovieName(storedMovie?.title || storedMovie?.name || movieTitle || 'Jana Nayagan');
        setStatusCard({ text: '', type: '' });
        return;
      }
    } catch {
      // Ignore localStorage parsing issues and continue with API resolution.
    }

    let mounted = true;
    const resolveMovie = async () => {
      setIsMovieLoading(true);
      try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
          throw new Error('movie-list-fetch-failed');
        }

        const movies = await response.json();
        const matched = (movies || []).find((item) => {
          const title = String(item?.title || item?.name || '').trim();
          const normalizedTitle = normalizeTitle(title);
          return (
            isObjectId(item?._id) &&
            normalizedTitle &&
            (normalizedTitle === normalizedMovieTitle ||
              normalizedTitle.includes(normalizedMovieTitle) ||
              normalizedMovieTitle.includes(normalizedTitle))
          );
        });

        if (mounted) {
          if (matched?._id) {
            setResolvedMovieId(String(matched._id));
            setResolvedMovieName(matched?.title || matched?.name || movie?.title || movie?.name || 'Jana Nayagan');
            localStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(matched));
            setStatusCard({ text: '', type: '' });
          } else {
            setResolvedMovieId(null);
            setResolvedMovieName(movie?.title || movie?.name || 'Jana Nayagan');
            setStatusCard({ text: '', type: '' });
          }
        }
      } catch (error) {
        if (mounted) {
          setResolvedMovieId(null);
          setResolvedMovieName(movie?.title || movie?.name || 'Jana Nayagan');
          setStatusCard({ text: 'Unable to load movie details right now. Please try again.', type: 'error' });
        }
      } finally {
        if (mounted) {
          setIsMovieLoading(false);
        }
      }
    };

    resolveMovie();
    return () => {
      mounted = false;
    };
  }, [movie]);

  useEffect(() => {
    if (!resolvedMovieId) {
      return;
    }

    const loadBookedSeats = async () => {
      try {
        const response = await fetch(`/api/bookings/seats/${resolvedMovieId}`);
        if (!response.ok) {
          throw new Error('Unable to fetch booked seats');
        }
        const data = await response.json();
        setBookedSeats(data.bookedSeats || []);
        setStatusCard({ text: '', type: '' });
      } catch (error) {
        setBookedSeats([]);
        setStatusCard({ text: '', type: '' });
      }
    };

    loadBookedSeats();
  }, [resolvedMovieId]);

  useEffect(() => {
    let storedSeats = [];

    try {
      const storedRaw = localStorage.getItem(SEAT_SELECTION_STORAGE_KEY);
      storedSeats = storedRaw ? JSON.parse(storedRaw) : [];
    } catch {
      storedSeats = [];
    }

    const bookingSeats = initialBooking?.seats || [];

    if (bookingSeats.length > 0) {
      setSelectedSeats(bookingSeats);
      return;
    }

    setSelectedSeats(Array.isArray(storedSeats) ? storedSeats : []);
  }, [initialBooking]);

  useEffect(() => {
    localStorage.setItem(SEAT_SELECTION_STORAGE_KEY, JSON.stringify(selectedSeats));
  }, [selectedSeats]);

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setStatusCard({ text: 'Please select at least one seat to continue.', type: 'warning' });
      return;
    }

    if (typeof onBookingConfirm !== 'function') {
      setStatusCard({ text: 'Unable to continue to payment right now.', type: 'error' });
      return;
    }

    const fallbackMovieId = resolvedMovieId || movie?._id || movie?.id;
    const fallbackMovieName = resolvedMovieName || movie?.title || movie?.name;
    if (!fallbackMovieName) {
      setStatusCard({ text: 'Unable to continue without movie details. Please return to Home and select the movie again.', type: 'warning' });
      return;
    }

    const parsedShowDate = new Date(new Date().toISOString().split('T')[0]);
    if (Number.isNaN(parsedShowDate.getTime())) {
      setStatusCard({ text: 'Unable to continue right now. Please try again.', type: 'error' });
      return;
    }

    const bookingData = {
      userId: user?._id || user?.id || user?.uid,
      movieId: fallbackMovieId,
      movieName: fallbackMovieName,
      movieGenre: movie?.genre || '',
      poster: movie?.poster || movie?.img || '',
      language: movie?.language || '',
      duration: movie?.duration || '',
      ageGroup: movie?.ageGroup || 'UA',
      seats: selectedSeats,
      totalPrice: selectedSeats.length * 150,
      showDate: new Date().toISOString().split('T')[0],
      showTime: "7:00 PM"
    };

    localStorage.setItem(SEAT_SELECTION_STORAGE_KEY, JSON.stringify(selectedSeats));
    localStorage.setItem('bookmyseat_currentBooking', JSON.stringify(bookingData));
    
    onBookingConfirm(bookingData);
  };

  const renderRow = (row) => (
    <div key={row} className="seat-row">
      <span className="row-id">{row}</span>
      {Array.from({ length: 20 }, (_, i) => {
        const seatNum = i + 1;
        const id = `${row}${seatNum}`;
        const status = bookedSeats.includes(id) ? 'booked' : selectedSeats.includes(id) ? 'selected' : 'available';
        return (
          <React.Fragment key={id}>
            <button 
              className={`seat-unit ${status}`} 
              onClick={() => toggleSeat(id)}
              disabled={status === 'booked'}
            >
              {seatNum}
            </button>
            {seatNum === 10 && <div className="seat-aisle-gap"></div>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="theater-page">
      <nav className="main-navbar theater-nav-fixed">
        <div className="nav-left">
          <div className="logo-text big-logo">BookMySeat <span>AI</span></div>
        </div>
        <div className="nav-center-title">
          <h2>Seat Selection</h2>
        </div>
        <div className="nav-right">
          <div className="hamburger" onClick={() => setSidebarOpen((prev) => !prev)}>☰</div>
        </div>
      </nav>

      <div className="theater-content-container">
        {statusCard.text && (
          <div className={`theater-status-card ${statusCard.type || 'info'}`}>
            {statusCard.text}
          </div>
        )}

        <div className="movie-info-header">
          <h3>Now Booking: <span className="highlight-movie">{resolvedMovieName || movie?.title || "Jana Nayagan"}</span></h3>
        </div>

        <div className="theater-card-container reduced-card">
          <div className="screen-container">
             <div className="screen-visual"></div>
             <p className="screen-text">SCREEN</p>
          </div>

          <div className="seats-scroll-area">
            <div className="seat-category-label">₹150 ELITE</div>
            {ELITE_ROWS.map(row => renderRow(row))}

            <div className="seat-category-label">₹120 CLASSIC</div>
            {CLASSIC_ROWS.map(row => renderRow(row))}
          </div>

          <div className="seat-legend">
              <div className="legend-item"><div className="box available-box"></div><span>Available</span></div>
              <div className="legend-item"><div className="box selected-box"></div><span>Selected</span></div>
              <div className="legend-item"><div className="box booked-box"></div><span>Sold</span></div>
          </div>

          <div className="selection-summary">
            <p>Selected Seats: <b>{selectedSeats.join(', ') || 'None'}</b></p>
            <button 
                className="pay-btn" 
              disabled={selectedSeats.length === 0 || isMovieLoading || !(resolvedMovieName || movie?.title || movie?.name)}
                onClick={handleProceedToPayment}
            >
              PROCEED TO PAY (₹{selectedSeats.length * 150})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Theater;