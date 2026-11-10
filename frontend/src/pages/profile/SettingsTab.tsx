import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type ProfilePayload } from "../../api/users";
import { getErrorMessage } from "../../api/client";
import type { User } from "../../api/types";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { MentorProfileCard } from "../mentor/MentorProfileCard";

const courseOptions = [
  { value: "", label: "Не указан" },
  ...[1, 2, 3, 4, 5, 6].map((course) => ({
    value: String(course),
    label: `${course} курс`,
  })),
];

const reminderOptions = [
  { value: "1", label: "За 1 час" },
  { value: "3", label: "За 3 часа" },
  { value: "12", label: "За 12 часов" },
  { value: "24", label: "За сутки" },
  { value: "48", label: "За двое суток" },
];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsTab({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfilePayload>({
    firstName: user.firstName,
    lastName: user.lastName,
    university: user.university ?? "",
    course: user.course,
    bio: user.bio ?? "",
    emailNotifications: user.emailNotifications,
    reminderHoursBefore: user.reminderHoursBefore,
  });

  const save = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updated) => queryClient.setQueryData(["me"], updated),
  });

  const set = <K extends keyof ProfilePayload>(
    key: K,
    value: ProfilePayload[K],
  ) => {
    save.reset();
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({
      ...form,
      university: form.university?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
      course: form.course ?? undefined,
    });
  };

  return (
    <div>
      {user.mentorProfile && <MentorProfileCard profile={user.mentorProfile} />}
      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
        <Card title="Профиль">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Имя"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              required
            />
            <Input
              label="Фамилия"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Input
              label="Институт и направление"
              placeholder="ИРИТ-РТФ, Прикладная информатика"
              value={form.university ?? ""}
              onChange={(e) => set("university", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Курс</span>
              <Select
                options={courseOptions}
                value={form.course ? String(form.course) : ""}
                onChange={(e) =>
                  set("course", e.target.value ? Number(e.target.value) : null)
                }
                aria-label="Курс"
              />
            </div>
          </div>
          <Textarea
            label="О себе"
            placeholder="Чем увлекаетесь, чему хотите научиться"
            maxLength={500}
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Card>

        <Card title="Уведомления">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Напоминать о воркшопе</span>
            <Select
              className="sm:max-w-xs"
              options={reminderOptions}
              value={String(form.reminderHoursBefore)}
              onChange={(e) =>
                set("reminderHoursBefore", Number(e.target.value))
              }
              aria-label="Когда напоминать о воркшопе"
            />
            <p className="text-xs text-ink-400">Применяется к новым записям</p>
          </div>
        </Card>

        {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
        {save.isSuccess && <Alert tone="success">Изменения сохранены</Alert>}

        <Button
          type="submit"
          size="lg"
          isLoading={save.isPending}
          className="self-start"
        >
          Сохранить
        </Button>
      </form>
    </div>
  );
}
