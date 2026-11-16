import heroBannerImg from '../assets/images/topupbalz_hero_banner_1794750336831.jpg';
import sliderPromoImg from '../assets/images/slider_promo_tournament_1794757681388.jpg';
import sliderRewardsImg from '../assets/images/slider_vip_rewards_1794757682403.jpg';
import freeFireImg from '../assets/images/game_free_fire_1794750338333.jpg';
import mobileLegendsImg from '../assets/images/game_mobile_legends_1794750338040.jpg';
import pubgMobileImg from '../assets/images/game_pubg_mobile_1794750339157.jpg';
import fcMobileImg from '../assets/images/game_fc_mobile_1794750339475.jpg';
import valorantImg from '../assets/images/game_valorant_cover_1794757682317.jpg';
import genshinImg from '../assets/images/game_genshin_cover_1794757682900.jpg';
import type { OrderItem, TopupBalzStoreState } from '../types/store';

const STORAGE_KEY = 'topupbalz_webtopup_v1';

export const INITIAL_STORE_STATE: TopupBalzStoreState = {
  categories: [],
  homeSections: [
    {
      id: 'sec-unggulan',
      title: 'Produk Unggulan',
      subtitle: 'Pilihan game paling laris minggu ini',
      brandIds: ['brand-mlbb', 'brand-ff', 'brand-pubg'],
      active: true,
    },
    {
      id: 'sec-populer',
      title: 'Semua Game Populer',
      subtitle: 'Pilih game kegemaran anda untuk topup segera',
      brandIds: [
        'brand-mlbb',
        'brand-ff',
        'brand-pubg',
        'brand-fc',
        'brand-valorant',
        'brand-genshin',
      ],
      active: true,
    },
  ],
  brands: [
    {
      id: 'brand-mlbb',
      slug: 'mobile-legends',
      name: 'Mobile Legends',
      publisher: 'Moonton',
      categorySlug: 'moba',
      currencyUnit: 'Diamonds',
      inputType: 'id+server',
      idLabel: 'User ID',
      idPlaceholder: 'Contoh: 184920311',
      serverLabel: 'Zone ID',
      serverPlaceholder: 'Contoh: 2948',
      image: mobileLegendsImg,
      banner: sliderPromoImg,
      description:
        'Topup Diamonds & Weekly Diamond Pass Mobile Legends secara sah dan pantas. Hanya perlukan User ID dan Zone ID tanpa kata laluan. Bayar manual dan sahkan terus melalui WhatsApp.',
      rating: 4.99,
      totalReviews: 10521,
      featured: true,
      active: true,
      products: [
        {
          id: 'ml-wdp',
          name: 'Weekly Diamond Pass',
          bonus: 'Nilai 220 Diamonds',
          description: 'Kredit terus ke akaun dalam 1-5 minit selepas sah bayaran.',
          sellPrice: 8.5,
          originalPrice: 9.9,
          active: true,
        },
        {
          id: 'ml-86',
          name: '86 Diamonds',
          bonus: '78 + 8 Bonus',
          description: 'Proses manual pantas terus ke User ID.',
          sellPrice: 6.8,
          originalPrice: 7.5,
          active: true,
        },
        {
          id: 'ml-172',
          name: '172 Diamonds',
          bonus: '156 + 16 Bonus',
          description: 'Sesuai untuk skin & event mingguan.',
          sellPrice: 13.5,
          originalPrice: 15.0,
          active: true,
        },
        {
          id: 'ml-257',
          name: '257 Diamonds',
          bonus: '234 + 23 Bonus',
          description: 'Penghantaran segera oleh admin bertugas.',
          sellPrice: 19.9,
          originalPrice: 22.0,
          active: true,
        },
        {
          id: 'ml-429',
          name: '429 Diamonds',
          bonus: '390 + 39 Bonus',
          description: 'Pilihan paling laris untuk Starlight & Collector.',
          sellPrice: 33.5,
          originalPrice: 37.0,
          active: true,
        },
        {
          id: 'ml-706',
          name: '706 Diamonds',
          bonus: '642 + 64 Bonus',
          description: 'Pakej nilai tinggi dengan diskaun web baharu.',
          sellPrice: 54.0,
          originalPrice: 59.0,
          active: true,
        },
      ],
    },
    {
      id: 'brand-ff',
      slug: 'free-fire',
      name: 'Free Fire',
      publisher: 'Garena',
      categorySlug: 'battle-royale',
      currencyUnit: 'Diamonds',
      inputType: 'id',
      idLabel: 'Player ID',
      idPlaceholder: 'Contoh: 2145987610',
      image: freeFireImg,
      banner: heroBannerImg,
      description:
        'Tambah nilai Diamonds dan Membership Free Fire menggunakan Player ID sahaja. Pengesahan pantas melalui WhatsApp tanpa risiko akaun.',
      rating: 4.98,
      totalReviews: 8430,
      featured: true,
      active: true,
      products: [
        {
          id: 'ff-100',
          name: '100 Diamonds',
          bonus: '+10 Bonus',
          description: 'Masuk segera selepas resit disahkan.',
          sellPrice: 4.5,
          originalPrice: 5.0,
          active: true,
        },
        {
          id: 'ff-310',
          name: '310 Diamonds',
          bonus: '+31 Bonus',
          description: 'Sesuai untuk Booyah Pass & Elite Bundle.',
          sellPrice: 13.5,
          originalPrice: 15.0,
          active: true,
        },
        {
          id: 'ff-520',
          name: '520 Diamonds',
          bonus: '+52 Bonus',
          description: 'Penghantaran pantas dalam 1-5 minit.',
          sellPrice: 22.0,
          originalPrice: 25.0,
          active: true,
        },
        {
          id: 'ff-1060',
          name: '1,060 Diamonds',
          bonus: '+106 Bonus',
          description: 'Stok sentiasa tersedia setiap hari.',
          sellPrice: 43.0,
          originalPrice: 49.0,
          active: true,
        },
        {
          id: 'ff-2180',
          name: '2,180 Diamonds',
          bonus: '+218 Bonus',
          description: 'Harga jimat untuk event Evo Gun.',
          sellPrice: 85.0,
          originalPrice: 98.0,
          active: true,
        },
        {
          id: 'ff-wk',
          name: 'Membership Mingguan',
          description: 'Aktifkan pas mingguan terus ke ID.',
          sellPrice: 7.9,
          originalPrice: 8.9,
          active: true,
        },
      ],
    },
    {
      id: 'brand-pubg',
      slug: 'pubg-mobile',
      name: 'PUBG Mobile',
      publisher: 'Tencent / Krafton',
      categorySlug: 'battle-royale',
      currencyUnit: 'UC',
      inputType: 'id',
      idLabel: 'Character ID',
      idPlaceholder: 'Contoh: 5148290312',
      image: pubgMobileImg,
      banner: sliderPromoImg,
      description:
        'Topup UC PUBG Mobile Global dengan harga kompetitif. Masukkan Character ID dan hantar resit bayaran manual terus ke WhatsApp kami.',
      rating: 4.97,
      totalReviews: 6190,
      featured: true,
      active: true,
      products: [
        {
          id: 'pubg-60',
          name: '60 UC',
          description: 'Kredit UC rasmi terus ke Character ID.',
          sellPrice: 4.4,
          originalPrice: 4.9,
          active: true,
        },
        {
          id: 'pubg-325',
          name: '325 UC',
          bonus: '300 + 25 Bonus',
          description: 'Cukup untuk Royale Pass Upgrade.',
          sellPrice: 21.5,
          originalPrice: 24.0,
          active: true,
        },
        {
          id: 'pubg-660',
          name: '660 UC',
          bonus: '600 + 60 Bonus',
          description: 'Elite Royale Pass & crate.',
          sellPrice: 42.9,
          originalPrice: 47.0,
          active: true,
        },
        {
          id: 'pubg-1800',
          name: '1,800 UC',
          bonus: '1500 + 300 Bonus',
          description: 'Penghantaran keutamaan oleh admin.',
          sellPrice: 108.0,
          originalPrice: 119.0,
          active: true,
        },
        {
          id: 'pubg-3850',
          name: '3,850 UC',
          bonus: '3000 + 850 Bonus',
          description: 'Pakej UC besar nilai terbaik.',
          sellPrice: 215.0,
          originalPrice: 239.0,
          active: true,
        },
      ],
    },
    {
      id: 'brand-fc',
      slug: 'fc-mobile',
      name: 'FC Mobile',
      publisher: 'EA Sports',
      categorySlug: 'sukan',
      currencyUnit: 'FC Points',
      inputType: 'id',
      idLabel: 'UID EA',
      idPlaceholder: 'Contoh: 99018273',
      image: fcMobileImg,
      banner: sliderRewardsImg,
      description:
        'Beli FC Points & Silver Packs untuk EA Sports FC Mobile dengan mudah. Sokongan bayaran manual DuitNow, TNG, dan Bank Transfer.',
      rating: 4.96,
      totalReviews: 2840,
      featured: true,
      active: true,
      products: [
        {
          id: 'fc-100',
          name: '100 FC Points',
          description: 'Penghantaran pantas dalam 5 minit.',
          sellPrice: 4.5,
          originalPrice: 5.0,
          active: true,
        },
        {
          id: 'fc-520',
          name: '520 FC Points',
          bonus: '+20 Bonus',
          description: 'Sesuai untuk Star Pass & pek acara.',
          sellPrice: 21.9,
          originalPrice: 24.5,
          active: true,
        },
        {
          id: 'fc-1070',
          name: '1,070 FC Points',
          bonus: '+70 Bonus',
          description: 'Kredit sah terus ke akaun FC Mobile.',
          sellPrice: 43.9,
          originalPrice: 48.0,
          active: true,
        },
        {
          id: 'fc-2200',
          name: '2,200 FC Points',
          bonus: '+200 Bonus',
          description: 'Pek nilai tinggi tanpa caj tersembunyi.',
          sellPrice: 87.9,
          originalPrice: 95.0,
          active: true,
        },
      ],
    },
    {
      id: 'brand-valorant',
      slug: 'valorant',
      name: 'Valorant',
      publisher: 'Riot Games',
      categorySlug: 'tactical-fps',
      currencyUnit: 'VP',
      inputType: 'id',
      idLabel: 'Riot ID (Nama#Tag)',
      idPlaceholder: 'Contoh: BalzPro#MY1',
      image: valorantImg,
      banner: sliderPromoImg,
      description:
        'Topup Valorant Points (VP) server MY/SG dengan pantas. Masukkan Riot ID berserta #Tag anda dan sahkan pesanan melalui WhatsApp.',
      rating: 4.99,
      totalReviews: 4120,
      featured: true,
      active: true,
      products: [
        {
          id: 'vp-475',
          name: '475 VP',
          description: 'Kredit VP terus ke Riot ID MY/SG.',
          sellPrice: 19.9,
          originalPrice: 21.5,
          active: true,
        },
        {
          id: 'vp-1000',
          name: '1,000 VP',
          description: 'Cukup untuk Battle Pass Valorant.',
          sellPrice: 39.5,
          originalPrice: 42.0,
          active: true,
        },
        {
          id: 'vp-2050',
          name: '2,050 VP',
          description: 'Sesuai untuk skin senjata premium.',
          sellPrice: 79.0,
          originalPrice: 85.0,
          active: true,
        },
        {
          id: 'vp-3650',
          name: '3,650 VP',
          description: 'Penghantaran manual pantas oleh admin.',
          sellPrice: 138.0,
          originalPrice: 149.0,
          active: true,
        },
      ],
    },
    {
      id: 'brand-genshin',
      slug: 'genshin-impact',
      name: 'Genshin Impact',
      publisher: 'HoYoverse',
      categorySlug: 'action-rpg',
      currencyUnit: 'Genesis Crystals',
      inputType: 'id+server',
      idLabel: 'UID Genshin',
      idPlaceholder: 'Contoh: 812345678',
      serverLabel: 'Server',
      serverOptions: ['Asia', 'America', 'Europe', 'TW, HK, MO'],
      image: genshinImg,
      banner: sliderRewardsImg,
      description:
        'Topup Blessing of the Welkin Moon dan Genesis Crystals Genshin Impact. Pilih server Asia/Global dengan harga telus.',
      rating: 4.98,
      totalReviews: 3560,
      featured: true,
      active: true,
      products: [
        {
          id: 'gi-welkin',
          name: 'Blessing of the Welkin Moon',
          bonus: '300 Crystals + 2,700 Primogems',
          description: 'Aktifkan 30 hari Welkin Moon.',
          sellPrice: 19.5,
          originalPrice: 22.0,
          active: true,
        },
        {
          id: 'gi-330',
          name: '300 + 30 Genesis Crystals',
          description: 'Bonus kali pertama mengikut akaun.',
          sellPrice: 19.9,
          originalPrice: 22.0,
          active: true,
        },
        {
          id: 'gi-1090',
          name: '980 + 110 Genesis Crystals',
          description: 'Proses pantas dan selamat.',
          sellPrice: 59.0,
          originalPrice: 65.0,
          active: true,
        },
        {
          id: 'gi-2240',
          name: '1,980 + 260 Genesis Crystals',
          description: 'Nilai terbaik untuk banner watak baharu.',
          sellPrice: 119.0,
          originalPrice: 129.0,
          active: true,
        },
      ],
    },
  ],
  sliders: [
    {
      id: 'slide-1',
      title: 'Web Baharu TopupBalz Sudah Hadir',
      subtitle:
        'Topup Mobile Legends, Free Fire & PUBG Mobile dengan bayaran manual terus melalui WhatsApp.',
      ctaLabel: 'Topup Sekarang',
      targetBrandSlug: 'mobile-legends',
      image: heroBannerImg,
      active: true,
    },
    {
      id: 'slide-2',
      title: 'Promosi Mingguan Diamond Pass & UC',
      subtitle:
        'Gunakan kod voucher TOPUPBALZ atau PROMO10 untuk potongan harga segera di halaman checkout.',
      ctaLabel: 'Lihat Free Fire',
      targetBrandSlug: 'free-fire',
      image: sliderPromoImg,
      active: true,
    },
    {
      id: 'slide-3',
      title: 'Sokongan WhatsApp Terus Setiap Hari',
      subtitle:
        'Hantar bukti bayaran manual atau semak status pesanan anda melalui tab Profil.',
      ctaLabel: 'Topup Valorant',
      targetBrandSlug: 'valorant',
      image: sliderRewardsImg,
      active: true,
    },
  ],
  vouchers: [
    {
      id: 'v-1',
      code: 'TOPUPBALZ',
      type: 'fixed',
      value: 2.0,
      minPurchase: 15.0,
      active: true,
    },
    {
      id: 'v-2',
      code: 'PROMO10',
      type: 'percent',
      value: 10,
      minPurchase: 20.0,
      active: true,
    },
    {
      id: 'v-3',
      code: 'NEWWEB',
      type: 'fixed',
      value: 1.5,
      minPurchase: 10.0,
      active: true,
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'Bagaimana cara membuat bayaran manual melalui WhatsApp?',
      answer:
        'Log masuk ke akaun anda, pilih game dan pakej yang diinginkan, lengkapkan ID Pemain serta nombor WhatsApp anda, kemudian klik Beli Sekarang. Pada halaman invois, tekan butang Hantar Bukti ke WhatsApp untuk pengesahan pantas.',
      active: true,
    },
    {
      id: 'faq-2',
      question: 'Di mana saya boleh semak kod ID pembelian saya?',
      answer:
        'Demi privasi pelanggan, kod ID pembelian tidak dipaparkan pada tab Transaksi umum. Anda boleh melihat semua kod ID pembelian anda di tab Profil -> Sejarah Transaksi.',
      active: true,
    },
    {
      id: 'faq-3',
      question: 'Berapa lama masa diambil untuk Diamonds/UC masuk ke akaun?',
      answer:
        'Kebanyakan pesanan diproses dalam tempoh 1 hingga 5 minit selepas bukti pembayaran disahkan oleh admin bertugas melalui WhatsApp.',
      active: true,
    },
  ],
  infoPosts: [
    {
      id: 'info-1',
      title: 'Panduan Lengkap Topup & Bayaran Manual WhatsApp',
      content:
        '1. Pastikan anda telah log masuk melalui tab Profil sebelum membuat pembelian.\n2. Pilih game pilihan anda, masukkan User ID / Server ID dengan tepat.\n3. Selepas mencipta pesanan, klik butang WhatsApp di halaman invois untuk menghantar resit bayaran terus kepada admin bertugas.',
      image: heroBannerImg,
      createdAt: '2026-11-15T09:00:00+08:00',
      active: true,
    },
    {
      id: 'info-2',
      title: 'Promosi Kod Voucher Web Baharu TopupBalz',
      content:
        'Nikmati diskaun tambahan dengan memasukkan kod voucher TOPUPBALZ (potongan RM 2.00) atau PROMO10 (diskaun 10%) di halaman checkout sebelum membuat bayaran.',
      image: sliderPromoImg,
      createdAt: '2026-11-14T18:00:00+08:00',
      active: true,
    },
  ],
  paymentAccounts: [
    {
      id: 'pay-whatsapp',
      name: 'Bayaran Manual via WhatsApp Admin',
      type: 'whatsapp',
      channelCode: 'WHATSAPP',
      accountLabel: 'TopupBalz Admin',
      accountNumber: '011-2345-6789',
      instructions:
        'Selepas klik Beli Sekarang, tekan butang WhatsApp di halaman invois untuk menerima pautan QR / nombor akaun terkini dan hantar resit bayaran terus kepada admin.',
      notifyChannel: 'whatsapp',
      active: true,
    },
    {
      id: 'pay-duitnow',
      name: 'DuitNow QR / Instant Transfer',
      type: 'qris',
      channelCode: 'DUITNOW',
      accountLabel: 'TopupBalz Enterprise',
      accountNumber: 'DNQR-8801-9240',
      instructions:
        'Pindahkan jumlah tepat ke akaun DuitNow di atas, muat naik resit di halaman invois, atau terus sahkan menerusi WhatsApp.',
      notifyChannel: 'whatsapp',
      active: true,
    },
    {
      id: 'pay-maybank',
      name: 'Maybank Transfer',
      type: 'bank',
      channelCode: 'MAYBANK',
      accountLabel: 'TopupBalz Enterprise',
      accountNumber: '5621-0689-4412',
      instructions:
        'Masukkan Nombor Invois sebagai rujukan transaksi semasa melakukan pemindahan bank, kemudian hantarkan resit ke WhatsApp.',
      notifyChannel: 'whatsapp',
      active: true,
    },
    {
      id: 'pay-tng',
      name: "Touch 'n Go eWallet",
      type: 'ewallet',
      channelCode: 'TNG',
      accountLabel: 'TopupBalz Official',
      accountNumber: '011-2345-6789',
      instructions:
        'Imbas kod QR TNG atau transfer ke nombor tertera, wajib muat naik bukti bayaran (pilih fail), dan semak status transaksi anda di Telegram Info Channel.',
      qrImageUrl: '/assets/aistudio/20260920_125927_866903c8.jpg',
      requireProof: true,
      notifyChannel: 'telegram',
      active: true,
    },
  ],
  orders: [],
  user: {
    name: '',
    email: '',
    phone: '',
    loggedIn: false,
    emailVerified: false,
    role: 'customer',
  },
  whatsappTemplates: {
    customerCheckout:
      'Hai {app_name}, saya ingin sahkan bayaran pesanan manual:\n\n' +
      'No. Invois: {order_id}\n' +
      'Game: {brand_name}\n' +
      'Produk: {product_name}\n' +
      'ID Akaun: {account_id}\n' +
      'Kaedah Bayaran: {payment_method}\n' +
      'Jumlah Bayaran: {total_amount}\n\n' +
      'Saya lampirkan bukti pembayaran di sini. Terima kasih!',
    orderCreated:
      'Hai {customer_name}, pesanan anda *{order_id}* ({brand_name} - {product_name}) sebanyak {total_amount} telah diterima di {app_name}. Sila selesaikan bayaran manual untuk kami proses segera.',
    orderCompleted:
      'Hai {customer_name}! Pesanan *{order_id}* ({brand_name} - {product_name}) telah BERJAYA diproses dan dikreditkan ke ID {account_id}. Terima kasih kerana berurusan dengan {app_name}!',
    orderFailed:
      'Hai {customer_name}, maaf pesanan *{order_id}* mengalami masalah atau dibatalkan. Sila balas mesej ini untuk semakan lanjut bersama CS {app_name}.',
  },
  settings: {
    title: 'TopupBalz',
    email: 'support@topupbalz.my',
    phone: '+60 11-2345 6789',
    whatsappCs: '601123456789',
    supportHours: 'Setiap Hari · 09:00 – 01:00 MYT',
    footerDescription:
      'Platform topup game pilihan di Malaysia dengan bayaran manual yang mudah, selamat, dan pengesahan pantas terus melalui WhatsApp.',
    promoBannerEnabled: true,
    promoBannerText:
      'Gunakan kod voucher TOPUPBALZ (Diskaun RM 2.00) atau PROMO10 (Diskaun 10%) di halaman checkout!',
    maintenanceActive: false,
    maintenanceTitle: 'Sistem Sedang Dalam Penyelenggaraan',
    maintenanceDescription:
      'Maaf, laman web sedang dikemas kini buat sementara waktu. Anda masih boleh menghubungi kami terus melalui WhatsApp untuk pesanan segera.',
    termsText:
      '1. Semua transaksi topup diproses secara manual selepas bukti pembayaran disahkan melalui WhatsApp.\n\n' +
      '2. Pembeli bertanggungjawab memastikan User ID dan Server ID yang dimasukkan adalah tepat sebelum membuat bayaran.\n\n' +
      '3. Pesanan yang telah berjaya dikreditkan ke ID pemain tidak boleh dipulangkan atau ditukar.\n\n' +
      '4. Jika berlaku sebarang kelewatan melebihi 15 minit, sila hubungi Khidmat Pelanggan melalui WhatsApp rasmi kami.',
    privacyPolicyText:
      '1. Maklumat yang dikumpulkan seperti Nama, Nombor WhatsApp, dan ID Game hanya digunakan bagi tujuan pemprosesan pesanan serta komunikasi sokongan pelanggan.\n\n' +
      '2. Kami tidak pernah meminta kata laluan akaun permainan atau maklumat perbankan sulit anda.\n\n' +
      '3. Data pesanan disimpan secara tempatan pada pelayar anda bagi memudahkan semakan invois.',
    adminPin: '',
    telegramChannelUrl: '',
    telegramChannelName: 'Telegram Info Channel',
  },
};

