import { message, notification } from 'antd';
import dayjs from 'dayjs';

export interface NotificationItem {
  id: string;
  type: 'booking' | 'checkin' | 'checkout' | 'room' | 'system' | 'revenue';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  today: number;
}

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheck: string = dayjs().toISOString();
  private isClient: boolean = false;

  constructor() {
    // Check if we're on the client side
    this.isClient = typeof window !== 'undefined';

    if (this.isClient) {
      // Load notifications from localStorage
      this.loadNotifications();

      // Add some sample notifications if none exist
      if (this.notifications.length === 0) {
        this.addSampleNotifications();
      }

      // Start polling for new notifications
      this.startPolling();
    }
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: NotificationItem[]) => void) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Save notifications to localStorage
  private saveNotifications() {
    if (!this.isClient) return;

    try {
      localStorage.setItem('hotel_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('hotel_notifications_last_check', this.lastCheck);
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotifications() {
    if (!this.isClient) return;

    try {
      const saved = localStorage.getItem('hotel_notifications');
      const lastCheck = localStorage.getItem('hotel_notifications_last_check');

      if (saved) {
        this.notifications = JSON.parse(saved);
      }

      if (lastCheck) {
        this.lastCheck = lastCheck;
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  // Start polling for new notifications
  startPolling(interval: number = 30000) { // 30 seconds
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, interval);

    // Initial check
    this.checkForNewNotifications();
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Check for new notifications from APIs
  private async checkForNewNotifications() {
    try {
      const now = dayjs();
      const today = now.format('YYYY-MM-DD');

      // Check for new bookings
      await this.checkNewBookings();

      // Check for check-ins today
      await this.checkTodayCheckIns();

      // Check for check-outs today
      await this.checkTodayCheckOuts();

      // Check for room status changes
      await this.checkRoomStatusChanges();

      this.lastCheck = now.toISOString();
      this.saveNotifications();
      this.notifyListeners();

    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // Check for new bookings
  private async checkNewBookings() {
    try {
      const response = await fetch('/api/DatPhong/GetAll');
      if (!response.ok) return;

      const data = await response.json();
      const bookings = Array.isArray(data) ? data : (data.items || []);

      // Find bookings created since last check
      const newBookings = bookings.filter((booking: any) => {
        const bookingDate = dayjs(booking.ngayDat || booking.createdAt);
        return bookingDate.isAfter(dayjs(this.lastCheck));
      });

      newBookings.forEach((booking: any) => {
        this.addNotification({
          type: 'booking',
          title: 'Đặt phòng mới',
          message: `Khách hàng ${booking.khachHang?.tenKH || 'N/A'} đã đặt phòng ${booking.phong?.soPhong || booking.maPhong}`,
          priority: 'medium',
          data: booking
        });
      });

    } catch (error) {
      console.error('Error checking new bookings:', error);
    }
  }

  // Check for today's check-ins
  private async checkTodayCheckIns() {
    try {
      const response = await fetch('/api/DatPhong/GetAll');
      if (!response.ok) return;

      const data = await response.json();
      const bookings = Array.isArray(data) ? data : (data.items || []);
      const today = dayjs().format('YYYY-MM-DD');

      const todayCheckIns = bookings.filter((booking: any) => {
        const checkInDate = dayjs(booking.checkIn || booking.ngayBatDau).format('YYYY-MM-DD');
        return checkInDate === today && booking.trangThai === 2; // Confirmed bookings
      });

      // Only notify if we haven't already notified about these check-ins
      todayCheckIns.forEach((booking: any) => {
        const existingNotification = this.notifications.find(n =>
          n.type === 'checkin' &&
          n.data?.maDatPhong === booking.maDatPhong &&
          dayjs(n.timestamp).format('YYYY-MM-DD') === today
        );

        if (!existingNotification) {
          this.addNotification({
            type: 'checkin',
            title: 'Nhận phòng hôm nay',
            message: `Khách hàng ${booking.khachHang?.tenKH || 'N/A'} sẽ nhận phòng ${booking.phong?.soPhong || booking.maPhong} hôm nay`,
            priority: 'high',
            data: booking
          });
        }
      });

    } catch (error) {
      console.error('Error checking today check-ins:', error);
    }
  }

  // Check for today's check-outs
  private async checkTodayCheckOuts() {
    try {
      const response = await fetch('/api/DatPhong/GetAll');
      if (!response.ok) return;

      const data = await response.json();
      const bookings = Array.isArray(data) ? data : (data.items || []);
      const today = dayjs().format('YYYY-MM-DD');

      const todayCheckOuts = bookings.filter((booking: any) => {
        const checkOutDate = dayjs(booking.checkOut || booking.ngayKetThuc).format('YYYY-MM-DD');
        return checkOutDate === today && booking.trangThai === 3; // Checked in
      });

      todayCheckOuts.forEach((booking: any) => {
        const existingNotification = this.notifications.find(n =>
          n.type === 'checkout' &&
          n.data?.maDatPhong === booking.maDatPhong &&
          dayjs(n.timestamp).format('YYYY-MM-DD') === today
        );

        if (!existingNotification) {
          this.addNotification({
            type: 'checkout',
            title: 'Trả phòng hôm nay',
            message: `Khách hàng ${booking.khachHang?.tenKH || 'N/A'} sẽ trả phòng ${booking.phong?.soPhong || booking.maPhong} hôm nay`,
            priority: 'high',
            data: booking
          });
        }
      });

    } catch (error) {
      console.error('Error checking today check-outs:', error);
    }
  }

  // Check for room status changes
  private async checkRoomStatusChanges() {
    try {
      const response = await fetch('/api/Phong/GetAll');
      if (!response.ok) return;

      const data = await response.json();
      const rooms = Array.isArray(data) ? data : (data.items || []);

      // Check for rooms that need cleaning (status 5)
      const roomsNeedCleaning = rooms.filter((room: any) => room.trangThai === 5);

      roomsNeedCleaning.forEach((room: any) => {
        const existingNotification = this.notifications.find(n =>
          n.type === 'room' &&
          n.data?.maPhong === room.maPhong &&
          n.message.includes('cần dọn dẹp') &&
          dayjs(n.timestamp).isAfter(dayjs().subtract(2, 'hours'))
        );

        if (!existingNotification) {
          this.addNotification({
            type: 'room',
            title: 'Phòng cần dọn dẹp',
            message: `Phòng ${room.soPhong} cần được dọn dẹp`,
            priority: 'medium',
            data: room
          });
        }
      });

    } catch (error) {
      console.error('Error checking room status:', error);
    }
  }

  // Add a new notification
  addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: dayjs().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Show browser notification for high priority
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      this.showBrowserNotification(newNotification);
    }

    this.saveNotifications();
    this.notifyListeners();
  }

  // Show browser notification
  private showBrowserNotification(notif: NotificationItem) {
    if (!this.isClient) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/favicon.ico'
      });
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isClient) return false;

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get all notifications
  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  // Get notification statistics
  getStats(): NotificationStats {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const urgent = this.notifications.filter(n => n.priority === 'urgent').length;
    const today = this.notifications.filter(n =>
      dayjs(n.timestamp).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length;

    return { total, unread, urgent, today };
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Add sample notifications for demo purposes
  private addSampleNotifications() {
    if (!this.isClient) return;

    const sampleNotifications = [
      {
        type: 'booking' as const,
        title: 'Đặt phòng mới',
        message: 'Khách hàng Nguyễn Văn A đã đặt phòng 101',
        priority: 'medium' as const,
        data: { maDatPhong: 'sample_1', maPhong: 101, tenKH: 'Nguyễn Văn A' }
      },
      {
        type: 'checkin' as const,
        title: 'Nhận phòng hôm nay',
        message: 'Khách hàng Trần Thị B sẽ nhận phòng 205 hôm nay',
        priority: 'high' as const,
        data: { maDatPhong: 'sample_2', maPhong: 205, tenKH: 'Trần Thị B' }
      },
      {
        type: 'room' as const,
        title: 'Phòng cần dọn dẹp',
        message: 'Phòng 301 cần được dọn dẹp',
        priority: 'medium' as const,
        data: { maPhong: 301, soPhong: '301' }
      }
    ];

    sampleNotifications.forEach(notification => {
      this.addNotification(notification);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
