import type { NextApiRequest, NextApiResponse } from 'next';

// Booking type interface
interface Booking {
  id: string;
  roomId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// In-memory bookings storage (would be a database in a real application)
let bookings: Booking[] = [];

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    try {
      // Create a new booking
      const { 
        roomId, 
        userId, 
        guestName, 
        guestEmail, 
        guestPhone, 
        checkInDate, 
        checkOutDate, 
        guests,
        totalPrice
      } = req.body;
      
      // Validate required fields
      if (!roomId || !guestName || !guestEmail || !checkInDate || !checkOutDate || !guests || !totalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Validate dates
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dates'
        });
      }
      
      if (checkIn >= checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }
      
      // In a real app, we would check if the room is available for the requested dates
      
      // Create a new booking
      const newBooking: Booking = {
        id: Date.now().toString(), // Simple ID generation, would use UUID in a real app
        roomId,
        userId,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice,
        status: 'confirmed', // Auto-confirm for demo purposes
        createdAt: new Date().toISOString()
      };
      
      // Add to bookings array (would save to database in a real app)
      bookings.push(newBooking);
      
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: newBooking
      });
    } catch (error) {
      console.error('Booking error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your booking'
      });
    }
  } else if (req.method === 'GET') {
    // Get all bookings (in a real app, would filter by user or use authentication)
    const { userId, roomId } = req.query;
    
    let filteredBookings = [...bookings];
    
    if (userId && typeof userId === 'string') {
      filteredBookings = filteredBookings.filter(booking => booking.userId === userId);
    }
    
    if (roomId && typeof roomId === 'string') {
      filteredBookings = filteredBookings.filter(booking => booking.roomId === roomId);
    }
    
    return res.status(200).json({
      success: true,
      data: filteredBookings
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ 
      success: false,
      message: `Method ${req.method} Not Allowed` 
    });
  }
} 