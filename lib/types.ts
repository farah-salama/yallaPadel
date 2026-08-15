export type Role = "ADMIN" | "PLAYER";
export type CourtStatus = "ACTIVE" | "MAINTENANCE";
export type SlotStatus = "FREE" | "HOLDING" | "RESERVED" | "MAINTENANCE";
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "CHECKED_IN"
  | "NO_SHOW";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "VOIDED"
  | "PROCESSING";
export type RefundStatus = "NONE" | "PROCESSING" | "REFUNDED" | "FAILED";

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: Date;
  password?: string;
};

export type Court = {
  id: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  description: string;
  imageUrl?: string | null;
  peakPriceCents: number;
  offPeakPriceCents: number;
  offPeakEnd: string;
  openingTime: string;
  closingTime: string;
  status: CourtStatus;
};

export type TimeSlot = {
  id: string;
  courtId: string;
  start: Date;
  end: Date;
  status: SlotStatus;
  holdExpiresAt: Date | null;
};

export type Booking = {
  id: string;
  code: string;
  userId: string;
  courtId: string;
  slotId: string;
  status: BookingStatus;
  depositCents: number;
  remainingCents: number;
  totalCents: number;
  playerNames: string[];
  qrToken: string;
  redeemedAt: Date | null;
  cancelledAt: Date | null;
  refundStatus: RefundStatus;
  refundCents: number;
  createdAt: Date;
};

export type Payment = {
  id: string;
  bookingId: string;
  userId: string;
  provider: string;
  amountCents: number;
  status: PaymentStatus;
  paymobTxnId: string | null;
  paymobIntentionId: string | null;
  clientSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingView = Booking & {
  court: Court;
  slot: TimeSlot;
  user: Profile;
  payments: Payment[];
};
