import React, { useState } from 'react';
import { Input, Button, message, Tag, Spin } from 'antd';
import { GiftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { discountService, Discount } from '../../services/discountService';
import styles from './DiscountInput.module.css';

interface DiscountInputProps {
  originalPrice: number;
  onDiscountApplied: (discount: Discount | null, discountAmount: number) => void;
  disabled?: boolean;
}

const DiscountInput: React.FC<DiscountInputProps> = ({
  originalPrice,
  onDiscountApplied,
  disabled = false
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      message.warning('Vui lòng nhập mã giảm giá');
      return;
    }

    setLoading(true);
    setValidationMessage('');
    setIsValid(null);

    try {
      const result = await discountService.validateDiscountCode(discountCode.trim());
      
      if (result.valid && result.discount) {
        const amount = discountService.calculateDiscountAmount(originalPrice, result.discount);
        
        setAppliedDiscount(result.discount);
        setDiscountAmount(amount);
        setIsValid(true);
        setValidationMessage(result.message || 'Mã giảm giá hợp lệ');
        
        // Notify parent component
        onDiscountApplied(result.discount, amount);
        
        message.success(`Áp dụng mã giảm giá thành công! Giảm ${amount.toLocaleString('vi-VN')}đ`);
      } else {
        setIsValid(false);
        setValidationMessage(result.message || 'Mã giảm giá không hợp lệ');
        message.error(result.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (error) {
      setIsValid(false);
      setValidationMessage('Có lỗi xảy ra khi kiểm tra mã giảm giá');
      message.error('Có lỗi xảy ra khi kiểm tra mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setValidationMessage('');
    setIsValid(null);
    
    // Notify parent component
    onDiscountApplied(null, 0);
    
    message.info('Đã hủy mã giảm giá');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyDiscount();
    }
  };

  return (
    <div className={styles.discountContainer}>
      <div className={styles.discountHeader}>
        <GiftOutlined className={styles.discountIcon} />
        <span className={styles.discountTitle}>Mã giảm giá</span>
      </div>

      {!appliedDiscount ? (
        <div className={styles.discountInputGroup}>
          <Input
            placeholder="Nhập mã giảm giá"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={disabled || loading}
            className={styles.discountInput}
            suffix={
              loading ? (
                <Spin size="small" />
              ) : (
                <Button
                  type="primary"
                  size="small"
                  onClick={handleApplyDiscount}
                  disabled={disabled || loading || !discountCode.trim()}
                  className={styles.applyButton}
                >
                  Áp dụng
                </Button>
              )
            }
          />
          
          {validationMessage && (
            <div className={`${styles.validationMessage} ${isValid ? styles.success : styles.error}`}>
              {isValid ? (
                <CheckCircleOutlined className={styles.validationIcon} />
              ) : (
                <CloseCircleOutlined className={styles.validationIcon} />
              )}
              {validationMessage}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.appliedDiscountContainer}>
          <div className={styles.appliedDiscountInfo}>
            <Tag color="green" className={styles.discountTag}>
              <GiftOutlined /> {appliedDiscount.tenMa}
            </Tag>
            <div className={styles.discountDetails}>
              <div className={styles.discountValue}>
                Giảm {discountAmount.toLocaleString('vi-VN')}đ
              </div>
              <div className={styles.discountType}>
                {appliedDiscount.loaiGiam === 'percent' || appliedDiscount.loaiGiam === '%' 
                  ? `${appliedDiscount.giaTri}% giảm giá` 
                  : `Giảm ${appliedDiscount.giaTri?.toLocaleString('vi-VN')}đ`
                }
              </div>
            </div>
          </div>
          <Button
            type="text"
            size="small"
            onClick={handleRemoveDiscount}
            className={styles.removeButton}
            disabled={disabled}
          >
            <CloseCircleOutlined /> Hủy
          </Button>
        </div>
      )}

      {appliedDiscount && (
        <div className={styles.discountSummary}>
          <div className={styles.summaryRow}>
            <span>Tổng tiền gốc:</span>
            <span>{originalPrice.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Giảm giá:</span>
            <span className={styles.discountAmountText}>-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Thành tiền:</span>
            <span className={styles.finalPrice}>
              {(originalPrice - discountAmount).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountInput;
