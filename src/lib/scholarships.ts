import { supabase } from "@/integrations/supabase/client";

export type ScholarshipListItem = {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
  price_with_scholarship: number;
  is_featured: boolean;
  rules: string | null;
  course_offering: {
    id: string;
    vacancies_available: number;
    status: string;
    institution_unit: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
    course: {
      id: string;
      slug: string;
      name: string;
      level: string;
      modality: string;
      shift: string;
      duration_months: number | null;
      original_price: number;
      description: string | null;
      institution: {
        id: string;
        slug: string;
        trade_name: string;
        logo_url: string | null;
        rating: number | null;
      };
    };
  };
};

const SCHOLARSHIP_SELECT = `
  id, title, discount_type, discount_value, price_with_scholarship, is_featured, rules,
  course_offering:course_offerings!inner (
    id, vacancies_available, status,
    institution_unit:institution_units!inner ( id, name, city, state ),
    course:courses!inner (
      id, slug, name, level, modality, shift, duration_months, original_price, description,
      institution:institutions!inner ( id, slug, trade_name, logo_url, rating )
    )
  )
`;

export type SortMode = "relevance" | "discount-desc" | "price-asc" | "price-desc" | "recent";

export type SearchFilters = {
  level?: string;
  query?: string;
  city?: string;
  state?: string;
  modality?: string;
  minDiscount?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
  sort?: SortMode;
  limit?: number;
};

export async function listScholarships(filters: SearchFilters = {}): Promise<ScholarshipListItem[]> {
  let q = supabase
    .from("scholarships")
    .select(SCHOLARSHIP_SELECT)
    .eq("is_active", true)
    .eq("course_offering.status", "ACTIVE")
    .gt("course_offering.vacancies_available", 0);

  if (filters.featuredOnly) q = q.eq("is_featured", true);
  if (filters.minDiscount) q = q.gte("discount_value", filters.minDiscount);
  if (filters.maxPrice) q = q.lte("price_with_scholarship", filters.maxPrice);
  if (filters.level) q = q.eq("course_offering.course.level", filters.level);
  if (filters.modality) q = q.eq("course_offering.course.modality", filters.modality);
  if (filters.city) q = q.ilike("course_offering.institution_unit.city", `%${filters.city}%`);
  if (filters.state) q = q.eq("course_offering.institution_unit.state", filters.state);
  if (filters.query) q = q.ilike("course_offering.course.name", `%${filters.query}%`);

  switch (filters.sort) {
    case "price-asc":
      q = q.order("price_with_scholarship", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price_with_scholarship", { ascending: false });
      break;
    case "discount-desc":
      q = q.order("discount_value", { ascending: false });
      break;
    case "recent":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("discount_value", { ascending: false });
  }
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ScholarshipListItem[];
}

// Personalized recommendations: similar level/city to user favorites
export async function recommendScholarships(userId: string, limit = 6): Promise<ScholarshipListItem[]> {
  const { data: favs } = await supabase
    .from("favorites")
    .select("scholarship_id")
    .eq("user_id", userId)
    .limit(20);

  const favIds = (favs ?? []).map((f) => f.scholarship_id);
  if (favIds.length === 0) {
    return listScholarships({ featuredOnly: true, limit });
  }

  const { data: seeds } = await supabase
    .from("scholarships")
    .select("course_offering:course_offerings!inner(course:courses!inner(level), institution_unit:institution_units!inner(city))")
    .in("id", favIds);

  const levels = new Set<string>();
  const cities = new Set<string>();
  for (const s of (seeds ?? []) as Array<{ course_offering: { course: { level: string }; institution_unit: { city: string } } }>) {
    if (s.course_offering?.course?.level) levels.add(s.course_offering.course.level);
    if (s.course_offering?.institution_unit?.city) cities.add(s.course_offering.institution_unit.city);
  }

  const level = Array.from(levels)[0];
  const city = Array.from(cities)[0];

  let q = supabase
    .from("scholarships")
    .select(SCHOLARSHIP_SELECT)
    .eq("is_active", true)
    .not("id", "in", `(${favIds.join(",")})`)
    .limit(limit);
  if (level) q = q.eq("course_offering.course.level", level);
  if (city) q = q.ilike("course_offering.institution_unit.city", `%${city}%`);
  q = q.order("discount_value", { ascending: false });

  const { data } = await q;
  if (!data || data.length === 0) {
    return listScholarships({ featuredOnly: true, limit });
  }
  return data as unknown as ScholarshipListItem[];
}

export async function getScholarship(id: string): Promise<ScholarshipListItem | null> {
  const { data, error } = await supabase
    .from("scholarships")
    .select(SCHOLARSHIP_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ScholarshipListItem) ?? null;
}

export async function listScholarshipsByIds(ids: string[]): Promise<ScholarshipListItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("scholarships")
    .select(SCHOLARSHIP_SELECT)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as unknown as ScholarshipListItem[];
}

export async function listFeaturedInstitutions() {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, slug, trade_name, logo_url, rating, description")
    .eq("status", "APPROVED")
    .eq("is_featured", true)
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function getInstitutionBySlug(slug: string) {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("slug", slug)
    .eq("status", "APPROVED")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listFaqs() {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}
