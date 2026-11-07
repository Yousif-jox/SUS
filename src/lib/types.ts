export type Role = 'admin' | 'donor' | 'beneficiary' | 'volunteer';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: AccountStatus;
  organization: string | null;
  address: string | null;
  city: string | null;
  household_size: number | null;
  verification_note: string | null;
  verified_at: string | null;
  created_at: string;
}

export type DonationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'matched'
  | 'completed'
  | 'expired';

export interface Donation {
  donation_id: string;
  donor_id: string;
  donor_name: string;
  food_name: string;
  category: string;
  description: string | null;
  quantity: number;
  unit: string;
  expiry_date: string;
  image_url: string | null;
  location: string;
  city: string;
  status: DonationStatus;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'matched'
  | 'fulfilled'
  | 'rejected'
  | 'cancelled';

export type Urgency = 'low' | 'normal' | 'high' | 'critical';

export interface AssistanceRequest {
  request_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  food_type: string;
  quantity: number;
  family_size: number;
  urgency: Urgency;
  city: string;
  notes: string | null;
  status: RequestStatus;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  match_id: string;
  donation_id: string;
  request_id: string;
  matched_quantity: number;
  score: number;
  note: string | null;
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Volunteer {
  volunteer_id: string;
  user_id: string;
  availability: 'available' | 'busy' | 'unavailable';
  area: string;
  vehicle: 'car' | 'motorbike' | 'bicycle' | 'on_foot';
  capacity: number;
  active: boolean;
  created_at: string;
}

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Delivery {
  delivery_id: string;
  match_id: string;
  volunteer_id: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
  status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  kind: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  review_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PlatformStats {
  total_donations: number;
  meals_distributed: number;
  families_helped: number;
  completed_deliveries: number;
  donor_count: number;
  beneficiary_count: number;
  volunteer_count: number;
  open_donations: number;
  active_requests: number;
}

export interface TrendPoint {
  period: string;
  donations: number;
  meals: number;
}

export interface CategoryPoint {
  category: string;
  donations: number;
  meals: number;
}

export interface UrgencyPoint {
  urgency: string;
  requests: number;
}

export const FOOD_CATEGORIES = [
  { value: 'produce', label: 'Fresh Produce', image: '/assets/images/produce-crate.jpg' },
  { value: 'bakery', label: 'Bakery', image: '/assets/images/bakery-bread.jpg' },
  { value: 'prepared', label: 'Prepared Meals', image: '/assets/images/prepared-meals.jpg' },
  { value: 'dairy', label: 'Dairy & Eggs', image: '/assets/images/dairy-eggs.jpg' },
  { value: 'pantry', label: 'Pantry Staples', image: '/assets/images/pantry-goods.jpg' },
  { value: 'beverages', label: 'Beverages', image: '/assets/images/produce-crate.jpg' },
] as const;

export const CITIES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Dakahlia',
  'Red Sea',
  'Beheira',
  'Fayoum',
  'Gharbia',
  'Ismailia',
  'Menofia',
  'Minya',
  'Qalyubia',
  'New Valley',
  'Suez',
  'Aswan',
  'Assiut',
  'Beni Suef',
  'Port Said',
  'Damietta',
  'Sharqia',
  'South Sinai',
  'Kafr El Sheikh',
  'Matrouh',
  'Luxor',
  'Qena',
  'North Sinai',
  'Sohag',
];

const CITY_AR: Record<string, string> = {
  Cairo: 'القاهرة',
  Giza: 'الجيزة',
  Alexandria: 'الإسكندرية',
  Dakahlia: 'الدقهلية',
  'Red Sea': 'البحر الأحمر',
  Beheira: 'البحيرة',
  Fayoum: 'الفيوم',
  Gharbia: 'الغربية',
  Ismailia: 'الإسماعيلية',
  Menofia: 'المنوفية',
  Minya: 'المنيا',
  Qalyubia: 'القليوبية',
  'New Valley': 'الوادي الجديد',
  Suez: 'السويس',
  Aswan: 'أسوان',
  Assiut: 'أسيوط',
  'Beni Suef': 'بني سويف',
  'Port Said': 'بورسعيد',
  Damietta: 'دمياط',
  Sharqia: 'الشرقية',
  'South Sinai': 'جنوب سيناء',
  'Kafr El Sheikh': 'كفر الشيخ',
  Matrouh: 'مطروح',
  Luxor: 'الأقصر',
  Qena: 'قنا',
  'North Sinai': 'شمال سيناء',
  Sohag: 'سوهاج',
};

/** Governorate name in the active interface language. */
export function regionLabel(name?: string | null): string {
  if (!name) return '';
  if (contentLang === 'ar') return CITY_AR[name] ?? name;
  return name;
}
const CATEGORY_AR: Record<string, string> = {
  produce: 'خضروات وفواكه طازجة',
  bakery: 'مخبوزات',
  prepared: 'وجبات جاهزة',
  dairy: 'ألبان وبيض',
  pantry: 'مواد أساسية',
  beverages: 'مشروبات',
};

let contentLang: 'en' | 'ar' = 'en';

/** Kept in sync with LanguageProvider so data labels follow the UI language. */
export function setContentLang(lang: 'en' | 'ar') {
  contentLang = lang;
}

export function categoryLabel(value: string): string {
  if (contentLang === 'ar') {
    return CATEGORY_AR[value] ?? 'أصناف متنوعة';
  }
  return FOOD_CATEGORIES.find((c) => c.value === value)?.label ?? 'Mixed items';
}

export function categoryImage(value: string, image?: string | null): string {
  if (image) return image;
  return (
    FOOD_CATEGORIES.find((c) => c.value === value)?.image ??
    '/assets/images/placeholder.svg'
  );
}
