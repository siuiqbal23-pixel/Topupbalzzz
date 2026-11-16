export type AppearanceMode = 'light' | 'dark' | 'system';

export type BrandInputType = 'id' | 'id+server';

export type PaymentStatusCode = 0 | 2 | -1 | -2; // 0: Pending, 2: Lunas, -1: Dibatalkan, -2: Kadaluarsa
export type TopupStatusCode = 0 | 1 | 2 | 3; // 0: Pending, 1: Dalam Proses, 2: Sukses, 3: Gagal

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  brandIds: string[];
  active: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  bonus?: string;
  description: string;
  sellPrice: number;
  originalPrice?: number;
  delay?: boolean;
  active: boolean;
}

export interface BrandItem {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  categorySlug: string;
  currencyUnit: string;
  inputType: BrandInputType;
  idLabel: string;
  idPlaceholder: string;
  serverLabel?: string;
  serverPlaceholder?: string;
  serverOptions?: string[];
  image: string;
  banner: string;
  description: string;
  rating: number;
  totalReviews: number;
  featured: boolean;
  active: boolean;
  products: ProductItem[];
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetBrandSlug?: string;
  image: string;
  active: boolean;
}

export interface VoucherItem {
  id: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  minPurchase: number;
  active: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  active: boolean;
}

export interface InfoPost {
  id: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  active: boolean;
}

export interface ManualPaymentAccount {
  id: string;
  name: string;
  type: 'bank' | 'qris' | 'ewallet' | 'whatsapp';
  channelCode: string;
  accountLabel: string;
  accountNumber: string;
  instructions: string;
  qrImageUrl?: string;
  requireProof?: boolean;
  notifyChannel?: 'whatsapp' | 'telegram';
  active: boolean;
}

export interface OrderItem {
  id: string;
  reference: string;
  createdAt: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  brandImage: string;
  productId: string;
  productName: string;
  accountId: string;
  serverId?: string;
  customerName: string;
  whatsapp: string;
  email?: string;
  paymentAccountId: string;
  paymentMethodName: string;
  paymentChannelCode: string;
  paymentAccountNumber: string;
  paymentAccountLabel: string;
  subtotal: number;
  discountAmount: number;
  voucherCode?: string;
  totalAmount: number;
  paymentStatus: PaymentStatusCode;
  topupStatus: TopupStatusCode;
  paymentProofUrl?: string;
  deliveryProofUrl?: string;
  notes?: string;
}

export interface PublicOrderSummary {
  id: string;
  createdAt: string;
  brandName: string;
  productName: string;
  paymentChannelCode: string;
  totalAmount: number;
  paymentStatus: PaymentStatusCode;
  topupStatus: TopupStatusCode;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  loggedIn: boolean;
  emailVerified?: boolean;
  role: 'customer' | 'admin';
}

export interface WhatsAppTemplates {
  orderCreated: string;
  orderCompleted: string;
  orderFailed: string;
  customerCheckout: string;
}

export interface StoreSettings {
  title: string;
  email: string;
  phone: string;
  whatsappCs: string;
  supportHours: string;
  footerDescription: string;
  promoBannerEnabled: boolean;
  promoBannerText: string;
  maintenanceActive: boolean;
  maintenanceTitle: string;
  maintenanceDescription: string;
  termsText: string;
  privacyPolicyText: string;
  adminPin: string;
  telegramChannelUrl?: string;
  telegramChannelName?: string;
}

export interface TopupBalzStoreState {
  categories: CategoryItem[];
  homeSections: HomeSection[];
  brands: BrandItem[];
  sliders: SliderItem[];
  vouchers: VoucherItem[];
  faqs: FaqItem[];
  infoPosts: InfoPost[];
  paymentAccounts: ManualPaymentAccount[];
  orders: OrderItem[];
  user: UserProfile;
  whatsappTemplates: WhatsAppTemplates;
  settings: StoreSettings;
}
