import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextScrambleReveal from '../components/TextScrambleReveal';
import './IntroHero.css';

export default function IntroHero() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [resolved, setResolved] = useState(reduceMotion);
  const [backgroundActive, setBackgroundActive] = useState(reduceMotion);
  const [fallingCharacters] = useState(() => (
    ['初', 'Ω', 'Ж', '7', 'ह', '한', 'Σ', 'क', '√', 'Q', '弐', '9'].map((character) => ({
      character,
      fontSize: `${2.25 + Math.random() * 1.5}rem`,
    }))
  ));

  return (
    <main className="intro-hero" aria-labelledby="intro-hero-title">
      {backgroundActive && (
        <div className="intro-hero-glyph-rain" aria-hidden="true">
          {fallingCharacters.map(({ character, fontSize }, index) => (
            <span key={`${character}-${index}`} style={{ fontSize }}>{character}</span>
          ))}
        </div>
      )}
      <section
        className={`intro-hero-content${resolved ? ' intro-hero-content--resolved' : ''}`}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === 'transform') {
            setBackgroundActive(true);
          }
        }}
      >
        <h1 id="intro-hero-title" className="intro-hero-brand">
          <TextScrambleReveal finalText="ShelfStudy" duration={1600} onComplete={() => setResolved(true)} />
        </h1>
        <p className="intro-hero-prompt">What should we study today?</p>
        <Link className="intro-hero-cta" to="/folders">Go to My Folders</Link>
      </section>
    </main>
  );
}
