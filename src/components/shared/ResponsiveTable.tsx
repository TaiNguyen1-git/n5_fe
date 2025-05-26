import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Button, Drawer, Typography, Space, Tag } from 'antd';
import { EyeOutlined, MenuOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

interface ResponsiveTableProps {
  dataSource: any[];
  columns: ColumnsType<any>;
  rowKey: string;
  title?: string;
  loading?: boolean;
  pagination?: any;
  mobileCardRender?: (record: any) => React.ReactNode;
  onRowClick?: (record: any) => void;
  size?: 'small' | 'middle' | 'large';
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  dataSource,
  columns,
  rowKey,
  title,
  loading = false,
  pagination = { pageSize: 10 },
  mobileCardRender,
  onRowClick,
  size = 'middle'
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleCardClick = (record: any) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      setSelectedRecord(record);
      setDrawerVisible(true);
    }
  };

  const renderMobileCard = (record: any, index: number) => {
    if (mobileCardRender) {
      return mobileCardRender(record);
    }

    // Default mobile card layout
    return (
      <Card
        key={record[rowKey]}
        size="small"
        style={{ marginBottom: 12 }}
        onClick={() => handleCardClick(record)}
        hoverable
        actions={[
          <Button
            key="view"
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick(record);
            }}
          >
            Xem chi tiết
          </Button>
        ]}
      >
        <Row gutter={[8, 8]}>
          {columns.slice(0, 4).map((column: any, colIndex) => {
            const value = column.dataIndex
              ? Array.isArray(column.dataIndex)
                ? column.dataIndex.reduce((obj: any, key: any) => obj?.[key], record)
                : record[column.dataIndex]
              : record;

            const displayValue = column.render
              ? column.render(value, record, index)
              : value;

            return (
              <Col span={24} key={colIndex}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {column.title}
                  </Text>
                  <Text strong style={{ fontSize: '14px' }}>
                    {displayValue}
                  </Text>
                </Space>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  const renderDetailDrawer = () => {
    if (!selectedRecord) return null;

    return (
      <Drawer
        title="Chi tiết"
        placement="bottom"
        height="70%"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {columns.map((column: any, index) => {
            const value = column.dataIndex
              ? Array.isArray(column.dataIndex)
                ? column.dataIndex.reduce((obj: any, key: any) => obj?.[key], selectedRecord)
                : selectedRecord[column.dataIndex]
              : selectedRecord;

            const displayValue = column.render
              ? column.render(value, selectedRecord, index)
              : value;

            return (
              <Row key={index} gutter={[16, 8]}>
                <Col span={8}>
                  <Text type="secondary">{column.title}:</Text>
                </Col>
                <Col span={16}>
                  <Text strong>{displayValue}</Text>
                </Col>
              </Row>
            );
          })}
        </Space>
      </Drawer>
    );
  };

  if (isMobile) {
    return (
      <div>
        {title && (
          <Title level={4} style={{ marginBottom: 16 }}>
            {title}
          </Title>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Hiển thị {dataSource.length} kết quả
          </Text>
        </div>

        {loading ? (
          <Card loading={true} />
        ) : dataSource.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Không có dữ liệu</Text>
            </div>
          </Card>
        ) : (
          <>
            {dataSource.map((record, index) => renderMobileCard(record, index))}
            {renderDetailDrawer()}
          </>
        )}
      </div>
    );
  }

  // Desktop view - regular table
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      size={size}
      title={title ? () => title : undefined}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : 'default' }
      })}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default ResponsiveTable;
