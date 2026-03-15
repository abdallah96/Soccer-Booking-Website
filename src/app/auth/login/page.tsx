'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoginSchema, LoginInput } from '@/lib/utils/validation';
import { useAuthStore } from '@/lib/stores/authStore';
import { trackPageView, trackAuth, trackAction } from '@/lib/utils/analytics';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    trackPageView('login');
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        toast.error(result.error);
        trackAuth('login_failed', { error: result.error });
        return;
      }

      setUser(result.user);
      trackAuth('user_logged_in', { 
        user_id: result.user.id,
        role: result.user.role 
      });
      toast.success('Connexion réussie !');
      
      // Redirect admins to admin panel, regular users to fields
      if (result.user.role === 'admin' || result.user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/fields');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la connexion';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 sm:px-8 lg:px-12 py-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 border-2 border-red-500/20 rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-2 border-gray-500/20 -rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-red-400/10 rounded-full"></div>
      </div>
      
      <div className="relative z-10 max-w-md w-full">
        <div className="relative">
          <div className="absolute -top-4 -right-4 w-full h-full border-2 border-red-500/30"></div>
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 border-2 border-red-500 mb-6">
                <span className="text-3xl">⚽</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-3">CONNEXION</h1>
              <p className="text-white/60 font-light">Connectez-vous à votre compte Petit Camp</p>
            </div>
            
            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              onFocus={() => trackAction('button_clicked', 'login_form_started')}
            >
              <div>
                <Input
                  label="Adresse Email"
                  type="email"
                  placeholder="votre@email.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              
              <div>
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 bg-gray-800 border-2 border-white/20 text-red-500 focus:ring-red-500" />
                  <span className="ml-2 text-sm text-white/60 font-light">Se souvenir de moi</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm font-light text-red-400 hover:text-red-300 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-4 bg-red-600 text-white font-black text-lg tracking-tight hover:bg-red-700 transition-colors"
              >
                SE CONNECTER
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-white/60 font-light">
                Vous n'avez pas de compte ?{' '}
                <Link href="/auth/register" className="font-black text-red-400 hover:text-red-300 transition-colors">
                  Créez-en un maintenant
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/40 font-light font-mono">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/conditions-generales" className="text-red-400 hover:text-red-300">Conditions d'utilisation</Link>
            {' '}et notre{' '}
            <Link href="/politique-de-confidentialite" className="text-red-400 hover:text-red-300">Politique de confidentialité</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
