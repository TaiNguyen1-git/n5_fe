import React, { useState } from 'react';
import { Button, Dropdown, Menu, message } from 'antd';
import { 
  ExportOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined, 
  FileTextOutlined
} from '@ant-design/icons';
import { exportService, ExportColumn } from '../../services/exportService';
import dayjs from 'dayjs';

interface SimpleExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
}

const SimpleExportButton: React.FC<SimpleExportButtonProps> = ({
  data,
  columns,
  filename,
  title,
  disabled = false,
  loading = false
}) => {
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!data || data.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }

    setExportLoading(true);
    try {
      exportService.export({
        filename: filename || `export-${dayjs().format('YYYY-MM-DD-HH-mm')}`,
        title: title || 'Dữ liệu xuất',
        columns,
        data,
        format,
        orientation: 'landscape'
      });
      
      message.success(`Đã xuất ${data.length} bản ghi thành công!`);
    } catch (error) {      message.error('Có lỗi xảy ra khi xuất dữ liệu');
    } finally {
      setExportLoading(false);
    }
  };

  const exportMenu = (
    <Menu>
      <Menu.Item 
        key="excel" 
        icon={<FileExcelOutlined style={{ color: '#1D6F42' }} />}
        onClick={() => handleExport('excel')}
      >
        Xuất Excel (.xlsx)
      </Menu.Item>
      <Menu.Item 
        key="csv" 
        icon={<FileTextOutlined style={{ color: '#FF6B35' }} />}
        onClick={() => handleExport('csv')}
      >
        Xuất CSV (.csv)
      </Menu.Item>
      <Menu.Item 
        key="pdf" 
        icon={<FilePdfOutlined style={{ color: '#DC2626' }} />}
        onClick={() => handleExport('pdf')}
      >
        Xuất PDF (.pdf)
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown 
      overlay={exportMenu} 
      trigger={['click']}
      disabled={disabled}
    >
      <Button
        icon={<ExportOutlined />}
        loading={exportLoading || loading}
        disabled={disabled}
      >
        Xuất dữ liệu
      </Button>
    </Dropdown>
  );
};

export default SimpleExportButton;
