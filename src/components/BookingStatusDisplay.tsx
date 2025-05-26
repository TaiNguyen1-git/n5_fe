import React, { useState, useEffect } from 'react';
import { Tag, Tooltip, Spin } from 'antd';
import axios from 'axios';

interface BookingStatusDisplayProps {
  status: string;
  trangThai?: number;
  bookingId?: string | number;
}

interface StatusData {
  maTT: number;
  tenTT: string;
}

const BookingStatusDisplay: React.FC<BookingStatusDisplayProps> = ({ status, trangThai, bookingId }) => {
  const [apiStatus, setApiStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trạng thái từ API nếu có bookingId
  useEffect(() => {
    const fetchStatus = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        // Sử dụng trực tiếp trangThai nếu có, không gọi API
        if (trangThai !== undefined) {
          // Tạo dữ liệu trạng thái từ trangThai
          let tenTT = 'Chưa xác định';

          switch(trangThai) {
            case 0:
              tenTT = 'Đã hủy';
              break;
            case 1:
              tenTT = 'Chờ xác nhận'; // Thay đổi từ 'Chờ xác nhận' thành 'Đã xác nhận'
              break;
            case 2:
              tenTT = 'Đã xác nhận';
              break;
            case 3:
              tenTT = 'Đã nhận phòng';
              break;
            case 4:
              tenTT = 'Đã trả phòng';
              break;
          }

          setApiStatus({
            maTT: trangThai,
            tenTT: tenTT
          });
          setLoading(false);
          return;
        }

        // Nếu không có trangThai, thử gọi API
        const response = await axios.get(`/api/room-status/${bookingId}`, {
          timeout: 5000
        });

        if (response.data && response.data.success && response.data.data) {
          setApiStatus(response.data.data);
        }
      } catch (err) {
        setError('Lỗi khi tải trạng thái');

        // Nếu có lỗi và có trangThai, sử dụng trangThai
        if (trangThai !== undefined) {
          let tenTT = 'Chưa xác định';

          switch(trangThai) {
            case 0:
              tenTT = 'Đã hủy';
              break;
            case 1:
              tenTT = 'Chờ xác nhận'; // Thay đổi từ 'Chờ xác nhận' thành 'Đã xác nhận'
              break;
            case 2:
              tenTT = 'Đã xác nhận';
              break;
            case 3:
              tenTT = 'Đã nhận phòng';
              break;
            case 4:
              tenTT = 'Đã trả phòng';
              break;
          }

          setApiStatus({
            maTT: trangThai,
            tenTT: tenTT
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchStatus();
    }
  }, [bookingId, trangThai]);

  // Xác định màu sắc và văn bản dựa trên trạng thái
  let color = 'default';
  let text = '';

  // Ưu tiên sử dụng dữ liệu từ API nếu có
  if (apiStatus) {
    // Sử dụng tên trạng thái từ API
    text = apiStatus.tenTT;

    // Xác định màu dựa trên mã trạng thái
    switch (apiStatus.maTT) {
      case 0:
        color = 'red';
        break;
      case 1:
        color = 'yellow';   // Thay đổi từ 'gold' thành 'green'
        break;
      case 2:
        color = 'green';
        break;
      case 3:
        color = 'blue';
        break;
      case 4:
        color = 'orange';
        break;
      case 5:
        color = 'purple';
        break;
      default:
        color = 'default';
    }
  }
  // Nếu không có dữ liệu từ API, sử dụng trangThai
  else if (trangThai !== undefined) {
    switch (trangThai) {
      case 0:
        color = 'red';
        text = 'Đã hủy';
        break;
      case 1:
        color = 'green'; // Thay đổi từ 'gold' thành 'green'
        text = 'Đã xác nhận'; // Thay đổi từ 'Chờ xác nhận' thành 'Đã xác nhận'
        break;
      case 2:
        color = 'green';
        text = 'Đã xác nhận';
        break;
      case 3:
        color = 'blue';
        text = 'Đã nhận phòng';
        break;
      case 4:
        color = 'orange';
        text = 'Đã trả phòng';
        break;
      default:
        text = `Trạng thái ${trangThai}`;
    }
  }
  // Cuối cùng, sử dụng status nếu không có trangThai
  else {
    switch (status) {
      case 'pending':
        color = 'gold';
        text = 'Chờ xác nhận';
        break;
      case 'confirmed':
        color = 'green';
        text = 'Đã xác nhận';
        break;
      case 'completed':
        color = 'blue';
        text = 'Hoàn thành';
        break;
      case 'cancelled':
        color = 'red';
        text = 'Đã hủy';
        break;
      default:
        text = status;
    }
  }

  if (loading) {
    return <Spin size="small" />;
  }

  return (
    <Tooltip title={apiStatus ? `Mã trạng thái: ${apiStatus.maTT} - ${apiStatus.tenTT}` : `Mã trạng thái: ${trangThai !== undefined ? trangThai : 'N/A'}`}>
      <Tag color={color}>{text}</Tag>
    </Tooltip>
  );
};

export default BookingStatusDisplay;
