import heroBannerImg from '../assets/images/topupbalz_hero_banner_1794750336831.jpg';
import freeFireImg from '../assets/images/game_free_fire_1794750338333.jpg';
import mobileLegendsImg from '../assets/images/game_mobile_legends_1794750338040.jpg';
import pubgMobileImg from '../assets/images/game_pubg_mobile_1794750339157.jpg';
import fcMobileImg from '../assets/images/game_fc_mobile_1794750339475.jpg';
import type { TopupBalzStoreState } from '../types/store';

export const HERO_BANNER_IMAGE = heroBannerImg;

const STORAGE_KEY = 'topupbalz_store_v1';

export const INITIAL_STORE_STATE: TopupBalzStoreState = {
  games: [
    {
      id: 'game-ff',
      slug: 'free-fire',
      name: 'Free Fire',
      publisher: 'Garena',
      category: 'Battle Royale',
      currencyUnit: 'Diamonds',
      needsServerId: false,
      idPlaceholder: 'Contoh: 2145987610',
      image: freeFireImg,
      active: true,
      featured: true,
      packages: [
        { id: 'ff-100', label: '100 Diamonds', bonus: '+10 Bonus', priceMyr: 4.5, originalPriceMyr: 5.0, active: true },
        { id: 'ff-310', label: '310 Diamonds', bonus: '+31 Bonus', priceMyr: 13.5, originalPriceMyr: 15.0, active: true },
        { id: 'ff-520', label: '520 Diamonds', bonus: '+52 Bonus', priceMyr: 22.0, originalPriceMyr: 25.0, active: true },
        { id: 'ff-1060', label: '1,060 Diamonds', bonus: '+106 Bonus', priceMyr: 43.0, originalPriceMyr: 49.0, active: true },
        { id: 'ff-2180', label: '2,180 Diamonds', bonus: '+218 Bonus', priceMyr: 85.0, originalPriceMyr: 98.0, active: true },
        { id: 'ff-wk', label: 'Membership Mingguan', priceMyr: 7.9, originalPriceMyr: 8.9, active: true },
      ],
    },
    {
      id: 'game-mlbb',
      slug: 'mobile-legends',
      name: 'Mobile Legends',
      publisher: 'Moonton',
      category: 'MOBA',
      currencyUnit: 'Diamonds',
      needsServerId: true,
      idPlaceholder: 'Contoh: 184920311',
      serverPlaceholder: 'Contoh: 2948',
      image: mobileLegendsImg,
      active: true,
      featured: true,
      packages: [
        { id: 'ml-wdp', label: 'Weekly Diamond Pass', bonus: '220 Diamonds Nilai', priceMyr: 8.5, originalPriceMyr: 9.9, active: true },
        { id: 'ml-86', label: '86 Diamonds', bonus: '78 + 8 Bonus', priceMyr: 6.8, originalPriceMyr: 7.5, active: true },
        { id: 'ml-172', label: '172 Diamonds', bonus: '156 + 16 Bonus', priceMyr: 13.5, originalPriceMyr: 15.0, active: true },
        { id: 'ml-257', label: '257 Diamonds', bonus: '234 + 23 Bonus', priceMyr: 19.9, originalPriceMyr: 22.0, active: true },
        { id: 'ml-429', label: '429 Diamonds', bonus: '390 + 39 Bonus', priceMyr: 33.5, originalPriceMyr: 37.0, active: true },
        { id: 'ml-706', label: '706 Diamonds', bonus: '642 + 64 Bonus', priceMyr: 54.0, originalPriceMyr: 59.0, active: true },
      ],
    },
    {
      id: 'game-pubg',
      slug: 'pubg-mobile',
      name: 'PUBG Mobile',
      publisher: 'Tencent / Krafton',
      category: 'Battle Royale',
      currencyUnit: 'UC',
      needsServerId: false,
      idPlaceholder: 'Contoh: 5148290312',
      image: pubgMobileImg,
      active: true,
      featured: true,
      packages: [
        { id: 'pubg-60', label: '60 UC', priceMyr: 4.4, originalPriceMyr: 4.9, active: true },
        { id: 'pubg-325', label: '325 UC', bonus: '300 + 25 Bonus', priceMyr: 21.5, originalPriceMyr: 24.0, active: true },
        { id: 'pubg-660', label: '660 UC', bonus: '600 + 60 Bonus', priceMyr: 42.9, originalPriceMyr: 47.0, active: true },
        { id: 'pubg-1800', label: '1,800 UC', bonus: '1500 + 300 Bonus', priceMyr: 108.0, originalPriceMyr: 119.0, active: true },
        { id: 'pubg-3850', label: '3,850 UC', bonus: '3000 + 850 Bonus', priceMyr: 215.0, originalPriceMyr: 239.0, active: true },
      ],
    },
    {
      id: 'game-fc',
      slug: 'fc-mobile',
      name: 'FC Mobile',
      publisher: 'EA Sports',
      category: 'Sukan',
      currencyUnit: 'FC Points',
      needsServerId: false,
      idPlaceholder: 'Contoh: UID EA 99018273',
      image: fcMobileImg,
      active: true,
      featured: true,
      packages: [
        { id: 'fc-100', label: '100 FC Points', priceMyr: 4.5, originalPriceMyr: 5.0, active: true },
        { id: 'fc-520', label: '520 FC Points', bonus: '+20 Bonus', priceMyr: 21.9, originalPriceMyr: 24.5, active: true },
        { id: 'fc-1070', label: '1,070 FC Points', bonus: '+70 Bonus', priceMyr: 43.9, originalPriceMyr: 48.0, active: true },
        { id: 'fc-2200', label: '2,200 FC Points', bonus: '+200 Bonus', priceMyr: 87.9, originalPriceMyr: 95.0, active: true },
        { id: 'fc-5750', label: '5,750 FC Points', bonus: '+750 Bonus', priceMyr: 219.0, originalPriceMyr: 239.0, active: true },
      ],
    },
  ],
  orders: [
    {
      id: 'TBZ-261115-0418',
      createdAt: '2026-11-15T13:20:00+08:00',
      customerName: 'Amirul Hakim',
      whatsapp: '601123458812',
      gameId: 'game-mlbb',
      gameName: 'Mobile Legends',
      userGameId: '492018432',
      serverId: '2918',
      packageId: 'ml-429',
      packageLabel: '429 Diamonds',
      amountMyr: 33.5,
      paymentMethod: 'DuitNow QR',
      status: 'Sedang Diproses',
      notes: 'Resit DuitNow telah disahkan pembeli',
    },
    {
      id: 'TBZ-261115-0417',
      createdAt: '2026-11-15T12:48:00+08:00',
      customerName: 'Zulfikar Nizam',
      whatsapp: '60198821044',
      gameId: 'game-ff',
      gameName: 'Free Fire',
      userGameId: '2145099812',
      packageId: 'ff-1060',
      packageLabel: '1,060 Diamonds',
      amountMyr: 43.0,
      paymentMethod: 'Touch \'n Go eWallet',
      status: 'Menunggu Bayaran',
    },
    {
      id: 'TBZ-261115-0416',
      createdAt: '2026-11-15T11:15:00+08:00',
      customerName: 'Syafiq Danial',
      whatsapp: '60137749201',
      gameId: 'game-pubg',
      gameName: 'PUBG Mobile',
      userGameId: '5190823411',
      packageId: 'pubg-1800',
      packageLabel: '1,800 UC',
      amountMyr: 108.0,
      paymentMethod: 'FPX Online Banking',
      status: 'Selesai',
    },
    {
      id: 'TBZ-261114-0415',
      createdAt: '2026-11-14T21:40:00+08:00',
      customerName: 'Haziq Irfan',
      whatsapp: '60176651029',
      gameId: 'game-fc',
      gameName: 'FC Mobile',
      userGameId: '882019442',
      packageId: 'fc-2200',
      packageLabel: '2,200 FC Points',
      amountMyr: 87.9,
      paymentMethod: 'DuitNow QR',
      status: 'Selesai',
    },
    {
      id: 'TBZ-261114-0414',
      createdAt: '2026-11-14T18:05:00+08:00',
      customerName: 'Nadia Safiya',
      whatsapp: '60142290184',
      gameId: 'game-mlbb',
      gameName: 'Mobile Legends',
      userGameId: '301948271',
      serverId: '2401',
      packageId: 'ml-706',
      packageLabel: '706 Diamonds',
      amountMyr: 54.0,
      paymentMethod: 'ShopeePay',
      status: 'Selesai',
    },
    {
      id: 'TBZ-261113-0413',
      createdAt: '2026-11-13T16:30:00+08:00',
      customerName: 'Farhan Azmi',
      whatsapp: '60129910482',
      gameId: 'game-ff',
      gameName: 'Free Fire',
      userGameId: '1984710294',
      packageId: 'ff-2180',
      packageLabel: '2,180 Diamonds',
      amountMyr: 85.0,
      paymentMethod: 'DuitNow QR',
      status: 'Selesai',
    },
    {
      id: 'TBZ-261112-0412',
      createdAt: '2026-11-12T20:10:00+08:00',
      customerName: 'Aiman Hakimi',
      whatsapp: '60187712094',
      gameId: 'game-pubg',
      gameName: 'PUBG Mobile',
      userGameId: '5182930144',
      packageId: 'pubg-3850',
      packageLabel: '3,850 UC',
      amountMyr: 215.0,
      paymentMethod: 'FPX Online Banking',
      status: 'Selesai',
    },
  ],
  paymentMethods: [
    {
      id: 'pay-duitnow',
      name: 'DuitNow QR',
      accountLabel: 'TopupBalz Enterprise',
      accountNumber: 'DNQR-8801-9240',
      instructions: 'Imbas kod QR DuitNow atau pindahkan jumlah tepat dan hantar resit ke WhatsApp admin.',
      active: true,
    },
    {
      id: 'pay-tng',
      name: 'Touch \'n Go eWallet',
      accountLabel: 'TopupBalz Official',
      accountNumber: '011-2345-6789',
      instructions: 'Pindah melalui Transfer eWallet TNG dan sertakan ID Pesanan pada nota rujukan.',
      active: true,
    },
    {
      id: 'pay-fpx',
      name: 'FPX Online Banking',
      accountLabel: 'Maybank · TopupBalz',
      accountNumber: '5621-0689-4412',
      instructions: 'Masukkan nombor ID Pesanan sebagai rujukan pemindahan segera (Instant Transfer).',
      active: true,
    },
    {
      id: 'pay-shopee',
      name: 'ShopeePay',
      accountLabel: 'TopupBalz MY',
      accountNumber: '011-2345-6789',
      instructions: 'Selesaikan bayaran ShopeePay dan sahkan pesanan melalui pautan WhatsApp.',
      active: true,
    },
  ],
  leaderboardBonusEntries: [
    {
      id: 'lb-1',
      playerName: 'Aiman Hakimi',
      favoriteGame: 'PUBG Mobile',
      totalOrders: 14,
      totalSpendMyr: 684.0,
    },
    {
      id: 'lb-2',
      playerName: 'Syafiq Danial',
      favoriteGame: 'PUBG Mobile',
      totalOrders: 11,
      totalSpendMyr: 492.5,
    },
    {
      id: 'lb-3',
      playerName: 'Farhan Azmi',
      favoriteGame: 'Free Fire',
      totalOrders: 9,
      totalSpendMyr: 365.0,
    },
    {
      id: 'lb-4',
      playerName: 'Haziq Irfan',
      favoriteGame: 'FC Mobile',
      totalOrders: 7,
      totalSpendMyr: 289.9,
    },
    {
      id: 'lb-5',
      playerName: 'Nadia Safiya',
      favoriteGame: 'Mobile Legends',
      totalOrders: 6,
      totalSpendMyr: 214.0,
    },
  ],
  settings: {
    storeName: 'TopupBalz',
    whatsappNumber: '601123456789',
    supportHours: 'Setiap Hari · 09:00 – 01:00 MYT',
    bannerEnabled: true,
    bannerText: 'Promosi Web Baharu TopupBalz: Diskaun sehingga 12% untuk Weekly Pass MLBB & Diamonds Free Fire.',
    modalEnabled: true,
    modalTitle: 'Web Baharu TopupBalz Sudah Hadir!',
    modalDescription:
      'Jom topup di TopupBalz sempena wajah web baharu — nikmati harga promosi pantas untuk Free Fire, Mobile Legends, PUBG Mobile dan FC Mobile.',
    modalCtaLabel: 'Beli sekarang',
    adminPin: '',
  },
};

export function loadStoreState(): TopupBalzStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STORE_STATE;
    const parsed = JSON.parse(raw) as Partial<TopupBalzStoreState>;
    return {
      games: Array.isArray(parsed.games) && parsed.games.length > 0 ? parsed.games : INITIAL_STORE_STATE.games,
      orders: Array.isArray(parsed.orders) ? parsed.orders : INITIAL_STORE_STATE.orders,
      paymentMethods:
        Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0
          ? parsed.paymentMethods
          : INITIAL_STORE_STATE.paymentMethods,
      leaderboardBonusEntries: Array.isArray(parsed.leaderboardBonusEntries)
        ? parsed.leaderboardBonusEntries
        : INITIAL_STORE_STATE.leaderboardBonusEntries,
      settings: {
        ...INITIAL_STORE_STATE.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return INITIAL_STORE_STATE;
  }
}

export function saveStoreState(state: TopupBalzStoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetStoreState(): TopupBalzStoreState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return INITIAL_STORE_STATE;
}

export function formatMyr(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}
