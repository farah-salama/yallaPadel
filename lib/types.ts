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
export type FriendStatus = "PENDING" | "ACCEPTED";
export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type PromoKind = "MORNING" | "FLASH";

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: Date;
  password?: string;
  points: number;
  referralCode: string;
  referredById: string | null;
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

export type SlotView = TimeSlot & {
  priceCents: number;
  flash: boolean;
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
  loyaltyRedeemCents: number;
  playerNames: string[];
  qrToken: string;
  redeemedAt: Date | null;
  cancelledAt: Date | null;
  refundStatus: RefundStatus;
  refundCents: number;
  openToJoin: boolean;
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

export type Friendship = {
  id: string;
  fromId: string;
  toId: string;
  status: FriendStatus;
};

export type JoinRequest = {
  id: string;
  bookingId: string;
  userId: string;
  status: RequestStatus;
  createdAt: Date;
};

export type WaitlistEntry = {
  id: string;
  slotId: string;
  userId: string;
  createdAt: Date;
  notifiedAt: Date | null;
  emailedAt?: Date | null;
};

export type Promotion = {
  id: string;
  kind: PromoKind;
  percentOff: number;
  active: boolean;
  hourStart: number | null;
  hourEnd: number | null;
  slotId: string | null;
  endsAt: Date | null;
  usageCount: number;
};

export type LoyaltyEvent = {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  bookingId: string | null;
  createdAt: Date;
};

export type WaitlistNotice = {
  userId: string;
  email: string;
  name: string;
  slotId: string;
  courtName: string;
  start: Date;
  flashPercent: number | null;
};

export type BookingView = Booking & {
  court: Court;
  slot: TimeSlot;
  user: Profile;
  payments: Payment[];
};