export function loadStoreState(): TopupBalzStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STORE_STATE;
    const parsed = JSON.parse(raw) as Partial<TopupBalzStoreState>;
    return {
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : INITIAL_STORE_STATE.categories,
      homeSections: Array.isArray(parsed.homeSections)
        ? parsed.homeSections
        : INITIAL_STORE_STATE.homeSections,
      brands:
        Array.isArray(parsed.brands) && parsed.brands.length > 0
          ? parsed.brands
          : INITIAL_STORE_STATE.brands,
      sliders:
        Array.isArray(parsed.sliders) && parsed.sliders.length > 0
          ? parsed.sliders
          : INITIAL_STORE_STATE.sliders,
      vouchers: Array.isArray(parsed.vouchers)
        ? parsed.vouchers
        : INITIAL_STORE_STATE.vouchers,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : INITIAL_STORE_STATE.faqs,
      infoPosts: Array.isArray(parsed.infoPosts)
        ? parsed.infoPosts
        : INITIAL_STORE_STATE.infoPosts,
      paymentAccounts:
        Array.isArray(parsed.paymentAccounts) && parsed.paymentAccounts.length > 0
          ? parsed.paymentAccounts
          : INITIAL_STORE_STATE.paymentAccounts,
      orders: Array.isArray(parsed.orders)
        ? parsed.orders
        : INITIAL_STORE_STATE.orders,
      user: {
        ...INITIAL_STORE_STATE.user,
        ...(parsed.user ?? {}),
      },
      whatsappTemplates: {
        ...INITIAL_STORE_STATE.whatsappTemplates,
        ...(parsed.whatsappTemplates ?? {}),
      },
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
    // Ignore storage quota errors
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

export function applyWhatsAppTemplate(
  template: string,
  order: OrderItem,
  appName: string
): string {
  const accountDisplay = order.serverId
    ? `${order.accountId} (${order.serverId})`
    : order.accountId;

  return template
    .replaceAll('{customer_name}', order.customerName)
    .replaceAll('{order_id}', order.reference)
    .replaceAll('{app_name}', appName)
    .replaceAll('{brand_name}', order.brandName)
    .replaceAll('{product_name}', order.productName)
    .replaceAll('{account_id}', accountDisplay)
    .replaceAll('{payment_method}', order.paymentMethodName)
    .replaceAll('{total_amount}', formatMyr(order.totalAmount));
}

export const DEFAULT_TNG_QR_IMAGE =
  '/assets/aistudio/20260920_125927_866903c8.jpg';

export function isPlaceholderPhoneValue(raw: string): boolean {
  const digits = (raw || '').replace(/\D/g, '');
  return (
    digits === '' ||
    digits === '01123456789' ||
    digits === '601123456789' ||
    digits === '1123456789'
  );
}

export function formatLocalMyPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  let local = digits;
  if (local.startsWith('60') && local.length >= 10) {
    local = `0${local.slice(2)}`;
  } else if (!local.startsWith('0') && local.startsWith('1')) {
    local = `0${local}`;
  }
  if (local.length === 10) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  if (local.length === 11) {
    return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }
  return local;
}

