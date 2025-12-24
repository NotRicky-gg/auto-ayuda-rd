import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

const signInSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(1, 'Ingresa tu contraseña').max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = forgotPasswordSchema.parse({ email: formData.email });
      
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: 'https://chequealord.netlify.app/reset-password',
      });

      if (error) throw error;

      toast({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
      setIsForgotPassword(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo enviar el correo. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const validated = signUpSchema.parse(formData);
        
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: validated.name,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Usuario ya registrado',
              description: 'Este email ya está registrado. Intenta iniciar sesión.',
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: '¡Cuenta creada!',
            description: 'Revisa tu email para confirmar tu cuenta o inicia sesión directamente.',
          });
          navigate('/');
        }
      } else {
        const validated = signInSchema.parse(formData);
        
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast({
              title: 'Credenciales inválidas',
              description: 'Email o contraseña incorrectos.',
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente.',
          });
          navigate('/');
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Algo salió mal. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white mb-6 -ml-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-orange rounded-lg">
              <Zap className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              CHEQUÉALO RD
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {isForgotPassword 
              ? 'Recuperar contraseña' 
              : isSignUp 
              ? 'Crear cuenta' 
              : 'Iniciar sesión'}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isForgotPassword
              ? 'Ingresa tu email para recibir un enlace de recuperación'
              : isSignUp
              ? 'Regístrate para dejar reseñas de talleres'
              : 'Ingresa para compartir tu experiencia'}
          </p>

          {/* Forgot Password Form */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10 h-12 bg-muted border-border"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-orange hover:bg-orange-light text-white font-semibold text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-orange hover:text-orange-light font-semibold"
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Nombre
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Tu nombre"
                        className="pl-10 h-12 bg-muted border-border"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 h-12 bg-muted border-border"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">
                      Contraseña
                    </Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-orange hover:text-orange-light"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                      className="pl-10 pr-10 h-12 bg-muted border-border"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange hover:bg-orange-light text-white font-semibold text-base"
                  disabled={loading}
                >
                  {loading
                    ? 'Cargando...'
                    : isSignUp
                    ? 'Crear cuenta'
                    : 'Iniciar sesión'}
                </Button>
              </form>

              {/* Toggle */}
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-orange hover:text-orange-light font-semibold ml-2"
                  >
                    {isSignUp ? 'Iniciar sesión' : 'Regístrate'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
