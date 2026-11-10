import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { mentorApi } from '../../api/mentor';
import { workshopsApi } from '../../api/workshops';
import { getErrorMessage } from '../../api/client';
import type { MentorWorkshopDetails, SkillLevel, WorkshopFormat, WorkshopFormValues } from '../../api/types';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Chip } from '../../components/ui/Chip';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { formatLabels, levelLabels, toDateTimeLocal } from '../../lib/format';

const emptyForm: WorkshopFormValues = {
  title: '',
  shortDescription: '',
  description: '',
  requirements: '',
  format: 'OFFLINE',
  location: '',
  meetingUrl: '',
  level: 'BEGINNER',
  startsAt: '',
  durationMinutes: 120,
  capacity: 10,
  price: 0,
  skills: [],
  program: [{ title: '' }],
};

function toForm(workshop: MentorWorkshopDetails): WorkshopFormValues {
  return {
    title: workshop.title,
    shortDescription: workshop.shortDescription,
    description: workshop.description,
    requirements: workshop.requirements ?? '',
    format: workshop.format,
    location: workshop.location ?? '',
    meetingUrl: workshop.meetingUrl ?? '',
    level: workshop.level,
    startsAt: toDateTimeLocal(workshop.startsAt),
    durationMinutes: workshop.durationMinutes,
    capacity: workshop.capacity,
    price: workshop.price,
    skills: workshop.skills.map((skill) => skill.slug),
    program: workshop.programItems.map((item) => ({
      title: item.title,
      description: item.description ?? undefined,
      durationMinutes: item.durationMinutes ?? undefined,
    })),
  };
}

