import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Contact.module.css';
import Header from '../../components/Header';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactErrors extends Partial<ContactForm> {
  submit?: string;
}

export default function Contact() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: ContactErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Vui lòng chọn chủ đề';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung tin nhắn';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Nội dung tin nhắn quá ngắn';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Có lỗi xảy ra, vui lòng thử lại'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Liên hệ với chúng tôi</h1>
            <p className={styles.subtitle}>
              Chúng tôi luôn sẵn sàng lắng nghe ý kiến và hỗ trợ quý khách
            </p>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.infoCard}>
                <div className={styles.icon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.content}>
                  <h3>Địa chỉ</h3>
                  <p>10 Huỳnh Văn Nghệ, P.Bửu Long, TP.Biên Hòa, Đồng Nai</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.icon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.content}>
                  <h3>Điện thoại</h3>
                  <p>0251 730 8261</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.icon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.content}>
                  <h3>Email</h3>
                  <p>info@lhu.edu.vn</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.icon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.content}>
                  <h3>Giờ làm việc</h3>
                  <p>Thứ 2 - Thứ 6: 7:30 - 17:00</p>
                </div>
              </div>
            </div>
            
            <div className={styles.contactForm}>
              <h2>Gửi tin nhắn cho chúng tôi</h2>
              
              {isSuccess && (
                <div className={styles.successMessage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                  </svg>
                  <p>Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {errors.submit && (
                  <div className={styles.errorMessage}>
                    {errors.submit}
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="name">Họ và tên</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? styles.error : ''}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? styles.error : ''}
                    placeholder="Nhập email"
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? styles.error : ''}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="subject">Chủ đề</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={errors.subject ? styles.error : ''}
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="booking">Đặt phòng</option>
                    <option value="service">Dịch vụ</option>
                    <option value="feedback">Góp ý</option>
                    <option value="other">Khác</option>
                  </select>
                  {errors.subject && <span className={styles.errorText}>{errors.subject}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="message">Nội dung tin nhắn</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={errors.message ? styles.error : ''}
                    placeholder="Nhập nội dung tin nhắn"
                    rows={5}
                  />
                  {errors.message && <span className={styles.errorText}>{errors.message}</span>}
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </form>
            </div>
          </div>
          
          <div className={styles.mapSection}>
            <h2>Bản đồ</h2>
            <div className={styles.map}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.4241674197956!2d106.8127!3d10.9559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d85e042d14b1%3A0xef77cd47a1cc691e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBraG9hIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>Về chúng tôi</h3>
            <p>Khách sạn Nhóm 5 - Nơi nghỉ dưỡng lý tưởng với không gian sang trọng, tiện nghi hiện đại và dịch vụ chất lượng cao.</p>
            <div className={styles.socialLinks}>
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên kết nhanh</h3>
            <ul>
              <li><a href="/">Trang chủ</a></li>
              <li><a href="/rooms">Phòng</a></li>
              <li><a href="/services">Dịch vụ</a></li>
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Dịch vụ</h3>
            <ul>
              <li><a href="#">Đặt phòng</a></li>
              <li><a href="#">Nhà hàng</a></li>
              <li><a href="#">Spa & Wellness</a></li>
              <li><a href="#">Hội nghị & Sự kiện</a></li>
              <li><a href="#">Dịch vụ đặc biệt</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên hệ</h3>
            <p>10 Huỳnh Văn Nghệ, Bửu Long, Biên Hòa, Đồng Nai</p>
            <p>Điện thoại: (0251) 382 2288</p>
            <p>Email: info@lhu.edu.vn</p>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Khách sạn Nhóm 5. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 