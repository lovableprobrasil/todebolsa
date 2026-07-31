/**
 * Imagens ilustrativas por área/curso usadas nos cartões de curso da home.
 * Mapeamento determinístico por palavra-chave, com fallback por hash do nome.
 */
const KEYWORD_IMAGES: { match: RegExp; url: string }[] = [
  { match: /(sistemas|computa|software|dados|ti\b|inform)/i, url: "photo-1517430816045-df4b7de11d1d" },
  { match: /(direito|jur)/i, url: "photo-1589829545856-d10d557cf95f" },
  { match: /(administra|gest|neg[oó]cio|rh|recursos humanos)/i, url: "photo-1454165804606-c3d57bc86b40" },
  { match: /(veterin|animal)/i, url: "photo-1583337130417-3346a1be7dee" },
  { match: /(psicolog)/i, url: "photo-1573497019940-1c28c88b4f3e" },
  { match: /(enfermagem|sa[uú]de|medicina|biomedic|farm[aá]c)/i, url: "photo-1576091160550-2173dba999ef" },
  { match: /(fisioterap|educa[cç][aã]o f[ií]sica|esporte)/i, url: "photo-1571019613454-1cb2f99b2d8b" },
  { match: /(nutri|gastronom|culin)/i, url: "photo-1490645935967-10de6ba17061" },
  { match: /(cont[aá]beis|financ|economia)/i, url: "photo-1554224155-6726b3ff858f" },
  { match: /(pedagog|educa|licenciat|professor)/i, url: "photo-1509062522246-3755977927d7" },
  { match: /(engenhar|mec[aâ]nic|el[eé]tric|civil)/i, url: "photo-1581091226825-a6a2a5aee158" },
  { match: /(marketing|publicidade|comunica|jornal)/i, url: "photo-1460925895917-afdab827c52f" },
  { match: /(design|arte|moda|arquitet)/i, url: "photo-1558655146-9f40138edfeb" },
  { match: /(ingl[eê]s|espanhol|idioma|l[ií]ngua)/i, url: "photo-1543165365-07be49947ba7" },
  { match: /(log[ií]stic|transporte)/i, url: "photo-1553413077-190dd305871c" },
  { match: /(seguran[cç]a|vigilan|porteiro)/i, url: "photo-1553456558-aff63285bdd1" },
];

const FALLBACKS = [
  "photo-1523050854058-8df90110c9f1",
  "photo-1503676260728-1c00da094a0b",
  "photo-1524178232363-1fb2b075b655",
  "photo-1427504494785-3a9ca7044f45",
  "photo-1522202176988-66273c2fd55f",
];

export function courseImage(name: string, width = 480): string {
  const hit = KEYWORD_IMAGES.find((k) => k.match.test(name));
  let id = hit?.url;
  if (!id) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    id = FALLBACKS[h % FALLBACKS.length];
  }
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=70&w=${width}`;
}
