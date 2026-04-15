import React, { useMemo, useState } from 'react';

const MovieCard = ({ movie }) => {
  const title = movie.title || movie.name || 'Unknown Title';
  const poster = movie.poster || movie.img || '';
  const rating = movie.rating || 'N/A';
  const votes = movie.votes || '0';
  const [useFallbackImage, setUseFallbackImage] = useState(!poster);

  const safePoster = useMemo(() => {
    if (!poster) return '';
    return encodeURI(poster);
  }, [poster]);

  return (
    <div className="movie-card">
      <div className="card-image">
        {!useFallbackImage ? (
          <img src={safePoster} alt={title} onError={() => setUseFallbackImage(true)} />
        ) : (
          <div className="image-placeholder">{title.charAt(0)}</div>
        )}
        <div className="rating-tag">★ {rating}/10 <span>{votes} Votes</span></div>
      </div>
      <h3>{title}</h3>
      <p>{movie.genre}</p>
    </div>
  );
};

export default MovieCard;