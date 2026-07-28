import { useEffect, useState } from 'react';

interface Props {
  finalText: string;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

// Character pool for the intro reveal.
const SCRAMBLE_POOL = '初弐ЖΩΣ√7feह्रकcQ한Σ9#@';

const SCRAMBLE_INTERVAL = 60;

function randomChar() {
  return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
}

function scrambledText(finalText: string) {
  return finalText
    .split('')
    .map((character) => character === ' ' ? ' ' : randomChar())
    .join('');
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export default function TextScrambleReveal({
  finalText,
  duration = 1600,
  className,
  onComplete,
}: Props) {
  const [displayText, setDisplayText] = useState(() => scrambledText(finalText));

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplayText(finalText);
      onComplete?.();
      return;
    }

    const chars = finalText.split('');
    setDisplayText(scrambledText(finalText));
    const lockAt = chars.map((_, i) => ((i + 1) / chars.length) * duration);

    const startedAt = performance.now();
    let lastScrambleAt = 0;
    let scrambleChars = chars.map(randomChar);
    let frameId: number;

    const tick = () => {
      const elapsed = performance.now() - startedAt;

      if (elapsed - lastScrambleAt >= SCRAMBLE_INTERVAL) {
        scrambleChars = chars.map(randomChar);
        lastScrambleAt = elapsed;
      }

      const easedElapsed = easeOutCubic(Math.min(1, elapsed / duration)) * duration;

      const next = chars
        .map((char, i) => {
          if (char === ' ') return ' ';
          return easedElapsed >= lockAt[i] ? char : scrambleChars[i];
        })
        .join('');

      setDisplayText(next);

      if (elapsed < duration) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayText(finalText);
        onComplete?.();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalText]);

  return <span className={className} aria-label={finalText}>{displayText}</span>;
}
