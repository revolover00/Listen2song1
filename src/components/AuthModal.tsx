import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Music, Disc, Chrome } from 'lucide-react';
import { signInUser, signUpUser, signInWithGoogle } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('يرجى إدخال اسم العرض الخاص بك.');
      return;
    }

    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpUser(email, password, displayName);
      } else {
        await signInUser(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      // Translate common Firebase errors into clean Arabic messages
      let msg = 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'البريد الإلكتروني مستخدم بالفعل.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'عنوان البريد الإلكتروني غير صالح.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      let msg = 'حدث خطأ أثناء تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'تم إلغاء طلب تسجيل الدخول.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header / Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-6 h-6 text-[#1DB954] animate-spin-slow" />
            <span className="font-extrabold text-lg text-white">listen2song</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Welcome Section */}
        <div className="text-right">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isSignUp ? 'سجل معنا للاستماع لموسيقاك المفضلة وحفظ أغانيك' : 'مرحبًا بعودتك! سجل الدخول للاستماع لأغانيك'}
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-right text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right" dir="rtl">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 mr-1">الاسم بالكامل</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: أحمد علي"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-4 pr-11 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full h-11 pl-4 pr-11 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all ltr"
                style={{ direction: 'ltr' }}
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 mr-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-11 pl-11 pr-11 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all ltr"
                style={{ direction: 'ltr' }}
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                aria-label="إظهار كلمة المرور"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-[#1DB954] hover:text-black transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-xs text-zinc-500">أو</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-red-500" />
          <span>المتابعة باستخدام Google</span>
        </button>

        {/* Footer switch state block */}
        <div className="text-center text-xs text-zinc-400 border-t border-zinc-900 pt-4 mt-2">
          {isSignUp ? (
            <p>
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-[#1DB954] font-semibold hover:underline cursor-pointer"
              >
                سجل دخولك هنا
              </button>
            </p>
          ) : (
            <p>
              ليس لديك حساب؟{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className="text-[#1DB954] font-semibold hover:underline cursor-pointer"
              >
                أنشئ حسابك الآن مجانًا
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
