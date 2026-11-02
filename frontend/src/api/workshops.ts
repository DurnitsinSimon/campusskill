import { api } from "./client";
import type {
  Paginated,
  SkillCategory,
  SkillLevel,
  WorkshopFormat,
  WorkshopListItem,
  WorkshopDetails,
} from "./types";

export type WorkshopSort =
  | "date"
  | "rating"
  | "price_asc"
  | "price_desc"
  | "popular";

export interface WorkshopFilters {
  search?: string;
  category?: string;
  skills?: string[];
  format?: WorkshopFormat;
  level?: SkillLevel;
  price?: "free" | "paid";
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
  hasSeats?: boolean;
  sort?: WorkshopSort;
  page?: number;
}

function toQueryParams(filters: WorkshopFilters) {
  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) params[key] = value.join(",");
    } else {
      params[key] = value;
    }
  }
  return params;
}

export const workshopsApi = {
  list: (filters: WorkshopFilters) =>
    api
      .get<
        Paginated<WorkshopListItem>
      >("/workshops", { params: { ...toQueryParams(filters), limit: 9 } })
      .then((r) => r.data),
  categories: () =>
    api.get<SkillCategory[]>("/skills/categories").then((r) => r.data),
  bySlug: (slug: string) =>
    api.get<WorkshopDetails>(`/workshops/${slug}`).then((r) => r.data),
};
