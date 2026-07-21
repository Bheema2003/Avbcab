export type ServiceType = 'Airport' | 'Local' | 'One Way' | 'Round Trip';

export interface Booking {
  id: string;
  serviceType: ServiceType;
  name: string;
  contact: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Driver Assigned' | 'Completed' | 'Cancelled';
  createdAt: string;
  priceEstimate?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}
