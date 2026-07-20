import React, { useState } from 'react';
import { useMusic } from '../store/musicStore';
import { Mail, User as UserIcon, X, Music } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useMusic();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const success = await login(email);
        if (success) onClose();
        else setError('Failed to log in. Please check your credentials.');
      } else {
        if (!name) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const success = await register(email, name);
        if (success) onClose();
        else setError('Failed to register. Email might already be taken.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-spotify-light border border-spotify-highlight rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-spotify-highlight transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-spotify-green rounded-full mb-3 text-black">
            <Music className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            {isLogin ? 'Log in to listen2song' : 'Create an Account'}
          </h2>
          <p className="text-sm text-gray-400 text-center mt-1">
            Access unlimited cost-free music streaming
          </p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500 text-red-200 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Amr Diab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-spotify-dark border border-spotify-highlight rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-spotify-green transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="email"
                placeholder="example@listen2song.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-spotify-dark border border-spotify-highlight rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-spotify-green transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-spotify-green hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-spotify-highlight text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-spotify-green hover:underline focus:outline-none"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
