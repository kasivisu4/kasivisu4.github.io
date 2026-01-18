import React from 'react';
import { FaGamepad } from 'react-icons/fa';
import './FunActivity.css';

const FunActivity = () => {
  return (
    <section className="fun-activity-section">
      <h2 className="section-title">
        <div className="title-text">
          <span className="section-title-accent">J</span>ust for Fun
        </div>
      </h2>
      
      <div className="fun-activity-card">
        <div className="card-header">
          <h3><FaGamepad /> Emoji Finder (Build with D3 Observable)</h3>
        </div>

        <p className="fun-activity-description">
          A little interactive experiment I built while playing with D3.js force layouts and Observable.
        </p>
        
        <div className="fun-activity-iframe-wrapper">
          <iframe 
            width="100%" 
            height="562" 
            frameBorder="0"
            src="https://observablehq.com/embed/@kasivisu4/emoji-finder@752?cells=find_emoji%2Cemoji"
            title="Emoji Finder"
          ></iframe> 
        </div>
      </div>
    </section>
  );
};

export default FunActivity;
