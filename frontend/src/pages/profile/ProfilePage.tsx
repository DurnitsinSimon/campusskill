import { useSearchParams } from "react-router";
import {
  Bell,
  CalendarDays,
  MessageSquareText,
  Presentation,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../../components/ui/Avatar";
import { cn } from "../../lib/cn";
import { EnrollmentsTab } from "./EnrollmentsTab";
import { ProgressTab } from "./ProgressTab";
import { NotificationsTab } from "./NotificationsTab";
import { SettingsTab } from "./SettingsTab";
import { MentorWorkshopsTab } from "../mentor/MentorWorkshopTab";
import { MentorReviewsTab } from "../mentor/MentorReviewsTab";

type TabId =
  | "workshops"
  | "reviews"
  | "enrollments"
  | "progress"
  | "notifications"
  | "settings";

// вкладки ментора; ментор тоже студент, поэтому остальные вкладки у него тоже есть
const mentorTabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "workshops", label: "Мои воркшопы", icon: Presentation },
  { id: "reviews", label: "Отзывы обо мне", icon: MessageSquareText },
];

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "enrollments", label: "Мои записи", icon: CalendarDays },
  { id: "progress", label: "Прогресс", icon: TrendingUp },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "settings", label: "Настройки", icon: Settings },
];

export function ProfilePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  if (!user) return null;

  const isMentor = user.role === "MENTOR";
  const visibleTabs = isMentor ? [...mentorTabs, ...tabs] : tabs;
  const active =
    (params.get("tab") as TabId) ?? (isMentor ? "workshops" : "enrollments");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          src={user.avatarUrl}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="truncate text-sm text-ink-600">
            {user.university ?? user.email}
          </p>
        </div>
      </div>

      <nav
        className="-mx-4 overflow-x-auto px-4"
        aria-label="Разделы личного кабинета"
      >
        <div className="flex w-max gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setParams({ tab: id })}
              aria-current={active === id ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                active === id
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {active === "workshops" && isMentor && <MentorWorkshopsTab />}
      {active === "reviews" && isMentor && <MentorReviewsTab />}
      {active === "enrollments" && <EnrollmentsTab />}
      {active === "progress" && <ProgressTab />}
      {active === "notifications" && <NotificationsTab />}
      {active === "settings" && <SettingsTab user={user} />}
    </div>
  );
}
