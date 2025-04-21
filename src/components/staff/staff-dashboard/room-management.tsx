import React, { useState } from 'react';
import { Table, Button, Select, Input, Tag, Space, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const mockRooms = [
  { id: 1, name: '101', type: 'single', status: 'trống' },
  { id: 2, name: '102', type: 'vip', status: 'đã đặt' },
  { id: 3, name: '201', type: 'duo', status: 'đang dọn dẹp' },
];
const roomTypes = [
  { value: 'single', label: 'Single' },
  { value: 'duo', label: 'Duo' },
  { value: 'triple', label: 'Triple' },
  { value: 'vip', label: 'VIP' },
];
const statuses = [
  { value: 'trống', color: 'green' },
  { value: 'đã đặt', color: 'blue' },
  { value: 'đang sử dụng', color: 'orange' },
  { value: 'đang dọn dẹp', color: 'purple' },
];

const RoomManagement = () => {
  const [rooms, setRooms] = useState(mockRooms);
  const [viewingRoom, setViewingRoom] = useState<any>(null);
  const [viewModal, setViewModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const handleView = (room: any) => {
    setViewingRoom(room);
    setViewModal(true);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleTypeFilter = (value: string) => {
    setFilterType(value);
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType ? room.type === filterType : true;
    const matchesStatus = filterStatus ? room.status === filterStatus : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns: ColumnsType<any> = [
    {
      title: 'Số phòng',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Loại phòng',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const roomType = roomTypes.find(t => t.value === type);
        return roomType ? roomType.label : type;
      },
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusInfo = statuses.find(s => s.value === status);
        return (
          <Tag color={statusInfo?.color || 'default'}>
            {status}
          </Tag>
        );
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            type="primary"
            size="small"
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Input.Search
            placeholder="Tìm kiếm phòng"
            onSearch={handleSearch}
            style={{ width: 200, backgroundColor: '#fff' }}
            allowClear
          />
          <Select
            placeholder="Loại phòng"
            style={{ width: 150, backgroundColor: '#fff' }}
            dropdownStyle={{ backgroundColor: '#fff' }}
            allowClear
            onChange={handleTypeFilter}
            options={roomTypes.map(type => ({ value: type.value, label: type.label, style: { color: '#333' } }))}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150, backgroundColor: '#fff' }}
            dropdownStyle={{ backgroundColor: '#fff' }}
            allowClear
            onChange={handleStatusFilter}
            options={statuses.map(s => ({ value: s.value, label: s.value, style: { color: '#333' } }))}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredRooms}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Chi tiết phòng"
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={[
          <Button key="close" onClick={() => setViewModal(false)}>
            Đóng
          </Button>
        ]}
        bodyStyle={{ backgroundColor: '#fff', color: '#333' }}
      >
        {viewingRoom && (
          <div>
            <p><strong>Số phòng:</strong> {viewingRoom.name}</p>
            <p><strong>Loại phòng:</strong> {roomTypes.find(t => t.value === viewingRoom.type)?.label || viewingRoom.type}</p>
            <p><strong>Trạng thái:</strong> <Tag color={statuses.find(s => s.value === viewingRoom.status)?.color}>{viewingRoom.status}</Tag></p>
            <p><strong>Mô tả:</strong> Phòng tiêu chuẩn với đầy đủ tiện nghi</p>
            <p><strong>Giá:</strong> {viewingRoom.type === 'vip' ? '1,500,000' : viewingRoom.type === 'duo' ? '800,000' : '500,000'} VNĐ/đêm</p>
            <p><strong>Tiện ích:</strong> Wifi, TV, Điều hòa, Tủ lạnh</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagement;
