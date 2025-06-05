import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, DatePicker, TimePicker, Select, message, Typography, Card, Row, Col, Statistic, Tabs, Calendar, Badge, Tooltip, Checkbox, Divider } from 'antd';
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

  // Multi-date selection states
  const [isMultiDateMode, setIsMultiDateMode] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useState<Dayjs[]>([]);
  const [isCalendarMultiSelect, setIsCalendarMultiSelect] = useState<boolean>(false);

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
        const startDate = dateRange[0];
        const endDate = dateRange[1];

        // Kiểm tra null trước khi sử dụng
        if (startDate && endDate) {
          return shiftDate.isAfter(startDate) && shiftDate.isBefore(endDate.add(1, 'day'));
        }
        return true;
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
      setWorkShifts(data);
      setFilteredWorkShifts(data); // Initialize filtered data with all data
    } catch (error: any) {

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

  // Function to fetch ALL employees for dropdown (handle pagination)
  const fetchEmployees = async () => {
    try {
      let allEmployees: Employee[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Loop through all pages to get all employees
      while (hasMorePages) {
        try {
          // Try to get employees with pagination
          const data = await employeeService.getAllEmployees(currentPage, 100); // Large page size

          if (data && Array.isArray(data.items)) {
            allEmployees = [...allEmployees, ...data.items];

            // Check if there are more pages
            const totalPages = Math.ceil(data.totalItems / data.pageSize);
            hasMorePages = currentPage < totalPages;
            currentPage++;
          } else if (Array.isArray(data)) {
            // Fallback nếu API trả về array trực tiếp (không có pagination)
            allEmployees = data;
            hasMorePages = false;
          } else {
            hasMorePages = false;
          }
        } catch (pageError) {
          hasMorePages = false;
        }
      }
      setEmployees(allEmployees);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên.');
      setEmployees([]);
    }
  };

  // Handle edit work shift
  const handleEdit = (workShift: WorkShift) => {
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
      message.error('Không thể xóa ca làm. Vui lòng thử lại sau.');
    }
  };

  // Handle add new work shift
  const handleAdd = () => {
    setEditingWorkShift(null);
    form.resetFields();
    setSelectedDates([]);
    setIsMultiDateMode(false);
    setIsModalVisible(true);

    // Tải lại danh sách nhân viên khi mở modal
    fetchEmployees();
  };

  // Handle save work shift (create or update)
  const handleSave = () => {
    // Custom validation for multi-date mode
    if (!editingWorkShift && isMultiDateMode && selectedDates.length === 0) {
      message.error('Vui lòng chọn ít nhất một ngày');
      return;
    }

    form.validateFields().then(async values => {
      try {
        // Format time values
        const baseFormattedValues = {
          ...values,
          gioBatDau: values.gioBatDau ? values.gioBatDau.format('HH:mm') : null,
          gioKetThuc: values.gioKetThuc ? values.gioKetThuc.format('HH:mm') : null,
        };

        if (editingWorkShift) {
          // Update existing work shift
          const formattedValues = {
            ...baseFormattedValues,
            ngayLamViec: values.ngayLamViec ? values.ngayLamViec.format('YYYY-MM-DD') : null,
          };
          await workShiftService.updateWorkShift(editingWorkShift.id!, formattedValues);
          message.success('Cập nhật ca làm thành công');
        } else {
          // Create new work shift(s)
          if (isMultiDateMode && selectedDates.length > 0) {
            // Create shifts for multiple dates
            const createPromises = selectedDates.map(date => {
              const formattedValues = {
                ...baseFormattedValues,
                ngayLamViec: date.format('YYYY-MM-DD'),
              };
              return workShiftService.createWorkShift(formattedValues);
            });

            await Promise.all(createPromises);
            message.success(`Tạo thành công ${selectedDates.length} ca làm cho các ngày đã chọn`);
          } else {
            // Create single shift
            const formattedValues = {
              ...baseFormattedValues,
              ngayLamViec: values.ngayLamViec ? values.ngayLamViec.format('YYYY-MM-DD') : null,
            };
            await workShiftService.createWorkShift(formattedValues);
            message.success('Tạo ca làm mới thành công');
          }
        }

        setIsModalVisible(false);
        setSelectedDates([]);
        setIsMultiDateMode(false);
        fetchWorkShifts();
      } catch (error) {
        message.error('Không thể lưu ca làm. Vui lòng thử lại sau.');
      }
    }).catch(() => {
      // Form validation failed
      if (!editingWorkShift && isMultiDateMode && selectedDates.length === 0) {
        message.error('Vui lòng chọn ít nhất một ngày');
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
    // Check if this date is selected in multi-select mode
    const isSelected = isCalendarMultiSelect && selectedDates.some(d =>
      d.format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
    );

    // Filter shifts for this date
    const dateShifts = filteredWorkShifts.filter(shift => {
      if (!shift.ngayLamViec) return false;
      return dayjs(shift.ngayLamViec).format('YYYY-MM-DD') === value.format('YYYY-MM-DD');
    });

    return (
      <div style={{
        position: 'relative',
        backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
        border: isSelected ? '2px solid #1890ff' : 'none',
        borderRadius: '4px',
        padding: '2px',
        minHeight: '20px'
      }}>
        {/* Selected indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#1890ff',
            borderRadius: '50%',
            zIndex: 1
          }} />
        )}

        {/* Shifts display */}
        {dateShifts.length > 0 && (
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
        )}
      </div>
    );
  };

  // Handle calendar select
  const onCalendarSelect = (date: Dayjs) => {
    if (isCalendarMultiSelect) {
      // Multi-select mode: toggle date selection
      const dateString = date.format('YYYY-MM-DD');
      const isAlreadySelected = selectedDates.some(d => d.format('YYYY-MM-DD') === dateString);

      if (isAlreadySelected) {
        // Remove date from selection
        setSelectedDates(selectedDates.filter(d => d.format('YYYY-MM-DD') !== dateString));
      } else {
        // Add date to selection
        setSelectedDates([...selectedDates, date]);
      }
    } else {
      // Single select mode: normal behavior
      setSelectedDate(date);

      // Filter shifts for the selected date
      const dateShifts = workShifts.filter(shift => {
        if (!shift.ngayLamViec) return false;
        return dayjs(shift.ngayLamViec).format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
      });

      setFilteredWorkShifts(dateShifts);
      setDateRange([date, date]);
      searchForm.setFieldsValue({ dateRange: [date, date] });
    }
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
                  {Array.isArray(employees) && employees.length > 0 ? (
                    employees.map(employee => (
                      <Option key={employee.maNV} value={employee.maNV}>
                        {employee.hoTen || employee.hoTen_}
                      </Option>
                    ))
                  ) : (
                    <Option value={null} disabled>Đang tải danh sách nhân viên...</Option>
                  )}
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
        <Space>
          {activeTab === "calendar" && (
            <>
              <Button
                type={isCalendarMultiSelect ? "primary" : "default"}
                icon={<CalendarOutlined />}
                onClick={() => {
                  setIsCalendarMultiSelect(!isCalendarMultiSelect);
                  if (!isCalendarMultiSelect) {
                    setSelectedDates([]);
                  }
                }}
              >
                {isCalendarMultiSelect ? "Thoát chế độ chọn nhiều" : "Chọn nhiều ngày"}
              </Button>
              {isCalendarMultiSelect && selectedDates.length > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setIsMultiDateMode(true);
                    handleAdd();
                  }}
                >
                  Tạo ca cho {selectedDates.length} ngày đã chọn
                </Button>
              )}
            </>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm ca làm
          </Button>
        </Space>
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
        <>
          {/* Multi-select info panel */}
          {isCalendarMultiSelect && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Chế độ chọn nhiều ngày đang bật</strong>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    Click vào các ngày trên lịch để chọn. Đã chọn: {selectedDates.length} ngày
                  </div>
                </div>
                {selectedDates.length > 0 && (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setSelectedDates([])}
                    >
                      Xóa tất cả
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setIsMultiDateMode(true);
                        handleAdd();
                      }}
                    >
                      Tạo ca làm
                    </Button>
                  </Space>
                )}
              </div>

              {/* Selected dates display */}
              {selectedDates.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Ngày đã chọn:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedDates
                      .sort((a, b) => a.unix() - b.unix())
                      .map((date, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{date.format('DD/MM/YYYY')} ({date.format('dddd')})</span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            style={{ padding: '0 4px', height: '16px', fontSize: '12px' }}
                            onClick={() => {
                              const newDates = selectedDates.filter((_, i) => i !== index);
                              setSelectedDates(newDates);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card>
            <Calendar
              dateCellRender={dateCellRender}
              onSelect={onCalendarSelect}
              value={selectedDate}
              locale={locale}
            />
          </Card>
        </>
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

          {/* Multi-date selection option */}
          {!editingWorkShift && (
            <Form.Item>
              <Checkbox
                checked={isMultiDateMode}
                onChange={(e) => {
                  setIsMultiDateMode(e.target.checked);
                  if (e.target.checked) {
                    form.setFieldsValue({ ngayLamViec: undefined });
                    setSelectedDates([]);
                  } else {
                    setSelectedDates([]);
                  }
                }}
              >
                Chọn nhiều ngày cùng lúc
              </Checkbox>
            </Form.Item>
          )}

          {isMultiDateMode && !editingWorkShift ? (
            <>
              {/* Show different UI based on how dates were selected */}
              {isCalendarMultiSelect && selectedDates.length > 0 ? (
                <Form.Item
                  label="Ngày đã chọn từ lịch"
                  help={`Đã chọn ${selectedDates.length} ngày từ lịch`}
                >
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
                    {selectedDates
                      .sort((a, b) => a.unix() - b.unix())
                      .map((date, index) => (
                        <div key={index} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            {date.format('DD/MM/YYYY')} ({date.format('dddd')})
                          </span>
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => {
                              const newDates = selectedDates.filter((_, i) => i !== index);
                              setSelectedDates(newDates);
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      ))}
                  </div>
                </Form.Item>
              ) : (
                <>
                  <Form.Item
                    label="Chọn khoảng ngày"
                    required
                    help={selectedDates.length > 0 ? `Đã chọn ${selectedDates.length} ngày` : 'Vui lòng chọn ít nhất một ngày'}
                    validateStatus={selectedDates.length === 0 ? 'error' : 'success'}
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder={['Từ ngày', 'Đến ngày']}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          const startDate = dates[0];
                          const endDate = dates[1];
                          const dateList: Dayjs[] = [];

                          let currentDate = startDate;
                          while (currentDate.isBefore(endDate, 'day') || currentDate.isSame(endDate, 'day')) {
                            dateList.push(currentDate);
                            currentDate = currentDate.add(1, 'day');
                          }

                          setSelectedDates(dateList);
                        } else {
                          setSelectedDates([]);
                        }
                      }}
                    />
                  </Form.Item>

                  {selectedDates.length > 0 && (
                    <Form.Item label="Ngày đã chọn">
                      <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
                        {selectedDates.map((date, index) => (
                          <div key={index} style={{ marginBottom: '4px' }}>
                            <span style={{ marginRight: '8px' }}>
                              {date.format('DD/MM/YYYY')} ({date.format('dddd')})
                            </span>
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={() => {
                                const newDates = selectedDates.filter((_, i) => i !== index);
                                setSelectedDates(newDates);
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Form.Item>
                  )}
                </>
              )}
            </>
          ) : (
            <Form.Item
              name="ngayLamViec"
              label="Ngày làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn ngày làm việc' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày làm việc" />
            </Form.Item>
          )}

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
              placeholder="Gõ để tìm nhân viên..."
              showSearch
              filterOption={false}
              onSearch={async (value) => {
                if (value && value.length >= 2) {
                  try {
                    const data = await employeeService.getAllEmployees(1, 20);
                    if (data && Array.isArray(data.items)) {
                      const filtered = data.items.filter(emp =>
                        (emp.hoTen || emp.hoTen_ || '').toLowerCase().includes(value.toLowerCase())
                      );
                      setEmployees(filtered);
                    }
                  } catch (error) {
                  }
                } else if (value.length === 0) {
                  setEmployees([]);
                }
              }}
              onFocus={() => {
                if (employees.length === 0) {
                  // Load first 20 employees on focus
                  employeeService.getAllEmployees(1, 20).then(data => {
                    if (data && Array.isArray(data.items)) {
                      setEmployees(data.items);
                    }
                  }).catch(() => {});
                }
              }}
              notFoundContent={employees.length === 0 ? "Gõ tên để tìm nhân viên" : "Không tìm thấy"}
            >
              <Option value={null}>Chưa phân công</Option>
              {employees.map(employee => (
                <Option
                  key={employee.maNV || employee.id}
                  value={employee.maNV || employee.id}
                >
                  {employee.hoTen || employee.hoTen_ || 'Nhân viên không tên'}
                </Option>
              ))}
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
