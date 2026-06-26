/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  dripPostsCount: number;
  isPremium: boolean;
  isVerified?: boolean;
  isBanned?: boolean;
  createdAt: number;
}

export interface PostRada {
  id: string;
  title: string;
  source: string;
  content: string;
  imageUrl?: string;
  category: string;
  link?: string;
  isApproved?: boolean;
  timestamp: number;
}

export interface PostDrip {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  sellerVerified?: boolean;
  status: 'available' | 'sold';
  timestamp: number;
}

export interface PostHustle {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'gig' | 'item';
  sellerId: string;
  sellerName: string;
  sellerVerified?: boolean;
  buyerId?: string;
  status: 'available' | 'escrow' | 'completed';
  timestamp: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'drip_premium' | 'hustle_escrow' | 'hustle_fee';
  amount: number;
  currency: 'KSh';
  status: 'pending' | 'completed' | 'failed';
  pesapalTrackingId?: string;
  timestamp: number;
}
