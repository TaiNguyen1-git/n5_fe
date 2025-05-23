import React, { memo } from 'react';
import styles from '../styles/LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

// Sử dụng memo để tránh re-render không cần thiết
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  fullScreen = true,
  text = 'Đang tải...',
  size = 'medium'
}) => {
  // Tối ưu hóa bằng cách chỉ render khi cần thiết
  return (
    <div className={`${styles.spinnerContainer} ${fullScreen ? styles.fullScreen : ''} ${styles[size]}`}>
      <div className={styles.spinner}>
        <div className={styles.bounce1}></div>
        <div className={styles.bounce2}></div>
        <div className={styles.bounce3}></div>
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
});

export default LoadingSpinner;