export function resolvePaymentAccountDisplay(
  acc: TopupBalzStoreState['paymentAccounts'][number],
  settings: Pick<TopupBalzStoreState['settings'], 'whatsappCs' | 'phone'>
): TopupBalzStoreState['paymentAccounts'][number] {
  const isTng =
    acc.id === 'pay-tng' || acc.channelCode.toUpperCase() === 'TNG';
  const adminSource = !isPlaceholderPhoneValue(settings.whatsappCs)
    ? settings.whatsappCs
    : !isPlaceholderPhoneValue(settings.phone)
      ? settings.phone
      : '';
  const accountNumber =
    isPlaceholderPhoneValue(acc.accountNumber) && adminSource
      ? formatLocalMyPhone(adminSource)
      : acc.accountNumber;

  const qrImageUrl =
    acc.qrImageUrl !== undefined
      ? acc.qrImageUrl
      : isTng
        ? DEFAULT_TNG_QR_IMAGE
        : undefined;

  const requireProof =
    acc.requireProof !== undefined ? acc.requireProof : isTng;

  const notifyChannel =
    acc.notifyChannel ?? (isTng ? 'telegram' : 'whatsapp');

  return {
    ...acc,
    accountNumber,
    qrImageUrl,
    requireProof,
    notifyChannel,
  };
}

export function normalizePhoneForWa(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `60${digits.slice(1)}`;
  }
  return digits;
}

export function buildCustomerWhatsAppUrl(
  store: TopupBalzStoreState,
  order: OrderItem
): string {
  const csNumber = normalizePhoneForWa(store.settings.whatsappCs);
  const msg = applyWhatsAppTemplate(
    store.whatsappTemplates.customerCheckout,
    order,
    store.settings.title
  );
  return `https://wa.me/${csNumber}?text=${encodeURIComponent(msg)}`;
}

export function buildAdminWhatsAppUpdateUrl(
  store: TopupBalzStoreState,
  order: OrderItem,
  templateType: 'orderCreated' | 'orderCompleted' | 'orderFailed'
): string {
  const customerPhone = normalizePhoneForWa(order.whatsapp);
  const msg = applyWhatsAppTemplate(
    store.whatsappTemplates[templateType],
    order,
    store.settings.title
  );
  return `https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`;
}
