import { MessageCircle, Wrench } from 'lucide-react';
import { normalizePhoneForWa } from '../data/initialStoreData';
import type { StoreSettings } from '../types/store';

export function StaticContentPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">
          {title}
        </h1>
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {body}
        </div>
      </div>
    </main>
  );
}

export function MaintenanceView({
  settings,
  onOpenAdmin,
}: {
  settings: StoreSettings;
  onOpenAdmin: () => void;
}) {
  const waUrl = `https://wa.me/${normalizePhoneForWa(settings.whatsappCs)}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center space-y-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
        <Wrench className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
        {settings.maintenanceTitle}
      </h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
        {settings.maintenanceDescription}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          <span>Hubungi Admin WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
        >
          Buka Panel Admin
        </button>
      </div>
    </main>
  );
}
