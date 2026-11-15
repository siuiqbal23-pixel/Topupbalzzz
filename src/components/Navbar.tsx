import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  storeName: string;
  onNavigateHomeSection: (sectionId?: string) => void;
  onOpenAdmin: () => void;
}

export function Navbar({ storeName, onNavigateHomeSection, onOpenAdmin }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const go = (section?: string) => { setOpen(false); onNavigateHomeSection(section); };
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#22262f]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <button onClick={() => go()} className="flex items-center gap-2 text-left text-sm font-bold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-[10px] font-black text-white">TB</span>
          {storeName}
        </button>
        <nav className="hidden items-center gap-5 text-xs text-slate-300 sm:flex">
          <button onClick={() => go()} className="hover:text-orange-400">Beranda</button>
          <button onClick={() => go('semak-transaksi')} className="hover:text-orange-400">Cek Transaksi</button>
          <button onClick={onOpenAdmin} className="hover:text-orange-400">Panel Admin</button>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onOpenAdmin} className="rounded-md border border-orange-500/50 bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white hover:bg-orange-400">Panel Admin</button>
          <button onClick={() => setOpen(v => !v)} aria-label={open ? 'Tutup menu' : 'Buka menu'} className="rounded-md p-2 text-slate-300 hover:bg-white/5 sm:hidden">{open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
        </div>
      </div>
      {open && <div className="space-y-1 border-t border-white/10 bg-[#22262f] px-4 py-3 sm:hidden">
        <button onClick={() => go()} className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200">Beranda</button>
        <button onClick={() => go('semak-transaksi')} className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200">Cek Transaksi</button>
        <button onClick={() => {setOpen(false);onOpenAdmin();}} className="block w-full rounded-md px-3 py-2 text-left text-sm text-orange-300">Panel Admin</button>
      </div>}
    </header>
  );
}
