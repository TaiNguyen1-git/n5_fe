import React from 'react';
import Link from 'next/link';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import styles from '../styles/Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>

          {/* Company Info */}
          <div className={styles.footerSection}>
            <div className={styles.logo}>
              <h3>Nhóm 5</h3>
            </div>
            <p className={styles.description}>
              Hệ thống đặt phòng khách sạn hiện đại, mang đến trải nghiệm tuyệt vời cho khách hàng.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://facebook.com" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                <FacebookOutlined />
              </a>
              <a href="https://instagram.com" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                <InstagramOutlined />
              </a>
              <a href="https://twitter.com" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                <TwitterOutlined />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Liên Kết</h4>
            <ul className={styles.linkList}>
              <li><Link href="/" className={styles.footerLink}>Trang chủ</Link></li>
              <li><Link href="/rooms" className={styles.footerLink}>Phòng nghỉ</Link></li>
              <li><Link href="/services" className={styles.footerLink}>Dịch vụ</Link></li>
              <li><Link href="/bookings" className={styles.footerLink}>Đặt phòng</Link></li>
              <li><Link href="/about" className={styles.footerLink}>Giới thiệu</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Liên Hệ</h4>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <PhoneOutlined className={styles.contactIcon} />
                <span>+84 123 456 789</span>
              </div>

              <div className={styles.contactItem}>
                <MailOutlined className={styles.contactIcon} />
                <span>support@nhom5hotel.com</span>
              </div>

              <div className={styles.contactItem}>
                <EnvironmentOutlined className={styles.contactIcon} />
                <span>123 Đường Võ Thị Sáu, TP. Biên Hòa, Đồng Nai</span>
              </div>
            </div>
          </div>

          {/* Service Hours */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Dịch Vụ</h4>
            <div className={styles.workingHours}>
              <p>🏨 Lễ tân: 24/7</p>
              <p>🍽️ Nhà hàng: 6:00 - 23:00</p>
              <p>🏊 Hồ bơi: 6:00 - 22:00</p>
              <p>📞 Hotline: 24/7</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className={styles.bottomFooter}>
          <div className={styles.copyright}>
            <p>© 2024 Nhóm 5 Hotel. Tất cả quyền được bảo lưu.</p>
          </div>

          <div className={styles.legalLinks}>
            <Link href="/terms" className={styles.legalLink}>Điều khoản</Link>
            <span className={styles.separator}>|</span>
            <Link href="/privacy" className={styles.legalLink}>Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;