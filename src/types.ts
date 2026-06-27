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
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  bio?: string;
  language?: 'en' | 'sheng' | 'sw';
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  timestamp: number;
  type?: 'text' | 'image' | 'system';
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  lastMessage?: string;
  lastSenderId?: string;
  lastTimestamp?: number;
  unreadCount?: Record<string, number>;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'drip_premium' | 'hustle_escrow' | 'drip_escrow' | 'hustle_fee' | 'payout';
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'escrow';
  pesapalTrackingId?: string;
  timestamp: number;
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
  likes?: string[];
  bookmarks?: string[];
  reshares?: string[];
  likesCount?: number;
  commentsCount?: number;
  timestamp: number;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  timestamp: number;
  parentId?: string;
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
  status: 'available' | 'escrow' | 'sold';
  likes?: string[];
  commentsCount?: number;
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
  likes?: string[];
  commentsCount?: number;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'hustle_accepted' | 'post_approved' | 'system';
  isRead: boolean;
  timestamp: number;
}
