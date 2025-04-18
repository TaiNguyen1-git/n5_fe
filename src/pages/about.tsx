import React from 'react';
import Layout from '../components/Layout';
import styles from '../styles/About.module.css';
import Image from 'next/image';
import { FaStar, FaSwimmingPool, FaWifi, FaUtensils, FaSpa, FaConciergeBell, FaDumbbell, FaCocktail, FaBed, FaCar } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <Layout>
    <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.aboutPage}>
            <section className={styles.aboutSection}>
              <h1>Về khách sạn chúng tôi</h1>
              <div className={styles.aboutContent}>
                <div className={styles.aboutText}>
                  <p>
                    Khách sạn chúng tôi tọa lạc tại trung tâm thành phố, mang đến trải nghiệm lưu trú sang trọng và tiện nghi cho du khách. Với kiến trúc hiện đại kết hợp nét truyền thống, chúng tôi cam kết mang đến cho quý khách không gian nghỉ dưỡng thoải mái và đẳng cấp.
                  </p>
                  <p>
                    Thành lập từ năm 2010, chúng tôi luôn không ngừng cải tiến và nâng cấp dịch vụ để đáp ứng nhu cầu ngày càng cao của khách hàng. Đội ngũ nhân viên chuyên nghiệp, thân thiện luôn sẵn sàng phục vụ 24/7 để đảm bảo kỳ nghỉ của quý khách trọn vẹn.
                  </p>
                </div>
                <div className={styles.aboutImage}>
                  <Image
                    src="/images/hotel-exterior.jpg"
                    alt="Hotel Exterior"
                    width={600}
                    height={450}
                    className={styles.hotelImage}
                    priority
                  />
                </div>
              </div>
              <div className={styles.hotelGallery}>
                <div className={styles.galleryItem}>
                  <Image
                    src="/images/hotel-lobby.jpg"
                    alt="Hotel Lobby"
                    width={380}
                    height={250}
                    className={styles.galleryImage}
                  />
                </div>
                <div className={styles.galleryItem}>
                  <Image
                    src="/images/hotel-room.jpg"
                    alt="Luxury Room"
                    width={380}
                    height={250}
                    className={styles.galleryImage}
                  />
                </div>
                <div className={styles.galleryItem}>
                  <Image
                    src="/images/restaurant.jpg"
                    alt="Hotel Restaurant" 
                    width={380}
                    height={250}
                    className={styles.galleryImage}
                  />
                </div>
              </div>
            </section>

            <section className={styles.teamSection}>
              <h1>Đội ngũ quản lý</h1>
              <p className={styles.teamIntro}>
                Đội ngũ quản lý giàu kinh nghiệm và chuyên nghiệp của chúng tôi luôn nỗ lực không ngừng để mang đến cho quý khách những trải nghiệm tuyệt vời nhất.
              </p>
              <div className={styles.teamGrid}>
                <div className={styles.teamMember}>
                  <div className={styles.memberImage}>
                    <img src="/images/ceo.jpg" alt="CEO" />
                  </div>
                  <div className={styles.memberInfo}>
                    <h3>Nguyễn Văn An</h3>
                    <p>Tổng Giám đốc</p>
                    <div className={styles.memberBio}>
                      Với hơn 15 năm kinh nghiệm trong ngành khách sạn cao cấp, ông An đã đưa khách sạn trở thành điểm đến hàng đầu của thành phố.
                    </div>
                    <div className={styles.socialLinks}>
                      <span className={styles.socialLink}><FaStar /></span>
                      <span className={styles.socialLink}><FaWifi /></span>
                      <span className={styles.socialLink}><FaBed /></span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.teamMember}>
                  <div className={styles.memberImage}>
                    <img src="/images/business-director.jpg" alt="Business Director" />
                  </div>
                  <div className={styles.memberInfo}>
                    <h3>Trần Thị Bình</h3>
                    <p>Giám đốc Kinh doanh</p>
                    <div className={styles.memberBio}>
                      Bà Bình là chuyên gia trong lĩnh vực kinh doanh khách sạn, đã góp phần quan trọng trong việc xây dựng thương hiệu và phát triển thị trường.
              </div>
                    <div className={styles.socialLinks}>
                      <span className={styles.socialLink}><FaStar /></span>
                      <span className={styles.socialLink}><FaWifi /></span>
                      <span className={styles.socialLink}><FaBed /></span>
          </div>
          </div>
        </div>

                <div className={styles.teamMember}>
                  <div className={styles.memberImage}>
                    <img src="/images/reception-manager.jpg" alt="Service Manager" />
                  </div>
                  <div className={styles.memberInfo}>
                    <h3>Lê Minh Cường</h3>
                    <p>Giám đốc Dịch vụ</p>
                    <div className={styles.memberBio}>
                      Ông Cường chịu trách nhiệm đảm bảo mọi dịch vụ của khách sạn đều đạt tiêu chuẩn 5 sao, mang đến sự hài lòng tuyệt đối cho khách hàng.
            </div>
                    <div className={styles.socialLinks}>
                      <span className={styles.socialLink}><FaStar /></span>
                      <span className={styles.socialLink}><FaWifi /></span>
                      <span className={styles.socialLink}><FaBed /></span>
            </div>
          </div>
        </div>

                <div className={styles.teamMember}>
                  <div className={styles.memberImage}>
                    <img src="/images/chef.jpg" alt="Executive Chef" />
                  </div>
                  <div className={styles.memberInfo}>
                    <h3>Phạm Thị Dung</h3>
                    <p>Bếp trưởng</p>
                    <div className={styles.memberBio}>
                      Đầu bếp Dung là chuyên gia ẩm thực với nhiều năm kinh nghiệm tại các nhà hàng 5 sao trong và ngoài nước, chịu trách nhiệm sáng tạo các món ăn đặc sắc.
                    </div>
                    <div className={styles.socialLinks}>
                      <span className={styles.socialLink}><FaStar /></span>
                      <span className={styles.socialLink}><FaWifi /></span>
                      <span className={styles.socialLink}><FaBed /></span>
                    </div>
                  </div>
          </div>
              </div>
            </section>

            <section className={styles.facilitySection}>
              <h2>Tiện nghi & Dịch vụ</h2>
              <p>Chúng tôi cung cấp đầy đủ tiện nghi và dịch vụ cao cấp để đảm bảo kỳ nghỉ của quý khách luôn thoải mái và thư giãn.</p>
              <div className={styles.facilitiesGrid}>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaWifi size={40} color="#0070f3" />
                  </div>
                  <h3>Wi-Fi miễn phí</h3>
                  <p>Kết nối Internet tốc độ cao trong toàn bộ khuôn viên khách sạn</p>
                </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaSwimmingPool size={40} color="#0070f3" />
                  </div>
                  <h3>Hồ bơi</h3>
                  <p>Hồ bơi ngoài trời với tầm nhìn panorama tuyệt đẹp</p>
                </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaUtensils size={40} color="#0070f3" />
            </div>
                  <h3>Nhà hàng</h3>
                  <p>Nhà hàng phục vụ ẩm thực Việt Nam và quốc tế</p>
              </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaDumbbell size={40} color="#0070f3" />
            </div>
                  <h3>Phòng tập gym</h3>
                  <p>Trung tâm thể dục hiện đại với đầy đủ thiết bị</p>
              </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaSpa size={40} color="#0070f3" />
            </div>
                  <h3>Spa & Massage</h3>
                  <p>Dịch vụ spa và massage thư giãn cao cấp</p>
              </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaCocktail size={40} color="#0070f3" />
            </div>
                  <h3>Quầy bar</h3>
                  <p>Quầy bar phục vụ đồ uống và cocktail đặc sắc</p>
          </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaBed size={40} color="#0070f3" />
        </div>
                  <h3>Phòng cao cấp</h3>
                  <p>Phòng nghỉ sang trọng với đầy đủ tiện nghi</p>
            </div>
                <div className={styles.facilityItem}>
                  <div className={styles.facilityIcon}>
                    <FaCar size={40} color="#0070f3" />
            </div>
                  <h3>Đưa đón sân bay</h3>
                  <p>Dịch vụ đưa đón từ sân bay đến khách sạn</p>
          </div>
        </div>
            </section>
        </div>
      </main>
        </div>
    </Layout>
  );
};

export default AboutPage; 


















