export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return BRL.format(n);
}

export function discountPercent(original: number, withScholarship: number): number {
  if (!original || original <= 0) return 0;
  return Math.round(((original - withScholarship) / original) * 100);
}

export const COURSE_LEVEL_LABEL: Record<string, string> = {
  FUNDAMENTAL: "Ensino Fundamental",
  MEDIO: "Ensino Médio",
  TECNICO: "Curso Técnico",
  IDIOMAS: "Idiomas",
  PROFISSIONALIZANTE: "Profissionalizante",
  CURSO_LIVRE: "Curso Livre",
  PREPARATORIO: "Preparatório",
  EJA: "EJA",
  PRE_VESTIBULAR: "Pré-Vestibular",
  GRADUACAO: "Graduação",
  POS_GRADUACAO: "Pós-Graduação",
  MBA: "MBA",
  MESTRADO: "Mestrado",
};

export const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  SEMIPRESENCIAL: "Semipresencial",
  EAD: "EAD",
};

export const SHIFT_LABEL: Record<string, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
  INTEGRAL: "Integral",
  FLEXIVEL: "Flexível",
};

export const CATEGORIES = [
  { slug: "GRADUACAO", label: "Graduação", icon: "GraduationCap", placeholder: "Digite o curso de graduação desejado" },
  { slug: "POS_GRADUACAO", label: "Pós-Graduação", icon: "Award", placeholder: "Digite a pós-graduação desejada" },
  { slug: "TECNICO", label: "Curso Técnico", icon: "Wrench", placeholder: "Digite o curso técnico desejado" },
  { slug: "ESCOLAS", label: "Escolas", icon: "School", placeholder: "Digite a série, segmento ou nome da escola" },
  { slug: "PROFISSIONALIZANTE", label: "Profissionalizantes", icon: "Briefcase", placeholder: "Digite o curso profissionalizante" },
  { slug: "EJA", label: "EJA", icon: "BookOpen", placeholder: "Digite a modalidade EJA desejada" },
  { slug: "CURSO_LIVRE", label: "Cursos Livres", icon: "Sparkles", placeholder: "Digite o curso livre desejado" },
  { slug: "IDIOMAS", label: "Idiomas", icon: "Languages", placeholder: "Digite o idioma desejado" },
  { slug: "OUTROS", label: "Outros Cursos", icon: "Target", placeholder: "Digite o preparatório ou curso desejado" },
] as const;

export const KNOWLEDGE_AREAS = [
  { slug: "SAUDE", label: "Saúde e Bem-estar" },
  { slug: "TECNOLOGIA", label: "Tecnologia e Computação" },
  { slug: "NEGOCIOS", label: "Negócios e Gestão" },
  { slug: "ENGENHARIAS", label: "Engenharias" },
  { slug: "DIREITO", label: "Direito e Ciências Jurídicas" },
  { slug: "EDUCACAO", label: "Educação e Licenciaturas" },
  { slug: "COMUNICACAO", label: "Comunicação e Marketing" },
  { slug: "ARTES", label: "Artes e Design" },
  { slug: "CIENCIAS_HUMANAS", label: "Ciências Humanas e Sociais" },
  { slug: "CIENCIAS_EXATAS", label: "Ciências Exatas e Naturais" },
  { slug: "AGRARIAS", label: "Ciências Agrárias e Ambientais" },
  { slug: "GASTRONOMIA", label: "Gastronomia e Hotelaria" },
  { slug: "IDIOMAS_AREA", label: "Idiomas" },
  { slug: "CONCURSOS", label: "Concursos e Preparatórios" },
  { slug: "OUTROS", label: "Outras áreas" },
] as const;

export const AREA_LABEL: Record<string, string> = Object.fromEntries(
  KNOWLEDGE_AREAS.map((a) => [a.slug, a.label]),
);
