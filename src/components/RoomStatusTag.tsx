import React, { useState, useEffect } from 'react';
import { Tag, Tooltip, Spin } from 'antd';
import axios from 'axios';

interface RoomStatusTagProps {
  roomId: string | number;
}

interface RoomStatus {
  maTT: number;
  tenTT: string;
}

const RoomStatusTag: React.FC<RoomStatusTagProps> = ({ roomId }) => {
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/room-status/${roomId}`, {
          timeout: 5000
        });

        if (response.data && response.data.success && response.data.data) {
          setStatus(response.data.data);
        } else {
          setError('Không thể lấy thông tin trạng thái phòng');
        }
      } catch (err) {
        setError('Lỗi khi tải trạng thái phòng');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomStatus();
    }
  }, [roomId]);

  // Hàm lấy màu dựa trên mã trạng thái và tên trạng thái
  const getStatusColor = (statusCode: number, statusName: string): string => {
    // Kiểm tra tên trạng thái trước
    if (statusName) {
      const lowerCaseName = statusName.toLowerCase();
      if (lowerCaseName.includes('chờ xác nhận')) {
        return 'gold';
      } else if (lowerCaseName.includes('đã xác nhận')) {
        return 'green';
      } else if (lowerCaseName.includes('đã nhận phòng')) {
        return 'blue';
      } else if (lowerCaseName.includes('đã trả phòng')) {
        return 'orange';
      } else if (lowerCaseName.includes('đã hủy')) {
        return 'red';
      }
    }

    // Nếu không xác định được từ tên, dùng mã
    switch (statusCode) {
      case 1:
        return 'gold'; // Chờ xác nhận
      case 2:
        return 'green'; // Đã xác nhận
      case 3:
        return 'blue'; // Đã nhận phòng
      case 4:
        return 'orange'; // Đã trả phòng
      case 5:
        return 'red'; // Đã hủy
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Spin size="small" />;
  }

  if (error || !status) {
    return <Tag color="default">Chưa xác định</Tag>;
  }

  return (
    <Tooltip title={`Mã trạng thái: ${status.maTT} - ${status.tenTT}`}>
      <Tag color={getStatusColor(status.maTT, status.tenTT)}>
        {status.tenTT || `Trạng thái ${status.maTT}`}
      </Tag>
    </Tooltip>
  );
};

export default RoomStatusTag;
