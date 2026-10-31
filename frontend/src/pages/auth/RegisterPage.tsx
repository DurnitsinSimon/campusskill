import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap, Presentation } from 'lucide-react';
import { authApi, type RegisterPayload } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { cn } from '../../lib/cn';
import { AuthCard } from './AuthCard';

const roles = [
  {
    value: 'PARTICIPANT',
    title: 'Хочу учиться',
    description: 'Записываться на воркшопы',
    icon: GraduationCap,
  },
  {
    value: 'MENTOR',
    title: 'Хочу учить',
    description: 'Проводить свои воркшопы',
    icon: Presentation,
  },
] as const;

export function RegisterPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'PARTICIPANT',
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      signIn(response);
      navigate('/', { replace: true });
    },
  });

  if (user) return <Navigate to="/" replace />;

  const update = (field: keyof RegisterPayload) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate(form);
  };

  return (
    <AuthCard
      title="Регистрация"
      subtitle="Учитесь у однокурсников или делитесь своими навыками."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {register.isError && <Alert>{getErrorMessage(register.error)}</Alert>}

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="mb-1.5 text-sm font-semibold">Кем вы будете на платформе?</legend>
          {roles.map(({ value, title, description, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-2xl p-3.5 ring-1 transition-colors',
                form.role === value ? 'bg-brand-50 ring-2 ring-brand-500' : 'ring-slate-300 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={form.role === value}
                onChange={update('role')}
                className="sr-only"
              />
              <Icon className={cn('size-5', form.role === value ? 'text-brand-600' : 'text-ink-400')} />
              <span className="text-sm font-bold">{title}</span>
              <span className="text-xs text-ink-600">{description}</span>
            </label>
          ))}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Имя" autoComplete="given-name" value={form.firstName} onChange={update('firstName')} required />
          <Input label="Фамилия" autoComplete="family-name" value={form.lastName} onChange={update('lastName')} required />
        </div>
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          hint="Не меньше 8 символов"
          minLength={8}
          value={form.password}
          onChange={update('password')}
          required
        />
        <Button type="submit" size="lg" isLoading={register.isPending} className="mt-2">
          Создать аккаунт
        </Button>
      </form>
    </AuthCard>
  );
}