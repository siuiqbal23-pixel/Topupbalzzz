export type GameCategory = 'Battle Royale' | 'MOBA' | 'Sukan' | 'RPG';

export interface TopupPackage {
  id: string;
  label: string;
  bonus?: string;
  priceMyr: number;
  originalPriceMyr?: number;
  active: boolean;
}

export interface GameItem {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  category: GameCategory;
  currencyUnit: string;
  needsServerId: boolean;
  idPlaceholder: string;
  serverPlaceholder?: string;
  image: string;
  active: boolean;
  featured: boolean;
  packages: TopupPackage[];
}

export type OrderStatus =
  | 'Menunggu Bayaran'
  | 'Sedang Diproses'
  | 'Selesai'
  | 'Dibatalkan';

export interface OrderRecord {
  id: string;
  createdAt: string;
  customerName: string;
  whatsapp: string;
  gameId: string;
  gameName: string;
  userGameId: string;
  serverId?: string;
  packageId: string;
  packageLabel: string;
  amountMyr: number;
  paymentMethod: string;
  status: OrderStatus;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  accountLabel: string;
  accountNumber: string;
  instructions: string;
  active: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  favoriteGame: string;
  totalOrders: number;
  totalSpendMyr: number;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  supportHours: string;
  bannerEnabled: boolean;
  bannerText: string;
  modalEnabled: boolean;
  modalTitle: string;
  modalDescription: string;
  modalCtaLabel: string;
  adminPin: string;
}

export interface TopupBalzStoreState {
  games: GameItem[];
  orders: OrderRecord[];
  paymentMethods: PaymentMethod[];
  leaderboardBonusEntries: LeaderboardEntry[];
  settings: StoreSettings;
}
