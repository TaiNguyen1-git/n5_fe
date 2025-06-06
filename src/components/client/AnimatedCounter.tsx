import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  start?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  start = 0,
  className = '',
  suffix = '',
  prefix = ''
}) => {
  const [count, setCount] = useState(start);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(start + (end - start) * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress === 1) {
        clearInterval(timer);
        setCount(end);
        setHasAnimated(true);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [end, duration, start, hasAnimated]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};

export default AnimatedCounter;
