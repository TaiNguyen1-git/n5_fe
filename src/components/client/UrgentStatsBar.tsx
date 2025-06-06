import React, { useState, useEffect } from 'react';
import styles from '../../styles/UrgentStatsBar.module.css';

interface UrgentStatsBarProps {
  availableRooms?: number;
  totalRooms?: number;
}

const UrgentStatsBar: React.FC<UrgentStatsBarProps> = ({
  availableRooms = 0,
  totalRooms = 0
}) => {
  const [liveViewers, setLiveViewers] = useState(15);
  const [todayBookings, setTodayBookings] = useState(23);

  // Simulate live updates to create real-time feeling
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update viewers count
      setLiveViewers(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newValue = prev + change;
        return Math.max(8, Math.min(25, newValue)); // Keep between 8-25
      });

      // Room data now comes from props - no fake updates needed

      // Occasionally increase today's bookings
      if (Math.random() < 0.15) { // 15% chance every 5 seconds
        setTodayBookings(prev => prev + 1);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.urgentStatsSection}>
      <div className={styles.urgentStats}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⚡</span>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{availableRooms}</span>
            <span className={styles.statLabel}>phòng trống hôm nay</span>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statIcon}>👥</span>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{liveViewers}</span>
            <span className={styles.statLabel}>người đang xem</span>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statIcon}>🔥</span>
          <div className={styles.statContent}>
            <span className={styles.statHighlight}>Đặt trong 10 phút</span>
            <span className={styles.statLabel}>= Giảm thêm 5%</span>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⭐</span>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{todayBookings}</span>
            <span className={styles.statLabel}>đặt phòng hôm nay</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UrgentStatsBar;
