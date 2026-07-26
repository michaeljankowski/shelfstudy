import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TextScrambleReveal from '../components/TextScrambleReveal';
import './IntroHero.css';

const SKIP_INTRO_KEY = 'shelfstudy:intro-shown';

export default function IntroHero() {
  const navigate = useNavigate();
  const [showHero, setShowHero] = useState(() => sessionStorage.getItem(SKIP_INTRO_KEY) === '1');

  const handleScrambleComplete = () => {
    sessionStorage.setItem(SKIP_INTRO_KEY, '1');
    setShowHero(true);
  };

  return (
    <div className="intro-hero">
      {!showHero ? (
        <TextScrambleReveal
          finalText="ShelfStudy"
          className="intro-hero-brand intro-hero-brand-scramble"
          onComplete={handleScrambleComplete}
        />
      ) : (
        <div className="intro-hero-content">
          <h1 className="intro-hero-brand">ShelfStudy</h1>
          <p className="intro-hero-tagline">What should we study today?</p>
          <button className="intro-hero-cta" onClick={() => navigate('/folders')}>
            Get started
          </button>
        </div>
      )}
    </div>
  );
}
