import { Mail, MessageCircle, Phone } from 'lucide-react';
import { normalizePhoneForWa } from '../data/initialStoreData';
import type { StoreSettings } from '../types/store';

interface MainFooterProps {
  settings: StoreSettings;
  onNavigate: (path: string) => void;
}

export function MainFooter({ settings, onNavigate }: MainFooterProps) {
  const waDigits = normalizePhoneForWa(settings.whatsappCs);
  const waUrl = `https://wa.me/${waDigits}`;
  const displayPhone =
    !settings.phone?.trim() ||
    (settings.phone === '+60 11-2345 6789' &&
      waDigits &&
      waDigits !== '601123456789')
      ? `+${waDigits}`
      : settings.phone;

  return (
    <footer className="border-t border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#0A0C10]">
      <div className="mx-auto max-w-6xl px-3 sm:px-5 py-7 sm:py-8">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Company Info */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {settings.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              {settings.footerDescription}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Waktu Sokongan: {settings.supportHours}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-2.5 text-xs font-semibold text-slate-900 dark:text-white">
              Pautan Pantas
            </h4>
            <ul className="space-y-1.5 text-xs">
              {[
                { label: 'Home', path: '/' },
                { label: 'Transaksi', path: '/transaction' },
                { label: 'Informasi', path: '/info' },
                { label: 'Kebijakan Privasi', path: '/privacy-policy' },
                { label: 'Syarat & Ketentuan', path: '/terms' },
              ].map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.path);
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-2.5 text-xs font-semibold text-slate-900 dark:text-white">
              Hubungi Kami
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
                <span className="truncate">{settings.email}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
                <span className="font-mono-tabular">{displayPhone}</span>
              </li>
              <li>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Chat WhatsApp Admin</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-white/[0.07] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {settings.title}. Hak cipta terpelihara.
          </p>
          <p>Bayaran Manual &amp; Pengesahan Terus via WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}
