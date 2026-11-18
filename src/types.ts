export type ServiceType = 'Airport' | 'Local' | 'One Way' | 'Round Trip';

export interface Booking {
  id: string;
  userId?: string;
  serviceType: ServiceType;
  name: string;
  contact: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Driver Assigned' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
  priceEstimate?: string;
  finalAmount?: string;
  completedAt?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleDetails?: string;
  adminNotes?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}
