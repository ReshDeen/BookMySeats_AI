import React, { useState } from 'react';
import MovieCard from '../components/MovieCard';

const Home = ({ onSelectMovie, searchQuery = '' }) => {
  const [activeSlide, setActiveSlide] = useState(1);

  const bannerMovies = [
    { id: 'b1', title: 'Amaran', poster: '/images/A.jpeg' },
    { id: 'b2', title: 'Jana Nayagan', poster: '/images/JN.jpeg' },
    { id: 'b3', title: 'Pathu Thala', poster: '/images/P.jpeg' },
    { id: 'b4', title: 'Thunivu', poster: '/images/T.jpeg' }
  ];

  const recommendedMovies = [
    { id: '1', title: 'Bison', genre: 'Drama/Sports', poster: '/images/bison.jpeg' },
    { id: '2', title: 'King of Kotha', genre: 'Action/Crime', poster: '/images/Kotha.jpeg' },
    { id: '3', title: 'Dhurandhar', genre: 'Action/Thriller', poster: '/images/durandhar.jpeg' },
    { id: '4', title: 'Parasakthi', genre: 'Drama/Social', poster: '/images/parasakthi.jpeg' },
    { id: '5', title: 'The Paradise', genre: 'Action/Thriller', poster: '/images/Paradise.jpeg' },
    { id: '6', title: 'Retro', genre: 'Action/Drama', poster: '/images/retro.jpeg' },
    { id: '7', title: 'Sarpatta Parambarai', genre: 'Action/Sports', poster: '/images/sarpata.jpeg' },
    { id: '8', title: 'Mahaan', genre: 'Action/Drama', poster: '/images/mahaan.jpeg' },
    { id: '9', title: 'Jai Bhim', genre: 'Legal/Drama', poster: '/images/jaibeem.jpeg' },
    { id: '10', title: 'Raayan', genre: 'Action/Thriller', poster: '/images/Raayan.jpeg' },
    { id: '11', title: 'Amaran', genre: 'Action/Thriller', poster: '/images/Amaran.jpeg' },
    // { id: '12', title: 'Thunivu', genre: 'Action/Thriller', poster: '/images/Thunivu.jpeg' },
    { id: '12', title: 'Sirai', genre: 'Action/Thriller', poster: '/images/sirai.jpeg' },
    { id: '13', title: 'Pathu Thala', genre: 'Action/Thriller', poster: '/images/Pathu.jpeg' },
    { id: '14', title: 'Jana Nayagan', genre: 'Action/Thriller', poster: '/images/Jana.jpeg' },
    { id: '15', title: 'Meiyazlagan', genre: 'Action/Thriller', poster: '/images/Mei.jpeg' }




  ];
  

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredRecommendedMovies = normalizedSearchQuery
    ? recommendedMovies.filter((movie) => movie.title.toLowerCase().includes(normalizedSearchQuery))
    : recommendedMovies;

  return (
    <div className="home-container">

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="banner-wrapper">
          {bannerMovies.map((movie, index) => (
            <div 
              key={movie.id}
              className={`banner ${index === activeSlide ? 'main' : 'side'}`}
              onMouseEnter={() => setActiveSlide(index)}
            >
              <img src={movie.poster} alt={movie.title} />
              {index === activeSlide && (
                <div className="hero-overlay">
                  <button className="book-seats-btn" onClick={() => onSelectMovie(movie)}>
                    Book Seats
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      

      {/* --- RECOMMENDED SECTION --- */}
      <section className="movie-section">
        <h2 className="section-title">Recommended <span style={{color: '#ff4d4d'}}>Movies</span></h2> 
        {/* Note this */}
        <div className="movie-grid">
          {filteredRecommendedMovies.map(movie => (
            <div key={movie.id} className="movie-card-wrapper" onClick={() => onSelectMovie(movie)}>
              <MovieCard movie={movie} />
            </div>
          ))}
          
        </div>
        {filteredRecommendedMovies.length === 0 && (
          <p style={{ marginTop: '18px', color: '#d0d0d0' }}>No matching <span style={{color: '#ff4d4d'}}>Movies</span> found.</p>
        )}
      </section>

      
      
    </div>
    
  );
};

export default Home;