import { useMemo } from 'react';
import { Calendar, Megaphone } from 'lucide-react';
import type { InfoPost } from '../types/store';
import { GameImage } from './GameImage';

interface InfoViewProps {
  posts: InfoPost[];
}

export function InfoView({ posts }: InfoViewProps) {
  const activePosts = useMemo(
    () =>
      posts
        .filter((p) => p.active)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [posts]
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-6 py-5 sm:py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          Informasi &amp; Pengumuman
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Panduan terkini, promosi, dan makluman rasmi daripada admin.
        </p>
      </div>

      {activePosts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-8 text-center space-y-2">
          <Megaphone
            className="w-8 h-8 text-slate-400 mx-auto"
            aria-hidden="true"
          />
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            Tiada pengumuman atau informasi baharu buat masa ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activePosts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] shadow-sm flex flex-col"
            >
              {post.image ? (
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-[#0D1017]">
                  <GameImage
                    src={post.image}
                    alt={post.title}
                    title={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="p-4 flex-1 flex flex-col space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                  <Calendar className="w-3 h-3 text-orange-500" aria-hidden="true" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString('ms-MY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {post.title}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
