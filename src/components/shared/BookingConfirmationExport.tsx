import React from 'react';
import { Button, Card, Space, Typography, Row, Col, Divider, message } from 'antd';
import { FilePdfOutlined, PrinterOutlined } from '@ant-design/icons';
import { exportService } from '../../services/exportService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface BookingData {
  maDatPhong?: number;
  tenKH?: string;
  email?: string;
  phone?: string;
  soPhong?: string;
  loaiPhong?: string;
  checkIn?: string;
  checkOut?: string;
  tongTien?: number;
  ghiChu?: string;
}

interface BookingConfirmationExportProps {
  booking: BookingData;
  onExportSuccess?: () => void;
}

const BookingConfirmationExport: React.FC<BookingConfirmationExportProps> = ({
  booking,
  onExportSuccess
}) => {
  const handleExportPDF = () => {
    try {
      exportService.exportBookingConfirmation(booking);
      message.success('Đã xuất xác nhận đặt phòng thành công!');
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi xuất xác nhận đặt phòng');
    }
  };

  const handlePrint = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Xác nhận đặt phòng - ${booking.maDatPhong}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .hotel-info { text-align: center; margin-bottom: 30px; color: #666; }
            .booking-details { margin: 20px 0; }
            .detail-row { margin: 10px 0; display: flex; }
            .detail-label { font-weight: bold; width: 150px; }
            .footer { text-align: center; margin-top: 40px; color: #666; }
            .divider { border-top: 1px solid #ddd; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>XÁC NHẬN ĐẶT PHÒNG</h1>
          </div>
          
          <div class="hotel-info">
            <h2>KHÁCH SẠN NHÓM 5</h2>
            <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
            <p>Điện thoại: +84 123 456 789</p>
          </div>
          
          <div class="divider"></div>
          
          <h3>THÔNG TIN ĐẶT PHÒNG</h3>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Mã đặt phòng:</span>
              <span>${booking.maDatPhong || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Khách hàng:</span>
              <span>${booking.tenKH || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span>${booking.email || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số điện thoại:</span>
              <span>${booking.phone || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phòng:</span>
              <span>${booking.soPhong || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Loại phòng:</span>
              <span>${booking.loaiPhong || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ngày nhận phòng:</span>
              <span>${booking.checkIn ? dayjs(booking.checkIn).format('DD/MM/YYYY') : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ngày trả phòng:</span>
              <span>${booking.checkOut ? dayjs(booking.checkOut).format('DD/MM/YYYY') : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số đêm:</span>
              <span>${booking.checkIn && booking.checkOut ? dayjs(booking.checkOut).diff(dayjs(booking.checkIn), 'day') : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tổng tiền:</span>
              <span style="font-weight: bold; color: #52c41a;">${booking.tongTien?.toLocaleString('vi-VN') || '0'} VNĐ</span>
            </div>
            ${booking.ghiChu ? `
            <div class="detail-row">
              <span class="detail-label">Ghi chú:</span>
              <span>${booking.ghiChu}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Cảm ơn quý khách đã chọn dịch vụ của chúng tôi!</p>
            <p>Ngày xuất: ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      
      message.success('Đã mở cửa sổ in!');
    }
  };

  const calculateNights = () => {
    if (booking.checkIn && booking.checkOut) {
      return dayjs(booking.checkOut).diff(dayjs(booking.checkIn), 'day');
    }
    return 0;
  };

  return (
    <Card 
      title="📄 Xác nhận đặt phòng" 
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            In
          </Button>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
          >
            Xuất PDF
          </Button>
        </Space>
      }
    >
      {/* Hotel Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          KHÁCH SẠN NHÓM 5
        </Title>
        <Text type="secondary">
          Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM | Điện thoại: +84 123 456 789
        </Text>
      </div>

      <Divider />

      <Title level={4}>THÔNG TIN ĐẶT PHÒNG</Title>

      {/* Booking Details */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Mã đặt phòng: </Text>
              <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                #{booking.maDatPhong || 'N/A'}
              </Text>
            </div>
            <div>
              <Text strong>Khách hàng: </Text>
              <Text>{booking.tenKH || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Email: </Text>
              <Text>{booking.email || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Số điện thoại: </Text>
              <Text>{booking.phone || 'N/A'}</Text>
            </div>
          </Space>
        </Col>
        
        <Col xs={24} sm={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Phòng: </Text>
              <Text style={{ fontSize: '16px', color: '#52c41a' }}>
                {booking.soPhong || 'N/A'}
              </Text>
            </div>
            <div>
              <Text strong>Loại phòng: </Text>
              <Text>{booking.loaiPhong || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Ngày nhận phòng: </Text>
              <Text>
                {booking.checkIn ? dayjs(booking.checkIn).format('DD/MM/YYYY') : 'N/A'}
              </Text>
            </div>
            <div>
              <Text strong>Ngày trả phòng: </Text>
              <Text>
                {booking.checkOut ? dayjs(booking.checkOut).format('DD/MM/YYYY') : 'N/A'}
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* Summary */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <div>
            <Text strong>Số đêm: </Text>
            <Text style={{ fontSize: '16px' }}>{calculateNights()} đêm</Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div>
            <Text strong>Tổng tiền: </Text>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
              {booking.tongTien?.toLocaleString('vi-VN') || '0'} VNĐ
            </Text>
          </div>
        </Col>
      </Row>

      {booking.ghiChu && (
        <>
          <Divider />
          <div>
            <Text strong>Ghi chú: </Text>
            <Text>{booking.ghiChu}</Text>
          </div>
        </>
      )}

      <Divider />

      <div style={{ textAlign: 'center', color: '#666' }}>
        <Text>Cảm ơn quý khách đã chọn dịch vụ của chúng tôi!</Text>
        <br />
        <Text type="secondary">
          Ngày xuất: {dayjs().format('DD/MM/YYYY HH:mm')}
        </Text>
      </div>
    </Card>
  );
};

export default BookingConfirmationExport;
