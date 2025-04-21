// Room and booking service for API calls

// Room interface
export interface Room {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
  images: string[];
  maxGuests: number;
  beds: {
    type: string;
    count: number;
  }[];
  capacity?: number;
}

// Booking interface
export interface Booking {
  roomId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
}

// Response interface
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Get all rooms with optional filtering
 */
export const getRooms = async (
  filters?: { priceMin?: number; priceMax?: number; guests?: number }
): Promise<ApiResponse<Room[]>> => {
  try {
    let url = '/api/rooms';
    
    // Add query parameters if filters exist
    if (filters) {
      const params = new URLSearchParams();
      if (filters.priceMin) params.append('priceMin', filters.priceMin.toString());
      if (filters.priceMax) params.append('priceMax', filters.priceMax.toString());
      if (filters.guests) params.append('guests', filters.guests.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      message: 'Failed to fetch rooms. Please try again later.'
    };
  }
};

/**
 * Get a room by ID
 */
export const getRoomById = async (id: string): Promise<ApiResponse<Room>> => {
  try {
    const response = await fetch(`/api/rooms/${id}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    return {
      success: false,
      message: 'Failed to fetch room details. Please try again later.'
    };
  }
};

/**
 * Book a room
 */
export const bookRoom = async (bookingData: Booking): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error booking room:', error);
    return {
      success: false,
      message: 'Failed to book room. Please try again later.'
    };
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async (userId: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`/api/booking?userId=${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return {
      success: false,
      message: 'Failed to fetch bookings. Please try again later.'
    };
  }
}; 