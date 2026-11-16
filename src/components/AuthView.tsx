import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import {
  sendSignupOtp,
  syncFirebaseUser,
  verifySignupOtp,
} from '../lib/api';
import { auth, googleAuthProvider } from '../lib/firebase';
import type { UserProfile } from '../types/store';

interface AuthViewProps {
  mode: 'login' | 'register' | 'forgot';
  appName: string;
  returnPath?: string | null;
  onSuccessAuth: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  if (code === 'auth/operation-not-allowed') {
    return 'Kaedah Emel & Kata Laluan belum diaktifkan di Firebase Console (Authentication -> Sign-in method -> Email/Password). Sila aktifkan atau gunakan Log Masuk Google.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'E-mel atau kata laluan tidak tepat.';
  }
  if (code === 'auth/user-not-found') {
    return 'Akaun tidak ditemui. Sila daftar akaun baharu terlebih dahulu.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Alamat e-mel ini sudah didaftarkan. Sila log masuk.';
  }
  if (code === 'auth/weak-password') {
    return 'Kata laluan terlalu lemah (minimum 6 aksara).';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Tetingkap log masuk Google ditutup sebelum selesai.';
  }
  return err instanceof Error ? err.message : 'Ralat pengesahan berlaku.';
}

export function AuthView({
  mode,
  appName,
  returnPath,
  onSuccessAuth,
  onNavigate,
}: AuthViewProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mandatory Email OTP states for Sign Up
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifiedToken, setOtpVerifiedToken] = useState<string | null>(null);
  const [otpPreviewCode, setOtpPreviewCode] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const { user } = await syncFirebaseUser({
        email: cred.user.email || '',
        name: cred.user.displayName || '',
      });
      onSuccessAuth(user);
      onNavigate(returnPath || '/');
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setOtpPreviewCode(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Sila masukkan alamat e-mel yang sah dahulu.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await sendSignupOtp(cleanEmail);
      setOtpSent(true);
      setOtpVerifiedToken(null);
      if (res.delivery === 'preview' && res.previewOtp) {
        setOtpPreviewCode(res.previewOtp);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghantar kod OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Sila masukkan kod OTP 6 digit.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifySignupOtp(cleanEmail, otpCode.trim());
      if (res.verified && res.verificationToken) {
        setOtpVerifiedToken(res.verificationToken);
        setOtpPreviewCode(null);
      } else {
        setError('Kod OTP tidak sepadan atau telah tamat tempoh.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Pengesahan OTP gagal.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Sila masukkan alamat e-mel anda.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!otpVerifiedToken) {
        setError('Sila sahkan kod OTP e-mel anda dahulu sebelum mendaftar.');
        return;
      }
      if (!name.trim()) {
        setError('Sila masukkan nama penuh anda.');
        return;
      }
      if (!email.trim() || password.length < 6) {
        setError('Sila lengkapkan e-mel dan kata laluan (min 6 aksara).');
        return;
      }

      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        const { user } = await syncFirebaseUser({
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          otpVerificationToken: otpVerifiedToken,
        });
        onSuccessAuth(user);
        onNavigate(returnPath || '/');
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    if (!email.trim() || !password) {
      setError('Sila lengkapkan e-mel dan kata laluan.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const { user } = await syncFirebaseUser({
        email: cred.user.email || email.trim(),
        name: cred.user.displayName || '',
      });
      onSuccessAuth(user);
      onNavigate(returnPath || '/');
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-3 py-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 shadow-sm space-y-4">
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
            {appName}
          </p>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'login'
              ? 'Log Masuk Akaun'
              : mode === 'register'
                ? 'Daftar Akaun Baharu'
                : 'Tetapkan Semula Kata Laluan'}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {returnPath
              ? 'Log masuk wajib untuk meneruskan pembelian anda.'
              : mode === 'login'
                ? 'Log masuk menggunakan Google atau Emel & Kata Laluan.'
                : mode === 'register'
                  ? 'Sahkan e-mel anda dengan kod OTP 6 digit untuk mendaftar.'
                  : 'Masukkan e-mel berdaftar untuk pautan tetapan semula.'}
          </p>
        </div>

        {/* Google Sign-In Button (Login & Register) */}
        {mode !== 'forgot' ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0E1117] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Teruskan dengan Google</span>
            </button>

            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
              <span className="px-2.5 text-[10px] uppercase tracking-wider text-slate-400">
                atau guna e-mel
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
            </div>
          </>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Input + Mandatory OTP Gate on Register */}
          <div>
            <label
              htmlFor="authEmail"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Alamat E-mel
            </label>
            <div className="flex gap-1.5">
              <input
                id="authEmail"
                type="email"
                disabled={Boolean(mode === 'register' && otpVerifiedToken)}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (mode === 'register') {
                    setOtpSent(false);
                    setOtpVerifiedToken(null);
                  }
                }}
                placeholder="nama@contoh.com"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-70"
              />
              {mode === 'register' && !otpVerifiedToken ? (
                <button
                  type="button"
                  disabled={otpLoading || !email.trim()}
                  onClick={handleSendOtp}
                  className="px-2.5 py-2 rounded-lg bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-[11px] font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{otpSent ? 'Hantar Semula' : 'Hantar OTP'}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* OTP Verification Input on Register */}
          {mode === 'register' && otpSent && !otpVerifiedToken ? (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
              <label
                htmlFor="otpCodeInput"
                className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200"
              >
                Masukkan Kod OTP 6 Digit
              </label>
              <div className="flex gap-1.5">
                <input
                  id="otpCodeInput"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1117] text-xs font-mono-tabular tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  disabled={otpLoading || otpCode.length !== 6}
                  onClick={handleVerifyOtp}
                  className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white whitespace-nowrap cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sahkan</span>
                </button>
              </div>
              {otpPreviewCode ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                  Kod OTP pratonton (perkhidmatan e-mel belum dikonfigurasi):{' '}
                  <span className="font-mono-tabular font-bold select-all">
                    {otpPreviewCode}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semak peti masuk atau folder spam e-mel anda untuk kod 6 digit.
                </p>
              )}
            </div>
          ) : null}

          {mode === 'register' && otpVerifiedToken ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>E-mel disahkan dengan kod OTP</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setOtpVerifiedToken(null);
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="text-[11px] underline cursor-pointer"
              >
                Tukar
              </button>
            </div>
          ) : null}

          {/* Rest of Registration Fields (ONLY unlocked after OTP verification!) */}
          {mode === 'register' && otpVerifiedToken ? (
            <>
              <div>
                <label
                  htmlFor="authName"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nama Penuh
                </label>
                <input
                  id="authName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama anda"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="authPhone"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nombor WhatsApp
                </label>
                <input
                  id="authPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </>
          ) : null}

          {/* Password Field (Login immediately, or Register after OTP verified) */}
          {mode === 'login' || (mode === 'register' && otpVerifiedToken) ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="authPassword"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Kata Laluan
                </label>
                {mode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    Lupa kata laluan?
                  </button>
                ) : null}
              </div>
              <input
                id="authPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-400 leading-snug">
              {error}
            </p>
          ) : null}

          {resetSent ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Pautan tetapan semula kata laluan telah dihantar ke {email}.
            </p>
          ) : null}

          {mode !== 'register' || otpVerifiedToken ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Memproses...'
                : mode === 'login'
                  ? 'Log Masuk'
                  : mode === 'register'
                    ? 'Lengkapkan Pendaftaran'
                    : 'Hantar Pautan Tetapan'}
            </button>
          ) : null}
        </form>

        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate(returnPath || '/')}
            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali</span>
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
            >
              Belum ada akaun? Daftar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
            >
              Sudah ada akaun? Log Masuk
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
