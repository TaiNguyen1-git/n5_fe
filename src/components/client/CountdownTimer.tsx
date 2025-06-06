import React, { useState, useEffect } from 'react';
import styles from '../../styles/CountdownTimer.module.css';

interface CountdownTimerProps {
  targetTime?: number; // milliseconds from now
  endDate?: string; // ISO date string
  onExpire?: () => void;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime = 2 * 60 * 60 * 1000, // Default 2 hours
  endDate,
  onExpire,
  showLabels = true,
  size = 'medium'
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      let targetDate: Date;
      
      if (endDate) {
        targetDate = new Date(endDate);
      } else {
        targetDate = new Date(Date.now() + targetTime);
      }

      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetTime, endDate, onExpire]);

  if (isExpired) {
    return (
      <div className={`${styles.countdownContainer} ${styles[size]} ${styles.expired}`}>
        <div className={styles.expiredMessage}>
          ⏰ Khuyến mãi đã kết thúc
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.countdownContainer} ${styles[size]}`}>
      <div className={styles.countdownDisplay}>
        {timeLeft.days > 0 && (
          <div className={styles.timeUnit}>
            <span className={styles.timeNumber}>{timeLeft.days.toString().padStart(2, '0')}</span>
            {showLabels && <span className={styles.timeLabel}>ngày</span>}
          </div>
        )}
        
        <div className={styles.timeUnit}>
          <span className={styles.timeNumber}>{timeLeft.hours.toString().padStart(2, '0')}</span>
          {showLabels && <span className={styles.timeLabel}>giờ</span>}
        </div>
        
        <span className={styles.timeSeparator}>:</span>
        
        <div className={styles.timeUnit}>
          <span className={styles.timeNumber}>{timeLeft.minutes.toString().padStart(2, '0')}</span>
          {showLabels && <span className={styles.timeLabel}>phút</span>}
        </div>
        
        <span className={styles.timeSeparator}>:</span>
        
        <div className={styles.timeUnit}>
          <span className={styles.timeNumber}>{timeLeft.seconds.toString().padStart(2, '0')}</span>
          {showLabels && <span className={styles.timeLabel}>giây</span>}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
