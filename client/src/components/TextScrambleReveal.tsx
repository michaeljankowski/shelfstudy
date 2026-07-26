import { useEffect, useState } from 'react';

interface Props {
  finalText: string;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

// Mixed-script pool matching the reference mockup's scrambled look —
// CJK, Greek, Devanagari, math symbols, digits, a few Latin.
const SCRAMBLE_POOL = '初弐ЖΩΣ√7feह्रकcQ한Σ9#@';

// How often an unlocked character's glyph flips to a new random one — slow
// enough to read as a deliberate morph rather than a flicker.
const SCRAMBLE_INTERVAL = 60;

function randomChar() {
  return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
}

// Ease-out: the reveal wavefront moves fast at first and settles gradually,
// so it reads as an intentional reveal rather than a constant-rate timer.
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export default function TextScrambleReveal({
  finalText,
  duration = 3200,
  className,
  onComplete,
}: Props) {
  const [displayText, setDisplayText] = useState(finalText);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplayText(finalText);
      onComplete?.();
      return;
    }

    const chars = finalText.split('');
    // Each character locks at its own point along the eased wavefront, so
    // characters settle one at a time instead of all snapping on one tick.
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

  return <span className={className}>{displayText}</span>;
}
