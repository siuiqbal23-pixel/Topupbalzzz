import { useMemo, useState } from 'react';
import { Search, Menu, X, Sun, Moon, ChevronLeft, ChevronRight, Gamepad2, ShoppingBag, ReceiptText, UserRound, Sparkles, ShieldCheck, Zap, Headphones } from 'lucide-react';
import GamePage from './GamePage';
import AccountPages from './AccountPages';
import TransactionPages from './TransactionPages';
import AdminPanel from './AdminPanel';

const games = [
  { id:'ff', name:'Free Fire', category:'Battle Royale', description:'Diamonds & Membership', mark:'FF', tone:'from-orange-500 to-amber-700' },
  { id:'ml', name:'Mobile Legends', category:'MOBA', description:'Diamonds & Weekly Pass', mark:'ML', tone:'from-blue-500 to-indigo-800' },
  { id:'pubg', name:'PUBG Mobile', category:'Battle Royale', description:'UC & Royale Pass', mark:'PUBG', tone:'from-yellow-500 to-orange-700' },
  { id:'fc', name:'FC Mobile', category:'Sukan', description:'FC Points', mark:'FC', tone:'from-emerald-500 to-teal-800' },
  { id:'hok', name:'Honor of Kings', category:'MOBA', description:'Tokens', mark:'HOK', tone:'from-violet-500 to-purple-900' },
  { id:'genshin', name:'Genshin Impact', category:'RPG', description:'Genesis Crystals', mark:'GI', tone:'from-cyan-500 to-blue-800' },
];
const categories = ['Semua','Battle Royale','MOBA','Sukan','RPG'];
const slides = [
  { eyebrow:'TOPUP MUDAH • PANTAS • SELAMAT', title:'Mula game, kami uruskan topup.', desc:'Pilih game kegemaran dan dapatkan tambah nilai dengan mudah di TopupBalz.', tag:'SELAMAT DATANG KE TOPUPBALZ' },
  { eyebrow:'PROMOSI TOPUPBALZ', title:'Game pilihan, satu tempat.', desc:'Cari produk game anda dan semak pesanan pada bila-bila masa.', tag:'TOPUP GAME KEGEMARAN ANDA' },
];
export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminPanel />;
  if (['/login','/register','/profile','/verify-email'].includes(window.location.pathname)) return <AccountPages path={window.location.pathname} />;
  if (['/transaction','/transaction-check','/privacy-policy','/terms','/maintenance'].includes(window.location.pathname) || window.location.pathname.startsWith('/transaction/')) return <TransactionPages path={window.location.pathname} />;
  if (window.location.pathname.startsWith('/game/')) return <GamePage gameId={window.location.pathname.split('/')[2] || 'ff'} />;
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('Semua');
  const [slide,setSlide]=useState(0);
  const [dark,setDark]=useState(true);
  const [menu,setMenu]=useState(false);
  const [receipt,setReceipt]=useState('');
  const [showReceipt,setShowReceipt]=useState(false);
  const visible=useMemo(()=>games.filter(g=>(category==='Semua'||g.category===category)&&g.name.toLowerCase().includes(search.toLowerCase())),[category,search]);
  const theme=dark?'bg-[#111318] text-white':'bg-slate-50 text-slate-900';
  const panel=dark?'bg-[#1b1e25] border-white/10':'bg-white border-slate-200';
  return <div className={theme+' min-h-screen transition-colors'}>
    <div className="border-b border-orange-500/20 bg-[#f47b16] px-4 py-2 text-center text-xs font-bold tracking-wide text-white">TOPUPBALZ • TOPUP GAME DENGAN MUDAH</div>
    <header className={'sticky top-0 z-30 border-b backdrop-blur-xl '+(dark?'border-white/10 bg-[#15171d]/95':'border-slate-200 bg-white/95')}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <a href="/" className="flex shrink-0 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-xl font-black text-black">B</span><span className="text-lg font-black tracking-tight">TOPUP<span className="text-orange-500">BALZ</span></span></a>
        <div className="hidden flex-1 md:block"><div className={'mx-auto flex max-w-md items-center gap-2 rounded-xl border px-3 py-2 '+(dark?'border-white/10 bg-[#20232b]':'border-slate-200 bg-slate-100')}><Search size={17} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama game..." className="w-full bg-transparent text-sm outline-none"/></div></div>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold md:flex"><a href="#home" className="hover:text-orange-500">Home</a><button onClick={()=>setShowReceipt(true)} className="hover:text-orange-500">Semakan Resit</button><a href="#ranking" className="hover:text-orange-500">Ranking</a><a href="#profile" className="hover:text-orange-500">Profile</a></nav>
        <button onClick={()=>setDark(!dark)} className={'rounded-xl border p-2 '+(dark?'border-white/10':'border-slate-200')} aria-label="Tukar tema">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <button onClick={()=>setMenu(!menu)} className="rounded-xl border border-white/10 p-2 md:hidden">{menu?<X size={19}/>:<Menu size={19}/>}</button>
      </div>
      {menu&&<div className={'grid gap-1 border-t p-4 md:hidden '+(dark?'border-white/10':'border-slate-200')}><a onClick={()=>setMenu(false)} href="#home" className="rounded-lg p-3">Home</a><button onClick={()=>{setShowReceipt(true);setMenu(false)}} className="rounded-lg p-3 text-left">Semakan Resit</button><a onClick={()=>setMenu(false)} href="#ranking" className="rounded-lg p-3">Ranking</a><a onClick={()=>setMenu(false)} href="#profile" className="rounded-lg p-3">Profile</a></div>}
    </header>
    <main id="home" className="mx-auto max-w-7xl px-4 py-7">
      <section className="relative mb-9 overflow-hidden rounded-2xl border border-orange-400/20 bg-gradient-to-br from-[#40200e] via-[#251b17] to-[#17191f] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"/>
        <div className="relative max-w-2xl"><span className="mb-4 inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black tracking-[.2em] text-orange-300">{slides[slide].tag}</span><p className="mb-3 text-xs font-bold tracking-[.18em] text-orange-400">{slides[slide].eyebrow}</p><h1 className="text-3xl font-black leading-tight sm:text-5xl">{slides[slide].title}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{slides[slide].desc}</p><a href="#katalog" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-black transition hover:bg-orange-400"><Gamepad2 size={18}/> Teroka Game</a></div>
        <div className="absolute bottom-5 right-5 flex gap-2"><button onClick={()=>setSlide((slide+slides.length-1)%slides.length)} className="rounded-full border border-white/20 bg-black/20 p-2"><ChevronLeft size={18}/></button><button onClick={()=>setSlide((slide+1)%slides.length)} className="rounded-full border border-white/20 bg-black/20 p-2"><ChevronRight size={18}/></button></div>
      </section>
      <section className="mb-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[['Zap','Proses mudah','Pengalaman topup ringkas'],['ShieldCheck','Lebih yakin','Semak status pesanan'],['Headphones','Bantuan pelanggan','Hubungi sokongan jika perlu']].map(([Icon,title,desc],i)=>{const I=[Zap,ShieldCheck,Headphones][i];return <div key={title} className={'flex items-center gap-3 rounded-xl border p-4 '+panel}><span className="rounded-xl bg-orange-500/10 p-3 text-orange-400"><I size={21}/></span><span><b className="block text-sm">{title}</b><small className="text-xs text-slate-400">{desc}</small></span></div>})}
      </section>
      <section id="katalog" className="mb-12 scroll-mt-28">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-orange-500">PILIHAN ANDA</p><h2 className="mt-1 text-2xl font-black">Kategori Game</h2></div><span className="text-xs text-slate-400">{visible.length} permainan</span></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={'shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition '+(category===c?'border-orange-500 bg-orange-500 text-black':dark?'border-white/10 bg-[#1b1e25] text-slate-300 hover:border-orange-500/50':'border-slate-200 bg-white text-slate-600')}>{c}</button>)}</div>
        <div className="mb-5 md:hidden"><div className={'flex items-center gap-2 rounded-xl border px-3 py-3 '+(dark?'border-white/10 bg-[#20232b]':'border-slate-200 bg-white')}><Search size={17} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama game..." className="w-full bg-transparent text-sm outline-none"/></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">{visible.map(g=><a key={g.id} href={'/game/'+g.id} className={'group overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:border-orange-500/60 '+panel}><div className={'relative grid aspect-[4/3] place-items-center bg-gradient-to-br '+g.tone}><span className="text-4xl font-black tracking-tight text-white drop-shadow-lg">{g.mark}</span><span className="absolute bottom-2 left-2 rounded-md bg-black/35 px-2 py-1 text-[9px] font-bold text-white">GAME TOPUP</span></div><div className="p-3"><h3 className="text-sm font-extrabold">{g.name}</h3><p className="mt-1 text-[11px] text-slate-400">{g.description}</p><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-orange-500">Pilih game <ChevronRight size={13}/></span></div></a>)}</div>
        {visible.length===0&&<div className={'rounded-xl border p-10 text-center text-sm text-slate-400 '+panel}>Tiada game ditemui. Cuba kata carian lain.</div>}
      </section>
      <section id="ranking" className={'mb-10 rounded-2xl border p-6 '+panel}><div className="flex items-center gap-3"><span className="rounded-xl bg-orange-500/10 p-3 text-orange-400"><Sparkles size={22}/></span><div><h2 className="font-black">Ranking Topup</h2><p className="text-xs text-slate-400">Lihat kedudukan pelanggan berdasarkan jumlah topup.</p></div></div><p className="mt-4 text-xs text-slate-500">Data ranking akan dipaparkan apabila sambungan data pesanan dipasang.</p></section>
      <section id="profile" className={'mb-8 flex flex-col justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center '+panel}><div className="flex items-center gap-3"><span className="rounded-xl bg-orange-500/10 p-3 text-orange-400"><UserRound size={22}/></span><div><h2 className="font-black">Akaun pelanggan</h2><p className="text-xs text-slate-400">Log masuk atau daftar akaun TopupBalz.</p></div></div><div className="flex gap-2"><a href="/login" className="rounded-lg border border-orange-500/40 px-4 py-2 text-xs font-bold text-orange-400">Log masuk</a><a href="/register" className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-black">Daftar</a></div></section>
    </main>
    <footer className="border-t border-white/10 bg-black/10"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-base text-white">TOPUP<span className="text-orange-500">BALZ</span></b><p className="mt-1">Topup game pilihan anda dengan mudah.</p></div><p>© 2024 Iqbalz TopupBalz. All rights reserved.</p><button onClick={()=>setShowReceipt(true)} className="flex items-center gap-2 hover:text-orange-400"><ReceiptText size={15}/> Semakan resit</button></div></footer>
    {showReceipt&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={()=>setShowReceipt(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1e25] p-6 text-white shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Semakan Resit</h2><button onClick={()=>setShowReceipt(false)}><X size={20}/></button></div><p className="mb-3 text-sm text-slate-400">Masukkan kod resit atau nombor pesanan anda.</p><input value={receipt} onChange={e=>setReceipt(e.target.value)} placeholder="Contoh: TBZ-XXXXXX" className="mb-3 w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-3 text-sm outline-none focus:border-orange-500"/><a href={'/transaction?code='+encodeURIComponent(receipt)} className="block rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-bold text-black">Semak pesanan</a></div></div>}
  </div>;
}