import React from 'react';
import '../styles/About.css';

const About = ({ user }) => {
  const displayName = user?.name || user?.displayName || 'Guest User';
  const techTags = ['React.js', 'Node.js', 'MongoDB', 'Express', 'JWT', 'Bcrypt'];

  return (
    <div className="aboutus-page">
      <div className="aboutus-overlay"></div>

      <header className="aboutus-header">
        <p className="aboutus-kicker">Designed, Developed, Delivered</p>
        <h1>About <span style={{color: '#ff4d4d'}}>BookMySeat</span> AI</h1>
        <p className="aboutus-subtitle">
          Built for smooth discovery, seat booking, and secure checkout with a modern AI-supported flow.
        </p>
      </header>

      <section className="aboutus-grid" aria-label="About BookMySeat AI details">
        <article className="aboutus-card aboutus-card-1">
          <h2>The Product</h2>
          <p>
            BookMySeat AI is a seamless movie ticketing ecosystem for discovering films, choosing real-time seats,
            and finishing payments with minimal friction.
          </p>
          <p className="aboutus-meta">
            Stack Used: <span>MERN (MongoDB, Express, React, Node)</span>
          </p>
          <a
            className="aboutus-inline-link"
            href="https://github.com/ReshDeen/BookMySeats_AI"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository <span aria-hidden="true">→</span>
          </a>
        </article>

        <article className="aboutus-card aboutus-card-2">
          <h2>AI Assistant Integration</h2>
          <p>
            The AI layer powers refined UI adjustments, smart seat-selection state persistence across navigation,
            and automated risk-assessment logic that helps keep booking flow decisions consistent and reliable.
          </p>
        </article>

        <article className="aboutus-card aboutus-card-3">
          <h2>The Developer</h2>
          <p className="aboutus-dev-name">Reshma Banu Tajudeen</p>
          <p className="aboutus-dev-role">Full Stack Web Developer</p>
          <p>
            Focused on production-ready MERN applications with clean UX architecture, modular frontend systems,
            and scalable backend APIs.
          </p>

          <div className="aboutus-actions">
            <a href="linkedin.com/in/reshma-banu-t-1306332b0" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>
            <a href="https://github.com/ReshDeen" target="_blank" rel="noopener noreferrer">GitHub Profile</a>
            <a href="https://reshdeen.github.io/Portfolio/" target="_blank" rel="noopener noreferrer">Portfolio Link</a>
          </div>

          <a className="aboutus-mail-btn" href="mailto:deenresh@gmail.com">
            Contact via Mail
          </a>
        </article>

        <article className="aboutus-card aboutus-card-4">
          <h2>Technology Stack</h2>
          <p>Core technologies used in BookMySeat AI:</p>
          <div className="aboutus-tags" aria-label="Technology list">
            {techTags.map((tech) => (
              <span key={tech} className="aboutus-tag">{tech}</span>
            ))}
          </div>
        </article>
      </section>


    </div>
  );
};

export default About;
