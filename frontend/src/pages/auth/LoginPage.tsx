import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { AuthCard } from './AuthCard';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      signIn(response);
      navigate(from, { replace: true });
    },
  });

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <AuthCard
      title="Вход"
      subtitle="Рады видеть снова! Войдите, чтобы записываться на воркшопы."
      footer={
        <>
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {login.isError && <Alert>{getErrorMessage(login.error)}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ivan.smirnov@campus.example"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" size="lg" isLoading={login.isPending} className="mt-2">
          Войти
        </Button>
      </form>
    </AuthCard>
  );
}