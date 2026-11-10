import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import type { MentorProfile, User, WorkshopFormat } from '../../api/types';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { formatLabels } from '../../lib/format';

export function MentorProfileCard({ profile }: { profile: MentorProfile }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    headline: profile.headline,
    experience: profile.experience,
    yearsOfExperience: profile.yearsOfExperience,
    telegram: profile.telegram ?? '',
    formats: profile.formats,
  });

  const save = useMutation({
    mutationFn: () => usersApi.updateMentorProfile({ ...form, telegram: form.telegram.trim() || undefined }),
    onSuccess: (updated) =>
      queryClient.setQueryData<User>(['me'], (user) => (user ? { ...user, mentorProfile: updated } : user)),
  });

  const toggleFormat = (format: WorkshopFormat) =>
    setForm((f) => ({
      ...f,
      formats: f.formats.includes(format) ? f.formats.filter((x) => x !== format) : [...f.formats, format],
    }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-2xl flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
    >
      <div>
        <h2 className="text-lg font-bold">Профиль ментора</h2>
        <p className="mt-0.5 text-sm text-ink-600">Его видят студенты на странице каждого вашего воркшопа.</p>
      </div>
      <Input
        label="Кто вы"
        placeholder="Frontend-разработчик, 2 года в e-commerce"
        value={form.headline}
        onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
        required
      />
      <Textarea
        label="Опыт"
        placeholder="Где работали, что делали, чем можете поделиться"
        maxLength={1000}
        value={form.experience}
        onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Лет опыта"
          type="number"
          min={0}
          max={50}
          value={form.yearsOfExperience}
          onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: Number(e.target.value) }))}
        />
        <Input
          label="Telegram"
          placeholder="@username"
          value={form.telegram}
          onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Форматы проведения</span>
        <div className="flex gap-2">
          {(Object.keys(formatLabels) as WorkshopFormat[]).map((format) => (
            <Chip key={format} isActive={form.formats.includes(format)} onClick={() => toggleFormat(format)}>
              {formatLabels[format]}
            </Chip>
          ))}
        </div>
      </div>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
      {save.isSuccess && <Alert tone="success">Профиль ментора сохранён</Alert>}
      <Button type="submit" isLoading={save.isPending} className="self-start">
        Сохранить профиль
      </Button>
    </form>
  );
}