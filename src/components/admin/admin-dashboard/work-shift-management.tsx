import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, DatePicker, TimePicker, Select, message, Typography, Card, Row, Col, Statistic, Tabs, Calendar, Badge, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ScheduleOutlined, UserOutlined, SearchOutlined, FilterOutlined, CalendarOutlined, TableOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { WorkShift, workShiftService } from '../../../services/workShiftService';
import { Employee, employeeService } from '../../../services/employeeService';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import locale from 'antd/lib/date-picker/locale/vi_VN';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const WorkShiftManagement: React.FC = () => {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [filteredWorkShifts, setFilteredWorkShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingWorkShift, setEditingWorkShift] = useState<WorkShift | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("table");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // Filters
  const [searchText, setSearchText] = useState<string>("");
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Statistics
  const [totalWorkShifts, setTotalWorkShifts] = useState<number>(0);
  const [activeWorkShifts, setActiveWorkShifts] = useState<number>(0);
  const [employeesWithShifts, setEmployeesWithShifts] = useState<number>(0);

  useEffect(() => {
    fetchWorkShifts();
    fetchEmployees();
  }, []);

  // Apply filters when filter conditions change
  useEffect(() => {
    applyFilters();
  }, [workShifts, searchText, employeeFilter, statusFilter, dateRange]);

  // Calculate statistics
  useEffect(() => {
    if (workShifts.length > 0) {
      setTotalWorkShifts(workShifts.length);
      setActiveWorkShifts(workShifts.filter(shift => shift.trangThai === 1).length);

      // Count unique employees with shifts
      const uniqueEmployees = new Set(workShifts.map(shift => shift.maNV).filter(Boolean));
      setEmployeesWithShifts(uniqueEmployees.size);
    }
  }, [workShifts]);

  // Apply all filters to the work shifts
  const applyFilters = () => {
    let result = [...workShifts];

    // Apply search text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(shift =>
        (shift.tenCa && shift.tenCa.toLowerCase().includes(searchLower)) ||
        (shift.ghiChu && shift.ghiChu.toLowerCase().includes(searchLower))
      );
    }

    // Apply employee filter
    if (employeeFilter !== null) {
      result = result.filter(shift => shift.maNV === employeeFilter);
    }

    // Apply status filter
    if (statusFilter !== null) {
      result = result.filter(shift => shift.trangThai === statusFilter);
    }

    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      result = result.filter(shift => {
        if (!shift.ngayLamViec) return false;
        const shiftDate = dayjs(shift.ngayLamViec);
        return shiftDate.isAfter(dateRange[0]) && shiftDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }

    setFilteredWorkShifts(result);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText("");
    setEmployeeFilter(null);
    setStatusFilter(null);
    setDateRange([null, null]);
    searchForm.resetFields();
    setFilteredWorkShifts(workShifts);
  };

  // Function to fetch work shifts from API
  const fetchWorkShifts = async (retryCount = 0) => {
    setLoading(true);
    try {
      const data = await workShiftService.getAllWorkShifts();
      console.log('Fetched work shifts data:', data);
      setWorkShifts(data);
      setFilteredWorkShifts(data); // Initialize filtered data with all data
    } catch (error: any) {
      console.error('Error fetching work shifts:', error);

      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        message.warning(`Đang thử kết nối lại... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchWorkShifts(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      message.error('Không thể tải danh sách ca làm từ máy chủ.');
      setWorkShifts([]);
      setFilteredWorkShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees data:', data);

      // Kiểm tra dữ liệu nhân viên
      if (data && data.length > 0) {
        console.log('First employee:', data[0]);
        console.log('Employee fields:', Object.keys(data[0]));
      } else {
        console.warn('No employees found or empty array returned');
      }

      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Không thể tải danh sách nhân viên.');
      setEmployees([]);
    }
  };

  // Handle edit work shift
  const handleEdit = (workShift: WorkShift) => {
    console.log('Editing work shift:', workShift);
    setEditingWorkShift(workShift);
    form.setFieldsValue({
      tenCa: workShift.tenCa,
      gioBatDau: workShift.gioBatDau ? dayjs(workShift.gioBatDau, 'HH:mm') : null,
      gioKetThuc: workShift.gioKetThuc ? dayjs(workShift.gioKetThuc, 'HH:mm') : null,
      ngayLamViec: workShift.ngayLamViec ? dayjs(workShift.ngayLamViec) : null,
      maNV: workShift.maNV,
      ghiChu: workShift.ghiChu,
      trangThai: workShift.trangThai
    });
    setIsModalVisible(true);

    // Tải lại danh sách nhân viên khi mở modal
    fetchEmployees();
  };

  // Handle delete work shift
  const handleDelete = async (id: number) => {
    try {
      await workShiftService.deleteWorkShift(id);
      message.success('Xóa ca làm thành công');
      fetchWorkShifts();
    } catch (error) {
      console.error('Error deleting work shift:', error);
      message.error('Không thể xóa ca làm. Vui lòng thử lại sau.');
    }
  };

  // Handle add new work shift
  const handleAdd = () => {
    setEditingWorkShift(null);
    form.resetFields();
    setIsModalVisible(true);

    // Tải lại danh sách nhân viên khi mở modal
    fetchEmployees();
  };

  // Handle save work shift (create or update)
  const handleSave = () => {
    form.validateFields().then(async values => {
      try {
        // Format time values
        const formattedValues = {
          ...values,
          gioBatDau: values.gioBatDau ? values.gioBatDau.format('HH:mm') : null,
          gioKetThuc: values.gioKetThuc ? values.gioKetThuc.format('HH:mm') : null,
          ngayLamViec: values.ngayLamViec ? values.ngayLamViec.format('YYYY-MM-DD') : null,
        };

        console.log('Sending data to API:', formattedValues);

        if (editingWorkShift) {
          // Update existing work shift
          await workShiftService.updateWorkShift(editingWorkShift.id!, formattedValues);
          message.success('Cập nhật ca làm thành công');
        } else {
          // Create new work shift
          await workShiftService.createWorkShift(formattedValues);
          message.success('Tạo ca làm mới thành công');
        }

        setIsModalVisible(false);
        fetchWorkShifts();
      } catch (error) {
        console.error('Error saving work shift:', error);
        message.error('Không thể lưu ca làm. Vui lòng thử lại sau.');
      }
    });
  };

  // Define columns for the table
  const columns: ColumnsType<WorkShift> = [
    {
      title: 'Tên ca',
      dataIndex: 'tenCa',
      key: 'tenCa',
      sorter: (a, b) => (a.tenCa || '').localeCompare(b.tenCa || ''),
    },
    {
      title: 'Ngày làm việc',
      dataIndex: 'ngayLamViec',
      key: 'ngayLamViec',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A',
      sorter: (a, b) => {
        if (!a.ngayLamViec) return -1;
        if (!b.ngayLamViec) return 1;
        return dayjs(a.ngayLamViec).unix() - dayjs(b.ngayLamViec).unix();
      },
    },
    {
      title: 'Giờ bắt đầu',
      dataIndex: 'gioBatDau',
      key: 'gioBatDau',
    },
    {
      title: 'Giờ kết thúc',
      dataIndex: 'gioKetThuc',
      key: 'gioKetThuc',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'tenNV',
      key: 'tenNV',
      render: (text, record) => {
        const employee = employees.find(e => e.maNV === record.maNV);
        return employee ? (employee.hoTen || employee.hoTen_) : (text || 'Chưa phân công');
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'ghiChu',
      key: 'ghiChu',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (status) => (
        <span style={{ color: status === 1 ? 'green' : 'red' }}>
          {status === 1 ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id!)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Handle calendar cell render
  const dateCellRender = (value: Dayjs) => {
    // Filter shifts for this date
    const dateShifts = filteredWorkShifts.filter(shift => {
      if (!shift.ngayLamViec) return false;
      return dayjs(shift.ngayLamViec).format('YYYY-MM-DD') === value.format('YYYY-MM-DD');
    });

    if (dateShifts.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dateShifts.slice(0, 3).map(shift => (
          <li key={shift.id} style={{ marginBottom: 3 }}>
            <Tooltip title={`${shift.tenCa} (${shift.gioBatDau} - ${shift.gioKetThuc})`}>
              <Badge
                color={shift.trangThai === 1 ? 'green' : 'red'}
                text={
                  <span style={{ fontSize: '12px' }}>
                    {shift.tenCa} ({shift.gioBatDau})
                  </span>
                }
              />
            </Tooltip>
          </li>
        ))}
        {dateShifts.length > 3 && (
          <li>
            <span style={{ fontSize: '12px', color: '#1890ff' }}>
              +{dateShifts.length - 3} ca làm khác
            </span>
          </li>
        )}
      </ul>
    );
  };

  // Handle calendar select
  const onCalendarSelect = (date: Dayjs) => {
    setSelectedDate(date);

    // Filter shifts for the selected date
    const dateShifts = workShifts.filter(shift => {
      if (!shift.ngayLamViec) return false;
      return dayjs(shift.ngayLamViec).format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });

    setFilteredWorkShifts(dateShifts);
    setDateRange([date, date]);
    searchForm.setFieldsValue({ dateRange: [date, date] });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Quản lý ca làm</h2>
        <p>Xem và quản lý tất cả ca làm trong hệ thống</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số ca làm"
              value={totalWorkShifts}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ca làm hoạt động"
              value={activeWorkShifts}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Nhân viên có ca làm"
              value={employeesWithShifts}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter form */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="horizontal"
          onFinish={() => applyFilters()}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="searchText" label="Tìm kiếm">
                <Input
                  placeholder="Tên ca làm, ghi chú..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="employeeFilter" label="Nhân viên">
                <Select
                  placeholder="Chọn nhân viên"
                  allowClear
                  onChange={value => setEmployeeFilter(value)}
                >
                  {employees.map(employee => (
                    <Option key={employee.maNV} value={employee.maNV}>
                      {employee.hoTen || employee.hoTen_}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="statusFilter" label="Trạng thái">
                <Select
                  placeholder="Chọn trạng thái"
                  allowClear
                  onChange={value => setStatusFilter(value)}
                >
                  <Option value={1}>Hoạt động</Option>
                  <Option value={0}>Không hoạt động</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dateRange" label="Khoảng thời gian">
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  onChange={dates => setDateRange(dates as [Dayjs, Dayjs])}
                  locale={locale}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                  Đặt lại
                </Button>
                <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
                  Lọc
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginRight: 'auto' }}
        >
          <TabPane
            tab={<span><TableOutlined /> Bảng</span>}
            key="table"
          />
          <TabPane
            tab={<span><CalendarOutlined /> Lịch</span>}
            key="calendar"
          />
        </Tabs>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm ca làm
        </Button>
      </div>

      {activeTab === "table" ? (
        <Table
          columns={columns}
          dataSource={filteredWorkShifts}
          rowKey={(record) => record.id?.toString() || Math.random().toString()}
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <Card>
          <Calendar
            dateCellRender={dateCellRender}
            onSelect={onCalendarSelect}
            value={selectedDate}
            locale={locale}
          />
        </Card>
      )}

      <Modal
        title={editingWorkShift ? "Chỉnh sửa ca làm" : "Thêm ca làm mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {editingWorkShift ? "Cập nhật" : "Thêm"}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenCa"
            label="Tên ca làm"
            rules={[{ required: true, message: 'Vui lòng nhập tên ca làm' }]}
          >
            <Input placeholder="Nhập tên ca làm" />
          </Form.Item>

          <Form.Item
            name="ngayLamViec"
            label="Ngày làm việc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày làm việc' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày làm việc" />
          </Form.Item>

          <Form.Item
            name="gioBatDau"
            label="Giờ bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="Chọn giờ bắt đầu" />
          </Form.Item>

          <Form.Item
            name="gioKetThuc"
            label="Giờ kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="Chọn giờ kết thúc" />
          </Form.Item>

          <Form.Item
            name="maNV"
            label="Nhân viên"
          >
            <Select
              placeholder="Chọn nhân viên"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={employees.length === 0}
              onFocus={() => {
                if (employees.length === 0) {
                  fetchEmployees();
                }
              }}
            >
              <Option value={null}>Chưa phân công</Option>
              {employees.length > 0 ? (
                employees.map(employee => (
                  <Option
                    key={employee.maNV || employee.id}
                    value={employee.maNV || employee.id}
                  >
                    {employee.hoTen || employee.hoTen_ || 'Nhân viên không tên'}
                  </Option>
                ))
              ) : (
                <Option value={null} disabled>Đang tải danh sách nhân viên...</Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="ghiChu"
            label="Ghi chú"
          >
            <TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            initialValue={1}
          >
            <Select>
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Không hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkShiftManagement;
