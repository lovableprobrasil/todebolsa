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

export type SearchFilters = {
  level?: string;
  query?: string;
  city?: string;
  modality?: string;
  minDiscount?: number;
  featuredOnly?: boolean;
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
  if (filters.level) q = q.eq("course_offering.course.level", filters.level);
  if (filters.modality) q = q.eq("course_offering.course.modality", filters.modality);
  if (filters.city) q = q.ilike("course_offering.institution_unit.city", `%${filters.city}%`);
  if (filters.query) q = q.ilike("course_offering.course.name", `%${filters.query}%`);

  q = q.order("is_featured", { ascending: false }).order("discount_value", { ascending: false });
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ScholarshipListItem[];
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
