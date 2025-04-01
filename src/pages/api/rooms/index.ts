import type { NextApiRequest, NextApiResponse } from 'next';

// Room type interface
interface Room {
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
}

// Sample data for rooms
const roomsData: Room[] = [
  {
    id: '101',
    name: 'Phòng 101',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    imageUrl: '/room1.jpg',
    images: ['/room1.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  {
    id: '102',
    name: 'Phòng 102',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    imageUrl: '/room2.jpg',
    images: ['/room2.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  {
    id: '103',
    name: 'Phòng 103',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    imageUrl: '/room3.jpg',
    images: ['/room3.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  {
    id: '104',
    name: 'Phòng 104',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    imageUrl: '/room4.jpg',
    images: ['/room4.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  {
    id: '105',
    name: 'Phòng 105',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    imageUrl: '/room5.jpg',
    images: ['/room5.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
];

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    // Return all rooms or apply filtering if query parameters exist
    const { priceMin, priceMax, guests } = req.query;
    
    let filteredRooms = [...roomsData];
    
    // Filter by price if specified
    if (priceMin && typeof priceMin === 'string') {
      filteredRooms = filteredRooms.filter(room => room.price >= parseInt(priceMin));
    }
    
    if (priceMax && typeof priceMax === 'string') {
      filteredRooms = filteredRooms.filter(room => room.price <= parseInt(priceMax));
    }
    
    // Filter by max guests if specified
    if (guests && typeof guests === 'string') {
      filteredRooms = filteredRooms.filter(room => room.maxGuests >= parseInt(guests));
    }
    
    return res.status(200).json({
      success: true,
      data: filteredRooms
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ 
      success: false,
      message: `Method ${req.method} Not Allowed` 
    });
  }
} 