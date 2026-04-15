import React, { useState } from 'react';

const Navbar = ({
  user,
  onLogout,
  onLogoClick,
  onSignIn,
  onAbout,
  toggleSidebar,
  isSidebarOpen,
  compact = false,
  homeMode = false,
  pageTitle = '',
  minimalMode = false,
  searchValue = '',
  onSearchChange,
  showNotificationDot = false
}) => {
  const [location, setLocation] = useState("Chennai");
  const locations = ["Chennai", "Tirunelveli", "Bangalore", "Tuticorin", "Chengalpet", "Others"];

  // Determine the display name safely
  const displayName = user?.name || user?.displayName || (typeof user === 'string' ? user : 'Guest');
  const showHomeSearch = homeMode;
  const showAboutButton = !compact && !homeMode && !minimalMode;
  const showLocationControls = !compact && !homeMode && !minimalMode;
  const showCenteredTitle = !homeMode && Boolean(pageTitle);

  return (
    <nav className={`main-navbar ${minimalMode ? 'minimal-navbar' : ''}`}>
      {/* --- LEFT: Logo & About --- */}
      <div className="nav-left">
        <div className="logo-text" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          Book<span style={{color: '#ff0000'}}>My</span>Seat AI
        </div>
 
      </div>

      {showCenteredTitle && (
        <div className="nav-page-title">
          <h2>{pageTitle}</h2>
        </div>
      )}

      {/* --- CENTER: Search Bar --- */}
      {(showHomeSearch || !compact) && (
        <div className="nav-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for movies..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
        </div>
      )}

      {/* --- RIGHT: Location, Auth & Hamburger --- */}
      <div className="nav-right">
        {showLocationControls && (
          <select 
            className="location-select" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        )}

        {!user ? (
          <button className="nav-signin-btn" onClick={onSignIn}>Sign In</button>
        ) : (
          <div className="user-section">
            <span className="user-greeting">Hi, <span style={{ color: '#ff4d4d' }}>{displayName}</span></span>
            <button className="sign-out-btn" onClick={onLogout}>Sign Out</button>
          </div>
        )}

        {/* Global Hamburger Icon */}
        <div className="hamburger" onClick={toggleSidebar} role="button" tabIndex={0} aria-label="Open menu">
          ☰
          {showNotificationDot && <span className="hamburger-notification-dot"></span>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;