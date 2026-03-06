// ─── Generic Wrappers ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: "Receiver" | "Provider";
}

export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Returned by /login and /2fa/verify.
 * When requiresTwoFactor is true, only tempToken is set.
 * When login succeeds, token/role/fullName/userId are set.
 */
export interface AuthResponseDto {
  token?: string;
  role?: string;
  fullName?: string;
  userId?: number;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

// ─── 2FA ─────────────────────────────────────────────────────────────────────

export interface TwoFactorSetupResponseDto {
  secret: string;
  qrCodeUri: string;
}

export interface TwoFactorVerifyDto {
  tempToken: string;
  code: string;
  rememberDevice: boolean;
}

export interface TrustedDeviceDto {
  id: number;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface TwoFactorStatusDto {
  enabled: boolean;
  trustedDevices: TrustedDeviceDto[];
}

// ─── Category ────────────────────────────────────────────────────────────────

// Backend: record CategoryDto(Name, Description, IconUrl, ParentCategoryId, DisplayOrder)
export interface CategoryDto {
  name: string;
  description?: string;
  iconUrl?: string;
  parentCategoryId?: number;
  displayOrder?: number;
}

// Backend: record CategoryResponseDto(Id, Name, Description, Slug, IconUrl,
//           DisplayOrder, ParentCategoryId, ParentCategoryName, SubCategories)
export interface CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  slug: string;
  iconUrl?: string;
  displayOrder: number;
  parentCategoryId?: number;
  parentCategoryName?: string;
  subCategories?: CategoryResponseDto[];
}

// ─── Business ────────────────────────────────────────────────────────────────

// Backend: record BusinessDto(Name, Description, Address, City, Phone, Email, Website)
export interface BusinessDto {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Backend: record BusinessResponseDto(Id, Name, Description, Address, City, Phone,
//           Email, Website, LogoUrl, IsVerified, ProviderId, ProviderName)
// NOT: OwnerId/OwnerName → ProviderId/ProviderName olarak değiştirildi
export interface BusinessResponseDto {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isVerified: boolean;
  providerId: number;
  providerName?: string;
}

export interface BusinessQueryParams {
  city?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// ─── Provider ────────────────────────────────────────────────────────────────

// Backend: record ProviderDto(Title, Bio, AcceptsOnlineBooking)
// NOT: BusinessId kaldırıldı — işletmeler ayrıca POST /businesses ile oluşturulur
export interface ProviderDto {
  title: string;
  bio: string;
  acceptsOnlineBooking?: boolean;
}

// Backend: record BusinessSummaryDto(Id, Name, City)
export interface BusinessSummaryDto {
  id: number;
  name: string;
  city: string;
}

// Backend: record ProviderResponseDto(Id, UserId, UserFullName, Title, Bio,
//           ProfileImageUrl, AverageRating, TotalReviews, AcceptsOnlineBooking,
//           List<BusinessSummaryDto> Businesses)
// NOT: BusinessId/BusinessName → Businesses[] listesiyle değiştirildi
export interface ProviderResponseDto {
  id: number;
  userId: number;
  userFullName: string;
  title: string;
  bio?: string;
  profileImageUrl?: string;
  averageRating: number;
  totalReviews: number;
  acceptsOnlineBooking: boolean;
  businesses: BusinessSummaryDto[];
}

// Backend: record ProviderSearchDto(Keyword, CategoryId, City, MaxPrice, MinRating, Page, PageSize)
export interface ProviderQueryParams {
  keyword?: string;
  categoryId?: number;
  city?: string;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  pageSize?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

// Backend: record ServiceDto(Name, Description, Price, DurationMinutes, CategoryId, BusinessId)
export interface ServiceDto {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  categoryId: number;
  businessId: number;
}

// Backend: record ServiceResponseDto(Id, Name, Description, Price, DurationMinutes,
//           CategoryId, CategoryName, BusinessId, BusinessName, ProviderId, ProviderName)
// NOT: ProviderId ve ProviderName eklendi
export interface ServiceResponseDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  categoryId: number;
  categoryName?: string;
  businessId: number;
  businessName?: string;
  providerId: number;
  providerName?: string;
}

// NOT: providerId filtresi eklendi (provider'ın tüm işletmelerinden hizmetler)
export interface ServiceQueryParams {
  businessId?: number;
  categoryId?: number;
  providerId?: number;
  keyword?: string;
}

// ─── TimeSlot ────────────────────────────────────────────────────────────────

// Backend: record TimeSlotCreateDto(DateTime StartTime, DateTime EndTime)
export interface TimeSlotCreateDto {
  startTime: string; // ISO 8601
  endTime: string;
}

// Backend: record BulkTimeSlotCreateDto(DateTime Date, TimeSpan WorkStart, TimeSpan WorkEnd, int SlotMinutes)
export interface BulkTimeSlotCreateDto {
  date: string; // ISO 8601 date
  workStart: string; // "09:00:00"
  workEnd: string; // "18:00:00"
  slotMinutes: number;
}

// Backend: record TimeSlotResponseDto(Id, ProviderId, StartTime, EndTime, Status)
export interface TimeSlotResponseDto {
  id: number;
  providerId: number;
  startTime: string;
  endTime: string;
  status: "Available" | "Booked" | "Blocked" | "Expired";
}

// ─── Appointment ─────────────────────────────────────────────────────────────

// Backend: record AppointmentCreateDto(ProviderId, ServiceId, TimeSlotId, ReceiverNotes)
export interface AppointmentCreateDto {
  providerId: number;
  serviceId: number;
  timeSlotId: number;
  receiverNotes?: string;
}

// Backend: record AppointmentUpdateStatusDto(Action, Reason)
export interface AppointmentUpdateStatusDto {
  action: "confirm" | "reject" | "complete" | "noshow";
  reason?: string;
}

// Backend: record CancelDto(string? Reason)
export interface CancelDto {
  reason?: string;
}

// Backend: record AppointmentResponseDto(Id, ReceiverId, ReceiverName, ProviderId,
//           ProviderName, ServiceId, ServiceName, CategoryName, BusinessName,
//           StartTime, EndTime, PricePaid, Status, ReceiverNotes, ProviderNotes,
//           CancellationReason, HasReview, CreatedAt)
// NOT: BusinessName eklendi
export interface AppointmentResponseDto {
  id: number;
  receiverId: number;
  receiverName?: string;
  providerId: number;
  providerName?: string;
  serviceId: number;
  serviceName?: string;
  categoryName?: string;
  businessName?: string;
  startTime: string;
  endTime: string;
  pricePaid: number;
  status:
    | "Pending"
    | "Confirmed"
    | "Rejected"
    | "Completed"
    | "CancelledByReceiver"
    | "NoShow";
  receiverNotes?: string;
  providerNotes?: string;
  cancellationReason?: string;
  hasReview: boolean;
  createdAt: string;
}

// Backend: record AppointmentFilterDto(Status, From, To, Page, PageSize)
export interface AppointmentQueryParams {
  status?: string;
  from?: string; // ISO 8601 datetime
  to?: string;
  page?: number;
  pageSize?: number;
}

// ─── Review ──────────────────────────────────────────────────────────────────

// Backend: record ReviewCreateDto(AppointmentId, Rating, Comment)
export interface ReviewCreateDto {
  appointmentId: number;
  rating: number; // 1–5
  comment?: string;
}

// Backend: record ReviewReplyDto(Reply)
export interface ReviewReplyDto {
  reply: string;
}

// Backend: record ReviewResponseDto(Id, AuthorName, ProviderId, ProviderName,
//           AppointmentId, Rating, Comment, ProviderReply, CreatedAt)
export interface ReviewResponseDto {
  id: number;
  authorName: string;
  providerId: number;
  providerName?: string;
  appointmentId: number;
  rating: number;
  comment?: string;
  providerReply?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: "Info" | "Success" | "Warning" | "Error";
  isRead: boolean;
  appointmentId?: number;
  createdAt: string;
}
