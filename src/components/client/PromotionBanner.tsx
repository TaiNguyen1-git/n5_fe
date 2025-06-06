import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, message, Carousel, Spin } from 'antd';
import { GiftOutlined, CopyOutlined, CalendarOutlined, PercentageOutlined } from '@ant-design/icons';
import { discountService, Discount } from '../../services/discountService';
import dayjs from 'dayjs';
import styles from './PromotionBanner.module.css';

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
        <h2>Khuyến Mãi Đặc Biệt</h2>
        <p>Đừng bỏ lỡ cơ hội tiết kiệm khi đặt phòng!</p>
      </div>

      {promotions.length === 1 ? (
        // Hiển thị single banner nếu chỉ có 1 khuyến mãi
        <div className={styles.singleBanner}>
          <PromotionCard promotion={promotions[0]} onCopyCode={copyDiscountCode} />
        </div>
      ) : (
        // Hiển thị carousel nếu có nhiều khuyến mãi
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
              <PromotionCard promotion={promotion} onCopyCode={copyDiscountCode} />
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
  const endDate = dayjs(discount.ngayKetThuc);
  const daysLeft = endDate.diff(dayjs(), 'day');
  
  if (daysLeft <= 3) {
    return `🔥 KHUYẾN MÃI SẮP KẾT THÚC - GIẢM ${value}`;
  } else if (discount.loaiGiam === 'percent' || discount.loaiGiam === '%') {
    return `🎉 KHUYẾN MÃI ĐẶC BIỆT - GIẢM ${value}`;
  } else {
    return `💰 GIẢM NGAY ${value} CHO ĐƠN HÀNG`;
  }
};

const getPromotionDescription = (discount: Discount) => {
  const endDate = dayjs(discount.ngayKetThuc).format('DD/MM/YYYY');
  return `Áp dụng đến hết ngày ${endDate}. Nhập mã "${discount.tenMa}" khi đặt phòng để được giảm giá!`;
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
