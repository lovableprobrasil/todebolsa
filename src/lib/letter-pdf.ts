import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export type LetterData = {
  unique_code: string;
  issued_at: string;
  expires_at: string;
  student_name: string;
  student_cpf?: string | null;
  reservation_code: string;
  scholarship_title: string;
  course_name: string;
  institution_trade_name: string;
  institution_cnpj?: string | null;
  unit_name?: string | null;
  unit_city?: string | null;
  unit_state?: string | null;
  discount_percent?: number | null;
  monthly_original?: number | null;
  monthly_with_scholarship?: number | null;
  required_documents?: string[] | null;
  rules?: string | null;
};

const brl = (v?: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dt = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

export async function downloadScholarshipLetterPdf(data: LetterData) {
  const validateUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/validar-carta/${data.unique_code}`
      : `https://todebolsa.com.br/validar-carta/${data.unique_code}`;
  const qrDataUrl = await QRCode.toDataURL(validateUrl, { margin: 1, width: 220 });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Tô de Bolsa", 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Carta de Apresentação da Bolsa", 40, 70);

  doc.setTextColor(15, 23, 42);
  y = 130;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Código: ${data.unique_code}`, 40, y);
  doc.addImage(qrDataUrl, "PNG", W - 130, 100, 90, 90);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Emitida em: ${dt(data.issued_at)}   ·   Validade: ${dt(data.expires_at)}`, 40, y);
  y += 24;

  // Dados do aluno
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Dados do estudante", 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Nome: ${data.student_name}`, 40, y); y += 14;
  if (data.student_cpf) { doc.text(`CPF: ${data.student_cpf}`, 40, y); y += 14; }
  doc.text(`Código da reserva: ${data.reservation_code}`, 40, y); y += 22;

  // Dados da bolsa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Bolsa contratada", 40, y); y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Instituição: ${data.institution_trade_name}`, 40, y); y += 14;
  if (data.institution_cnpj) { doc.text(`CNPJ: ${data.institution_cnpj}`, 40, y); y += 14; }
  if (data.unit_name) {
    doc.text(
      `Unidade: ${data.unit_name}${data.unit_city ? ` — ${data.unit_city}/${data.unit_state ?? ""}` : ""}`,
      40, y,
    ); y += 14;
  }
  doc.text(`Curso: ${data.course_name}`, 40, y); y += 14;
  doc.text(`Bolsa: ${data.scholarship_title}`, 40, y); y += 14;
  if (data.discount_percent != null) { doc.text(`Desconto: ${data.discount_percent}%`, 40, y); y += 14; }
  doc.text(
    `Mensalidade original: ${brl(data.monthly_original)}   ·   Com bolsa: ${brl(data.monthly_with_scholarship)}`,
    40, y,
  ); y += 22;

  // Condições
  if (data.rules) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Condições da bolsa", 40, y); y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(data.rules, W - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 10;
  }

  if (data.required_documents?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Documentos exigidos pela instituição", 40, y); y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    data.required_documents.forEach((d) => { doc.text(`• ${d}`, 50, y); y += 12; });
    y += 8;
  }

  // Texto institucional
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const declarText =
    "Declaramos que o(a) estudante acima identificado(a) realizou a reserva desta bolsa por meio da plataforma Tô de Bolsa, conforme as condições previamente cadastradas pela instituição parceira. Esta carta deverá ser apresentada à instituição dentro do prazo de validade para prosseguimento da matrícula, observadas as regras, documentos e condições da oferta. As mensalidades, quando houver, são tratadas diretamente entre estudante e instituição.";
  const declarLines = doc.splitTextToSize(declarText, W - 80);
  doc.text(declarLines, 40, y);
  y += declarLines.length * 11 + 12;

  // Footer / validação
  doc.setDrawColor(220, 220, 220);
  doc.line(40, y, W - 40, y); y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Valide esta carta em: ${validateUrl}`, 40, y);

  doc.save(`carta-apresentacao-${data.unique_code}.pdf`);
}
