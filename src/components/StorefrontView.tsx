import { useMemo, useState } from 'react';
import { Check, Copy, CreditCard, ExternalLink, Headphones, ShieldCheck, Star, Timer, Zap } from 'lucide-react';
import { formatMyr } from '../data/initialStoreData';
import type { OrderRecord, TopupBalzStoreState } from '../types/store';

interface StorefrontViewProps {
  store: TopupBalzStoreState;
  onCreateOrder: (order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>) => OrderRecord;
  onOpenAdmin: () => void;
}

export function StorefrontView({ store, onCreateOrder, onOpenAdmin }: StorefrontViewProps) {
  const games = useMemo(() => store.games.filter((g) => g.active), [store.games]);
  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const game = games.find((g) => g.id === gameId) ?? games[0];
  const packages = useMemo(() => game?.packages.filter((p) => p.active) ?? [], [game]);
  const [packageId, setPackageId] = useState('');
  const selectedPackage = packages.find((p) => p.id === packageId) ?? packages[0];
  const payments = store.paymentMethods.filter((p) => p.active);
  const [paymentId, setPaymentId] = useState(payments[0]?.id ?? '');
  const payment = payments.find((p) => p.id === paymentId) ?? payments[0];
  const [userGameId, setUserGameId] = useState('');
  const [serverId, setServerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<OrderRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [promoClosed, setPromoClosed] = useState(false);
  const [lookup, setLookup] = useState('');
  const matchingOrders = store.orders.filter((o) => !lookup || o.id.toLowerCase().includes(lookup.toLowerCase()) || o.whatsapp.includes(lookup));
  const total = selectedPackage?.priceMyr ?? 0;
  const waNumber = store.settings.whatsappNumber.replace(/\D/g, '');
  const waMessage = receipt ? encodeURIComponent(`Hai ${store.settings.storeName}, saya sudah membuat pesanan ${receipt.id}. Game: ${receipt.gameName}. Pakej: ${receipt.packageLabel}. Jumlah: ${formatMyr(receipt.amountMyr)}. Saya sertakan bukti bayaran.`) : '';
  const waLink = receipt ? `https://wa.me/${waNumber}?text=${waMessage}` : `https://wa.me/${waNumber}`;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!game || !selectedPackage || !payment) return setError('Sila pilih game, produk dan kaedah bayaran.');
    if (!userGameId.trim()) return setError('Sila masukkan Game ID anda.');
    if (game.needsServerId && !serverId.trim()) return setError('Sila masukkan Server ID.');
    if (!customerName.trim()) return setError('Sila masukkan nama anda.');
    if (!phone.trim() || phone.trim().length < 9) return setError('Sila masukkan nombor telefon yang sah.');
    const created = onCreateOrder({
      customerName: customerName.trim(), whatsapp: phone.trim(), gameId: game.id, gameName: game.name,
      userGameId: userGameId.trim(), serverId: game.needsServerId ? serverId.trim() : undefined,
      packageId: selectedPackage.id, packageLabel: selectedPackage.label, amountMyr: total, paymentMethod: payment.name,
    });
    setReceipt(created);
  };

  const card = 'rounded-lg border border-white/[0.07] bg-[#22262f] p-4 sm:p-5';
  const input = 'w-full rounded-md border border-white/[0.08] bg-[#20242c] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-orange-500';
  const label = 'mb-1.5 block text-xs font-medium text-slate-300';

  return (
    <div className="min-h-screen bg-[#191c23] text-slate-100">
      {store.settings.bannerEnabled && !promoClosed && (
        <div className="border-b border-white/[0.07] bg-[#242832] px-4 py-2 text-center text-xs text-slate-300">
          <span className="font-semibold text-orange-400">Promosi</span>　{store.settings.bannerText}
          <button className="ml-3 text-slate-400 hover:text-white" onClick={() => setPromoClosed(true)} aria-label="Tutup promosi">×</button>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6">
        <section className="mb-6 flex flex-col gap-4 rounded-lg border border-white/[0.06] bg-gradient-to-r from-[#202c40] to-[#1d2028] p-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-2xl font-black text-orange-400">TB</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold">{game?.name ?? store.settings.storeName} TOPUP</h1>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">● Proses Pantas</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-300">♧ Pembayaran Selamat</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Pilih produk dan lengkapkan maklumat akaun anda untuk meneruskan pesanan.</p>
          </div>
          <select aria-label="Pilih game" className={input + ' w-full sm:w-48'} value={game?.id ?? ''} onChange={(e) => { setGameId(e.target.value); setPackageId(''); setReceipt(null); }}>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </section>

        <form onSubmit={submit} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <section className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">1</span> Masukkan Data Akaun</h2>
              <div className="mb-4 rounded-md border border-orange-500/10 bg-[#292d36] px-3 py-2 text-xs text-slate-400"><ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-orange-400" />Pastikan data akaun yang kamu masukkan benar.</div>
              <div className={game?.needsServerId ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-1 gap-3'}>
                <div><label className={label}>Game ID</label><input className={input} value={userGameId} onChange={(e) => setUserGameId(e.target.value)} placeholder={game?.idPlaceholder ?? 'Masukkan Game ID'} /></div>
                {game?.needsServerId && <div><label className={label}>Server</label><input className={input} value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder={game.serverPlaceholder ?? 'Masukkan Server ID'} /></div>}
              </div>
            </section>

            <section className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">2</span> Pilih Produk</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {packages.map((p) => {
                  const active = selectedPackage?.id === p.id;
                  return <button key={p.id} type="button" onClick={() => setPackageId(p.id)} className={`overflow-hidden rounded-lg border text-left transition ${active ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30' : 'border-white/[0.07] bg-[#20242c] hover:border-white/20'}`}>
                    <span className="block min-h-[76px] p-3">
                      <span className="block text-xs font-semibold text-slate-100">{p.label}</span>
                      {p.bonus && <span className="mt-1 block text-[10px] text-emerald-400">{p.bonus}</span>}
                      <span className="mt-3 block text-sm font-bold text-orange-400">{formatMyr(p.priceMyr)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 border-t border-white/[0.06] bg-black/10 px-3 py-2 text-[10px] text-slate-400"><Timer className="h-3 w-3" /> Proses selepas bayaran disahkan</span>
                  </button>;
                })}
              </div>
              {packages.length === 0 && <p className="text-xs text-slate-400">Tiada produk aktif untuk game ini.</p>}
            </section>

            <section className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">3</span> Detail Kontak</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={label}>Nama</label><input className={input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama lengkap" /></div>
                <div><label className={label}>Nombor Telefon / WhatsApp</label><input className={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
                <div className="sm:col-span-2"><label className={label}>Email (Optional)</label><input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" /></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500">Jika ada kendala, kami akan menghubungi nombor WhatsApp kamu di atas.</p>
            </section>

            <section className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">4</span> Pilih Metode Pembayaran</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-md border border-white/[0.07] bg-[#20242c] px-3 py-2 text-slate-400">Automatis</div>
                <div className="rounded-md border border-orange-500 bg-orange-500/10 px-3 py-2 font-semibold text-orange-300">Manual (Transfer Bank / QRIS)</div>
              </div>
              <div className="space-y-2">
                {payments.map((p) => <button key={p.id} type="button" onClick={() => setPaymentId(p.id)} className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left ${payment?.id === p.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/[0.07] bg-[#20242c]'}`}>
                  <span className="flex min-w-0 items-center gap-3"><CreditCard className="h-5 w-5 shrink-0 text-orange-400" /><span className="min-w-0"><span className="block text-xs font-semibold">{p.name}</span><span className="block truncate text-[10px] text-slate-500">{p.accountLabel} · {p.accountNumber}</span></span></span>
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-400">Fee: RM 0</span>
                </button>)}
              </div>
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-20 lg:col-span-5">
            <section className={card}>
              <p className="text-xs font-semibold">Ulasan dan rating</p>
              <div className="mt-1 flex items-center gap-3"><strong className="text-3xl">4.99</strong><span className="flex text-sm text-amber-400">{Array.from({length:5},(_,i)=><Star key={i} className="h-4 w-4 fill-current" />)}</span></div>
              <p className="text-[10px] text-slate-500">Penilaian pelanggan TopupBalz</p>
            </section>
            <section className={card}>
              <div className="flex items-center gap-3"><span className="rounded-full bg-orange-500/10 p-2 text-orange-400"><Headphones className="h-4 w-4" /></span><div><p className="text-xs font-bold">Butuh Bantuan?</p><p className="text-[10px] text-slate-500">Kami sedia membantu anda.</p></div></div>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#1b1f27] py-2 text-xs hover:border-orange-500"><Headphones className="h-3.5 w-3.5" /> Hubungi CS</a>
            </section>
            <section className={card}>
              <h2 className="mb-3 text-sm font-semibold">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-xs"><div className="flex justify-between gap-3 text-slate-400"><span>Brand</span><span className="text-right text-slate-200">{game?.name ?? '-'}</span></div><div className="flex justify-between gap-3 text-slate-400"><span>Produk</span><span className="text-right text-slate-200">{selectedPackage?.label ?? 'Belum dipilih'}</span></div><div className="flex justify-between border-t border-white/[0.07] pt-3 text-sm font-bold"><span>Total:</span><span className="text-orange-400">{formatMyr(total)}</span></div></div>
              {error && <p role="alert" className="mt-3 rounded-md bg-red-500/10 p-2 text-xs text-red-300">{error}</p>}
              <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 py-2.5 text-xs font-bold text-white hover:bg-orange-400"><Zap className="h-4 w-4" /> Beli Sekarang</button>
            </section>
            {receipt && <section className={card + ' border-emerald-500/30'}>
              <div className="flex items-center justify-between"><p className="text-xs font-bold text-emerald-400">Pesanan berjaya dibuat</p><button type="button" onClick={() => {navigator.clipboard?.writeText(receipt.id);setCopied(true);}} className="flex items-center gap-1 text-[10px] text-slate-300"><Copy className="h-3 w-3" />{copied?'Disalin':'Salin ID'}</button></div>
              <p className="mt-2 font-mono text-sm">{receipt.id}</p>
              <p className="mt-2 text-xs text-slate-400">{payment?.name} · {payment?.accountLabel}</p>
              <p className="font-mono text-sm text-orange-300">{payment?.accountNumber}</p>
              <p className="mt-2 text-[10px] text-slate-400">{payment?.instructions}</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-md bg-emerald-600 py-2 text-xs font-semibold"><ExternalLink className="h-3 w-3" /> Hantar Resit ke WhatsApp</a>
            </section>}
          </aside>
        </form>

        <section id="semak-transaksi" className="mt-8 border-t border-white/[0.07] pt-5">
          <h2 className="mb-3 text-sm font-semibold">Semak Transaksi</h2>
          <input className={input} value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Masukkan ID pesanan atau nombor WhatsApp" />
          {lookup && <div className="mt-2 space-y-2">{matchingOrders.map((o) => <div key={o.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-[#22262f] p-3 text-xs"><span>{o.id} · {o.gameName}</span><span className="text-orange-300">{o.status}</span></div>)}{matchingOrders.length===0 && <p className="text-xs text-slate-500">Tiada transaksi ditemui.</p>}</div>}
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#22262b] px-4 py-7">
        <div className="mx-auto grid max-w-5xl gap-5 text-xs text-slate-400 sm:grid-cols-3">
          <div><p className="mb-2 font-semibold text-white">{store.settings.storeName}</p><p>Platform topup game dengan proses pantas dan pembayaran manual yang mudah.</p></div>
          <div><p className="mb-2 font-semibold text-white">Quick Links</p><button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Home</button><p className="mt-1">Semak Transaksi</p></div>
          <div><p className="mb-2 font-semibold text-white">Kontak</p><a href={`https://wa.me/${waNumber}`}>WhatsApp Sokongan</a><button onClick={onOpenAdmin} className="ml-3 text-orange-400">Admin</button></div>
        </div>
        <p className="mt-6 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} {store.settings.storeName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
