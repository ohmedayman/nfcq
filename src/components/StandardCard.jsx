import React, { useState } from 'react';
import './StandardCard.css';

export default function StandardCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="standard-card-container" onClick={() => setFlipped(!flipped)}>
      <div className={`standard-card-inner ${flipped ? 'flipped' : ''}`}>
        
        {/* Front of Card */}
        <div className="standard-card-front">
          <div className="sc-header">
            <div className="sc-logo">
              <span className="sc-lamsa-text">Lamsa</span>
              <svg className="sc-nfc-wave" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 8C10 8 16 14 16 21" />
                <path d="M7 8C11.5 8 15 11.5 15 16" />
                <path d="M11 8c3 0 5 3 5 6" />
              </svg>
            </div>
            <div className="sc-title">Standard Card</div>
          </div>
          
          <div className="sc-footer">
            <div className="sc-qr-container">
              {/* Fake QR Code look */}
              <div className="sc-qr">
                <svg viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer squares */}
                  <rect x="10" y="10" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4"/>
                  <rect x="15" y="15" width="10" height="10"/>
                  
                  <rect x="70" y="10" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4"/>
                  <rect x="75" y="15" width="10" height="10"/>
                  
                  <rect x="10" y="70" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4"/>
                  <rect x="15" y="75" width="10" height="10"/>

                  {/* Random inner patterns */}
                  <rect x="40" y="10" width="10" height="10"/>
                  <rect x="55" y="20" width="10" height="10"/>
                  <rect x="40" y="30" width="20" height="10"/>
                  <rect x="10" y="40" width="10" height="10"/>
                  <rect x="25" y="40" width="20" height="10"/>
                  <rect x="60" y="40" width="30" height="10"/>
                  <rect x="70" y="60" width="10" height="20"/>
                  <rect x="40" y="55" width="15" height="15"/>
                  <rect x="10" y="60" width="20" height="5"/>
                  <rect x="40" y="75" width="25" height="15"/>
                  <rect x="80" y="80" width="10" height="10"/>
                </svg>
              </div>
              <div className="sc-link">lamsa.ink</div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className="standard-card-back">
          <div className="sc-back-logo">
            <span className="sc-lamsa-text">Lamsa</span>
            <svg className="sc-nfc-wave" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 8C10 8 16 14 16 21" />
              <path d="M7 8C11.5 8 15 11.5 15 16" />
              <path d="M11 8c3 0 5 3 5 6" />
            </svg>
          </div>
          <div className="sc-back-footer">
            <div className="sc-back-link">lamsa.ink</div>
            <div className="sc-back-icon">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 12v-2a8 8 0 0 1 16 0v2" />
                <path d="M8 12v-1a4 4 0 0 1 8 0v1" />
                <circle cx="12" cy="14" r="2" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
