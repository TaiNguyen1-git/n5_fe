import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, message, Carousel, Spin } from 'antd';
import { GiftOutlined, CopyOutlined, CalendarOutlined, PercentageOutlined } from '@ant-design/icons';
import { discountService, Discount } from '../../services/discountService';
import dayjs from 'dayjs';
import styles from './PromotionBanner.module.css';
import CountdownTimer from './CountdownTimer';

const PromotionBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePromotions();
  }, []);

  const fetchActivePromotions = async () => {
    try {
      setLoading(true);
      const allDiscounts = await discountService.getAllDiscounts();



      // Lọc các mã giảm giá đang hoạt động và còn hạn
      const now = dayjs();
      const activePromotions = allDiscounts.filter(discount => {


        // Kiểm tra thông tin cơ bản
        if (!discount.tenMa || !discount.giaTri || discount.giaTri <= 0) {

          return false;
        }

        // Kiểm tra trạng thái (có thể null hoặc undefined)
        if (discount.trangThai === false) {

          return false;
        }

        // Kiểm tra ngày (nếu có)
        if (discount.ngayBatDau && discount.ngayKetThuc) {
          const startDate = dayjs(discount.ngayBatDau);
          const endDate = dayjs(discount.ngayKetThuc);

          if (now.isBefore(startDate) || now.isAfter(endDate)) {

            return false;
          }
        }


        return true;
      });


      setPromotions(activePromotions);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const copyDiscountCode = async (code: string) => {
    try {
      // Kiểm tra xem Clipboard API có khả dụng không
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        message.success(`Đã sao chép mã "${code}" vào clipboard!`);
      } else {
        // Fallback cho trường hợp không hỗ trợ Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          message.success(`Đã sao chép mã "${code}" vào clipboard!`);
        } catch (err) {
          message.error('Không thể sao chép mã giảm giá');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      message.error('Không thể sao chép mã giảm giá');
    }
  };





  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p>Đang tải khuyến mãi...</p>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null; // Không hiển thị gì nếu không có khuyến mãi
  }

  return (
    <div className={styles.promotionSection}>
      <div className={styles.sectionHeader}>
        <GiftOutlined className={styles.headerIcon} />
        <h2>🎁 Khuyến Mãi Đặc Biệt</h2>
        <p>⚡ Đừng bỏ lỡ cơ hội tiết kiệm khi đặt phòng!</p>
      </div>

      {/* Unified promotion banner with carousel */}
      {promotions.length === 0 ? (
        // Fallback when no promotions available
        <div className={styles.promotionBanner}>
          <div className={styles.promotionContent}>
            <div className={styles.promotionLeft}>
              <div className={styles.promotionIcon}>
                <GiftOutlined />
              </div>

              <div className={styles.promotionInfo}>
                <h3 className={styles.promotionTitle}>
                  🎯 Ưu đãi đặc biệt dành cho bạn!
                </h3>
                <p className={styles.promotionDescription}>
                  💎 Liên hệ với chúng tôi để nhận được mức giá tốt nhất cho kỳ nghỉ của bạn!
                </p>
              </div>
            </div>

            <div className={styles.promotionRight}>
              <Button
                type="primary"
                className={styles.copyButton}
                size="large"
              >
                Liên hệ ngay
              </Button>
            </div>
          </div>
        </div>
      ) : promotions.length === 1 ? (
        // Single promotion banner
        <div className={styles.promotionBanner}>
          <div className={styles.promotionContent}>
            <div className={styles.promotionLeft}>
              <div className={styles.promotionIcon}>
                {promotions[0].loaiGiam === 'percent' || promotions[0].loaiGiam === '%' ? (
                  <PercentageOutlined />
                ) : (
                  <GiftOutlined />
                )}
              </div>

              <div className={styles.promotionInfo}>
                <h3 className={styles.promotionTitle}>
                  🎯 {getPromotionTitle(promotions[0])}
                </h3>
                <p className={styles.promotionDescription}>
                  {getPromotionDescription(promotions[0])}
                </p>

                <div className={styles.promotionMeta}>
                  <div className={styles.timerSection}>
                    <span className={styles.timerLabel}>⏰ Kết thúc sau:</span>
                    <CountdownTimer
                      endDate={promotions[0].ngayKetThuc}
                      size="medium"
                      showLabels={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.promotionRight}>
              <div className={styles.discountCode}>
                <div className={styles.codeLabel}>Mã giảm giá:</div>
                <div className={styles.codeValue}>{promotions[0].tenMa}</div>
              </div>

              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyDiscountCode(promotions[0].tenMa!)}
                className={styles.copyButton}
                size="large"
              >
                Sao chép mã
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Multiple promotions with carousel
        <Carousel
          autoplay
          autoplaySpeed={4000}
          dots={true}
          arrows={true}
          infinite={true}
          className={styles.promotionCarousel}
        >
          {promotions.map((promotion, index) => (
            <div key={promotion.id || index}>
              <div className={styles.promotionBanner}>
                <div className={styles.promotionContent}>
                  <div className={styles.promotionLeft}>
                    <div className={styles.promotionIcon}>
                      {promotion.loaiGiam === 'percent' || promotion.loaiGiam === '%' ? (
                        <PercentageOutlined />
                      ) : (
                        <GiftOutlined />
                      )}
                    </div>

                    <div className={styles.promotionInfo}>
                      <h3 className={styles.promotionTitle}>
                        🎯 {getPromotionTitle(promotion)}
                      </h3>
                      <p className={styles.promotionDescription}>
                        {getPromotionDescription(promotion)}
                      </p>

                      <div className={styles.promotionMeta}>
                        <div className={styles.timerSection}>
                          <span className={styles.timerLabel}>⏰ Kết thúc sau:</span>
                          <CountdownTimer
                            endDate={promotion.ngayKetThuc}
                            size="medium"
                            showLabels={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.promotionRight}>
                    <div className={styles.discountCode}>
                      <div className={styles.codeLabel}>Mã giảm giá:</div>
                      <div className={styles.codeValue}>{promotion.tenMa}</div>
                    </div>

                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => copyDiscountCode(promotion.tenMa!)}
                      className={styles.copyButton}
                      size="large"
                    >
                      Sao chép mã
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      )}
    </div>
  );
};

interface PromotionCardProps {
  promotion: Discount;
  onCopyCode: (code: string) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onCopyCode }) => {
  const endDate = dayjs(promotion.ngayKetThuc);
  const daysLeft = endDate.diff(dayjs(), 'day');
  const isExpiringSoon = daysLeft <= 3;

  return (
    <Card className={`${styles.promotionCard} ${isExpiringSoon ? styles.expiringSoon : ''}`}>
      <div className={styles.promotionContent}>
        <div className={styles.promotionLeft}>
          <div className={styles.promotionIcon}>
            {promotion.loaiGiam === 'percent' || promotion.loaiGiam === '%' ? (
              <PercentageOutlined />
            ) : (
              <GiftOutlined />
            )}
          </div>
          
          <div className={styles.promotionInfo}>
            <h3 className={styles.promotionTitle}>
              {getPromotionTitle(promotion)}
            </h3>
            <p className={styles.promotionDescription}>
              {getPromotionDescription(promotion)}
            </p>
            
            <div className={styles.promotionMeta}>
              <Tag color={isExpiringSoon ? 'red' : 'green'} icon={<CalendarOutlined />}>
                {isExpiringSoon ? `Còn ${daysLeft} ngày` : `Đến ${endDate.format('DD/MM')}`}
              </Tag>
              
              <Tag color="blue">
                Giảm {formatDiscountValue(promotion)}
              </Tag>
            </div>
          </div>
        </div>

        <div className={styles.promotionRight}>
          <div className={styles.discountCode}>
            <div className={styles.codeLabel}>Mã giảm giá:</div>
            <div className={styles.codeValue}>{promotion.tenMa}</div>
          </div>
          
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => onCopyCode(promotion.tenMa!)}
            className={styles.copyButton}
          >
            Sao chép mã
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Helper functions (move outside component to avoid re-creation)
const getPromotionTitle = (discount: Discount) => {
  const value = formatDiscountValue(discount);

  // Always make it flash sale style for urgency
  if (discount.loaiGiam === 'percent' || discount.loaiGiam === '%') {
    return `GIẢM ${value} TẤT CẢ PHÒNG`;
  } else {
    return `GIẢM NGAY ${value}`;
  }
};

const getPromotionDescription = (discount: Discount) => {
  return `💎 Ưu đãi đặc biệt! Nhập mã "${discount.tenMa}" khi đặt phòng để được giảm giá ngay!`;
};

const formatDiscountValue = (discount: Discount) => {
  if (!discount.giaTri) return '';
  
  if (discount.loaiGiam === 'percent' || discount.loaiGiam === '%') {
    return `${discount.giaTri}%`;
  } else {
    return `${discount.giaTri.toLocaleString('vi-VN')}đ`;
  }
};

export default PromotionBanner;
