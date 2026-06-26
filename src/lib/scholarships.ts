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
        rating_avg: number | null;
        rating_count: number | null;
      };
    };
  };
};

const SCHOLARSHIP_SELECT = `
  id, title, discount_type, discount_value, price_with_scholarship, is_featured, rules, created_at,
  course_offering:course_offerings!inner (
    id, vacancies_available, status,
    institution_unit:institution_units!inner ( id, name, city, state ),
    course:courses!inner (
      id, slug, name, level, modality, shift, duration_months, original_price, description,
      institution:institutions!inner ( id, slug, trade_name, logo_url, rating, rating_avg, rating_count )
    )
  )
`;


export type SortMode =
  | "relevance"
  | "discount-desc"
  | "price-asc"
  | "price-desc"
  | "recent"
  | "best-rated"
  | "most-rated";

export type SearchFilters = {
  level?: string;
  query?: string;
  city?: string;
  state?: string;
  modality?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  featuredOnly?: boolean;
  institutionId?: string;
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
  if (filters.institutionId) q = q.eq("course_offering.course.institution.id", filters.institutionId);

  // Busca textual ampliada: curso, instituição, cidade
  if (filters.query) {
    const term = filters.query.trim();
    if (term) {
      q = q.or(
        `name.ilike.%${term}%,description.ilike.%${term}%`,
        { foreignTable: "course_offerings.course" },
      );
    }
  }

  // Ordenação server-side para os modos diretos.
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
    case "best-rated":
    case "most-rated":
    case "relevance":
    default:
      q = q.order("is_featured", { ascending: false }).order("discount_value", { ascending: false });
  }
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as unknown as ScholarshipListItem[];

  // Filtro de avaliação e ordenações compostas aplicadas em memória
  if (filters.minRating && filters.minRating > 0) {
    rows = rows.filter(
      (r) => Number(r.course_offering.course.institution.rating_avg ?? 0) >= filters.minRating!,
    );
  }

  if (filters.sort === "best-rated") {
    rows = [...rows].sort((a, b) => {
      const ra = Number(a.course_offering.course.institution.rating_avg ?? 0);
      const rb = Number(b.course_offering.course.institution.rating_avg ?? 0);
      if (rb !== ra) return rb - ra;
      return Number(b.discount_value) - Number(a.discount_value);
    });
  } else if (filters.sort === "most-rated") {
    rows = [...rows].sort((a, b) => {
      const ca = Number(a.course_offering.course.institution.rating_count ?? 0);
      const cb = Number(b.course_offering.course.institution.rating_count ?? 0);
      if (cb !== ca) return cb - ca;
      return Number(b.discount_value) - Number(a.discount_value);
    });
  } else if (filters.sort === "relevance" || !filters.sort) {
    // Ranqueamento composto: avaliação + popularidade + desconto + destaque
    const maxCount = Math.max(
      1,
      ...rows.map((r) => Number(r.course_offering.course.institution.rating_count ?? 0)),
    );
    rows = [...rows]
      .map((r) => {
        const rating = Number(r.course_offering.course.institution.rating_avg ?? 0);
        const count = Number(r.course_offering.course.institution.rating_count ?? 0);
        const discount = Number(r.discount_value) || 0;
        const featured = r.is_featured ? 1 : 0;
        const score =
          (rating / 5) * 0.35 +
          (count / maxCount) * 0.2 +
          (Math.min(discount, 90) / 90) * 0.3 +
          featured * 0.15;
        return { r, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  }

  return rows;
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

export async function listInstitutionsLite() {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, trade_name")
    .eq("status", "APPROVED")
    .order("trade_name");
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

export type PlatformStats = {
  institutions: number;
  scholarships: number;
  vacancies: number;
  maxDiscount: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const [{ count: instCount }, schRes, offRes] = await Promise.all([
    supabase
      .from("institutions")
      .select("id", { count: "exact", head: true })
      .eq("status", "APPROVED"),
    supabase
      .from("scholarships")
      .select("price_with_scholarship, course_offering:course_offerings!inner(status, course:courses!inner(original_price))")
      .eq("is_active", true),
    supabase
      .from("course_offerings")
      .select("vacancies_available")
      .eq("status", "ACTIVE"),
  ]);

  type SchRow = {
    price_with_scholarship: number;
    course_offering: { status: string; course: { original_price: number } } | null;
  };
  const scholarships = ((schRes.data ?? []) as unknown as SchRow[]).filter(
    (s) => s.course_offering?.status === "ACTIVE",
  );
  const vacancies = (offRes.data ?? []).reduce(
    (acc, o) => acc + (Number(o.vacancies_available) || 0),
    0,
  );
  let maxDiscount = 0;
  for (const s of scholarships) {
    const original = Number(s.course_offering?.course?.original_price) || 0;
    const final = Number(s.price_with_scholarship) || 0;
    const pct = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
    if (pct > maxDiscount) maxDiscount = pct;
  }
  return {
    institutions: instCount ?? 0,
    scholarships: scholarships.length,
    vacancies,
    maxDiscount,
  };
}

export type InstitutionOffer = {
  id: string;
  slug: string;
  trade_name: string;
  logo_url: string | null;
  rating: number | null;
  bestDiscount: number;
  minPrice: number;
  scholarshipCount: number;
};

export async function listInstitutionsBestOffer(limit = 10): Promise<InstitutionOffer[]> {
  const all = await listScholarships({ limit: 500 });
  const map = new Map<string, InstitutionOffer>();
  for (const s of all) {
    const inst = s.course_offering.course.institution;
    const original = Number(s.course_offering.course.original_price) || 0;
    const final = Number(s.price_with_scholarship) || 0;
    const discount = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
    const cur = map.get(inst.id);
    if (!cur) {
      map.set(inst.id, {
        id: inst.id,
        slug: inst.slug,
        trade_name: inst.trade_name,
        logo_url: inst.logo_url,
        rating: inst.rating,
        bestDiscount: discount,
        minPrice: final,
        scholarshipCount: 1,
      });
    } else {
      cur.bestDiscount = Math.max(cur.bestDiscount, discount);
      cur.minPrice = Math.min(cur.minPrice, final);
      cur.scholarshipCount += 1;
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.bestDiscount - a.bestDiscount || a.minPrice - b.minPrice)
    .slice(0, limit);
}

export type CourseOffer = {
  name: string;
  level: string;
  bestDiscount: number;
  minPrice: number;
  scholarshipCount: number;
  cities: string[];
};

export async function listCoursesBestOffer(limit = 10, city?: string): Promise<CourseOffer[]> {
  const all = await listScholarships({ limit: 500, city });
  const map = new Map<string, CourseOffer>();
  for (const s of all) {
    const course = s.course_offering.course;
    const unit = s.course_offering.institution_unit;
    const original = Number(course.original_price) || 0;
    const final = Number(s.price_with_scholarship) || 0;
    const discount = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
    const key = course.name.trim().toUpperCase();
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        name: course.name,
        level: course.level,
        bestDiscount: discount,
        minPrice: final,
        scholarshipCount: 1,
        cities: unit?.city ? [unit.city] : [],
      });
    } else {
      cur.bestDiscount = Math.max(cur.bestDiscount, discount);
      cur.minPrice = Math.min(cur.minPrice, final);
      cur.scholarshipCount += 1;
      if (unit?.city && !cur.cities.includes(unit.city)) cur.cities.push(unit.city);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.scholarshipCount - a.scholarshipCount || b.bestDiscount - a.bestDiscount)
    .slice(0, limit);
}