function toPayload(form: WorkshopFormValues): WorkshopFormValues {
  const optional = (value?: string) => value?.trim() || undefined;
  return {
    ...form,
    requirements: optional(form.requirements),
    location: form.format === 'OFFLINE' ? optional(form.location) : undefined,
    meetingUrl: form.format === 'ONLINE' ? optional(form.meetingUrl) : undefined,
    startsAt: new Date(form.startsAt).toISOString(),
    program: form.program
      .filter((item) => item.title.trim())
      .map((item) => ({ ...item, title: item.title.trim(), description: optional(item.description) })),
  };
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function WorkshopFormPage() {
  const { id } = useParams();
  const workshopId = id ? Number(id) : undefined;
  const isEdit = workshopId !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkshopFormValues>(emptyForm);
  const [showSkillsError, setShowSkillsError] = useState(false);

  const existing = useQuery({
    queryKey: ['mentor-workshop', workshopId],
    queryFn: () => mentorApi.workshop(workshopId!),
    enabled: isEdit,
  });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: workshopsApi.categories });

  useEffect(() => {
    if (existing.data) setForm(toForm(existing.data));
  }, [existing.data]);

  const save = useMutation({
    mutationFn: (values: WorkshopFormValues) =>
      isEdit ? mentorApi.update(workshopId!, values) : mentorApi.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mentor-workshops'] });
      await queryClient.invalidateQueries({ queryKey: ['mentor-workshop', workshopId] });
      navigate('/me?tab=workshops');
    },
  });

  const set = <K extends keyof WorkshopFormValues>(key: K, value: WorkshopFormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleSkill = (slug: string) =>
    set('skills', form.skills.includes(slug) ? form.skills.filter((s) => s !== slug) : [...form.skills, slug]);

  const updateItem = (index: number, patch: Partial<WorkshopFormValues['program'][number]>) =>
    set(
      'program',
      form.program.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...form.program];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    set('program', next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.skills.length === 0) {
      setShowSkillsError(true);
      return;
    }
    save.mutate(toPayload(form));
  };

  if (isEdit && existing.isPending) return <Spinner />;
  if (isEdit && existing.isError) return <Alert>{getErrorMessage(existing.error)}</Alert>;

  const programMinutes = form.program.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0);

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <ButtonLink to="/me?tab=workshops" variant="ghost" size="sm" className="-ml-3 self-start">
        <ArrowLeft className="size-4" /> Мои воркшопы
      </ButtonLink>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{isEdit ? 'Редактирование воркшопа' : 'Новый воркшоп'}</h1>
        <p className="mt-1 text-ink-600">
          Воркшоп сохранится как черновик. Когда всё будет готово — отправьте его на модерацию.
        </p>
      </div>

      <Card title="Основное">
        <Input
          label="Название"
          maxLength={120}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
        <Input
          label="Коротко"
          hint="Одно предложение для карточки в каталоге"
          maxLength={200}
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
          required
        />
        <Textarea
          label="Подробное описание"
          hint="Что участники узнают и что сделают на воркшопе — не меньше 30 символов"
          rows={5}
          maxLength={3000}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          required
        />
        <Input
          label="Что понадобится"
          placeholder="Ноутбук с установленным Node.js 20+"
          value={form.requirements ?? ''}
          onChange={(e) => set('requirements', e.target.value)}
        />
      </Card>

      <Card title="Навыки" hint="Первый выбранный навык станет основным — по нему воркшоп попадёт в фильтры">
        {categories.map((category) => (
          <div key={category.slug} className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-wide text-ink-400 uppercase">
              {category.icon} {category.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => {
                const index = form.skills.indexOf(skill.slug);
                return (
                  <Chip key={skill.slug} isActive={index >= 0} onClick={() => toggleSkill(skill.slug)}>
                    {skill.name}
                    {index === 0 && <span className="text-xs opacity-80">· основной</span>}
                  </Chip>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <Card title="Когда и где">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(formatLabels) as WorkshopFormat[]).map((format) => (
            <Chip key={format} isActive={form.format === format} onClick={() => set('format', format)}>
              {formatLabels[format]}
            </Chip>
          ))}
        </div>
        {form.format === 'OFFLINE' ? (
          <Input
            label="Место проведения"
            placeholder="Главный учебный корпус, ауд. 412"
            value={form.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
          />
        ) : (
          <Input
            label="Ссылка на встречу"
            type="url"
            placeholder="https://telemost.yandex.ru/j/…"
            hint="Её увидят только подтверждённые участники"
            value={form.meetingUrl ?? ''}
            onChange={(e) => set('meetingUrl', e.target.value)}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Дата и время начала"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            required
          />
          <Input
            label="Длительность, минут"
            type="number"
            min={30}
            max={480}
            step={15}
            value={form.durationMinutes}
            onChange={(e) => set('durationMinutes', Number(e.target.value))}
            hint={programMinutes ? `По программе: ${programMinutes} мин` : undefined}
            required
          />
        </div>
      </Card>

      <Card title="Участники и стоимость">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Максимум участников"
            type="number"
            min={1}
            max={200}
            value={form.capacity}
            onChange={(e) => set('capacity', Number(e.target.value))}
            required
          />
          <Input
            label="Стоимость, ₽"
            type="number"
            min={0}
            step={50}
            hint="0 — бесплатно"
            value={form.price}
            onChange={(e) => set('price', Number(e.target.value))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Уровень подготовки</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(levelLabels) as SkillLevel[]).map((level) => (
              <Chip key={level} isActive={form.level === level} onClick={() => set('level', level)}>
                {levelLabels[level]}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Программа" hint="Этапы воркшопа по порядку">
        <ol className="flex flex-col gap-3">
          {form.program.map((item, index) => (
            <li key={index} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="mt-8 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {index + 1}
              </span>
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_120px]">
                <Input
                  label="Этап"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  required={index === 0}
                />
                <Input
                  label="Минут"
                  type="number"
                  min={5}
                  value={item.durationMinutes ?? ''}
                  onChange={(e) =>
                    updateItem(index, { durationMinutes: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="mt-7 flex flex-col">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  className="rounded-lg p-1 text-ink-400 hover:bg-white disabled:opacity-30"
                  aria-label="Выше"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === form.program.length - 1}
                  onClick={() => moveItem(index, 1)}
                  className="rounded-lg p-1 text-ink-400 hover:bg-white disabled:opacity-30"
                  aria-label="Ниже"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={form.program.length === 1}
                  onClick={() =>
                    set(
                      'program',
                      form.program.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-red-600 disabled:opacity-30"
                  aria-label="Удалить этап"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => set('program', [...form.program, { title: '' }])}
        >
          <Plus className="size-4" /> Добавить этап
        </Button>
      </Card>

      {showSkillsError && form.skills.length === 0 && <Alert>Выберите хотя бы один навык</Alert>}
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" isLoading={save.isPending}>
          {isEdit ? 'Сохранить изменения' : 'Создать черновик'}
        </Button>
        <ButtonLink to="/me?tab=workshops" variant="secondary" size="lg">
          Отмена
        </ButtonLink>
      </div>
    </form>
  );
}