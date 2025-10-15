import { Timestamp } from 'firebase/firestore';

// This is the "contract" for your Prayer Navigator.
// It tells TypeScript which screens are allowed in this stack.
export type PrayerStackParamList = {
  PrayerHub: undefined;
  PrayerJournal: undefined;
  PrayerWall: undefined;
};

// This defines the structure for a single prayer request object.
// Using this type prevents errors when reading data from Firestore.
export type PrayerRequest = {
  id: string; // The document ID from Firestore
  request: string;
  submittedAt: Timestamp;
  userId: string;
  isPublic: boolean;
  amenCount: number;
  name?: string; // Optional field
  address?: string; // Optional field
};

