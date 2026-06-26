import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  studentName?: string
  institutionName?: string
  courseName?: string
  scholarshipTitle?: string
  uniqueCode?: string
  reservationCode?: string
  expiresAt?: string
  reservationUrl?: string
  validateUrl?: string
  siteUrl?: string
  supportEmail?: string
}

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('pt-BR') : '—'

const Email = ({
  studentName = 'estudante',
  institutionName = 'sua instituição',
  courseName = 'seu curso',
  scholarshipTitle = 'sua bolsa',
  uniqueCode = '------',
  reservationCode = '------',
  expiresAt,
  reservationUrl = 'https://todebolsa.com.br/reservas',
  validateUrl = 'https://todebolsa.com.br/validar-carta',
  siteUrl = 'https://todebolsa.com.br',
  supportEmail = 'contato@todebolsa.com.br',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      Sua Carta de Apresentação ({uniqueCode}) está pronta — apresente-a em {institutionName}.
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={badge}>
          <Text style={badgeText}>✓ Pagamento confirmado</Text>
        </Section>

        <Heading style={h1}>Sua Carta de Apresentação está pronta!</Heading>

        <Text style={text}>Olá, {studentName},</Text>

        <Text style={text}>
          Confirmamos o pagamento da sua reserva no <strong>Tô de Bolsa</strong>.
          Sua <strong>Carta de Apresentação</strong> já está disponível para
          download e deve ser entregue à instituição para concluir a matrícula.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Código da carta</Text>
          <Text style={cardCode}>{uniqueCode}</Text>
          <Hr style={cardHr} />
          <Text style={cardRow}><strong>Bolsa:</strong> {scholarshipTitle}</Text>
          <Text style={cardRow}><strong>Curso:</strong> {courseName}</Text>
          <Text style={cardRow}><strong>Instituição:</strong> {institutionName}</Text>
          <Text style={cardRow}><strong>Reserva:</strong> {reservationCode}</Text>
          {expiresAt && (
            <Text style={cardRow}><strong>Válida até:</strong> {fmtDate(expiresAt)}</Text>
          )}
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Link href={reservationUrl} style={button}>
            Baixar minha carta (PDF)
          </Link>
        </Section>

        <Text style={text}>
          A instituição pode confirmar a autenticidade da sua carta em{' '}
          <Link href={validateUrl} style={link}>{validateUrl}</Link>.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Dúvidas? Fale com a gente em{' '}
          <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} Tô de Bolsa — {siteUrl}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Sua Carta de Apresentação ${data?.uniqueCode ? `(${data.uniqueCode}) ` : ''}está pronta — Tô de Bolsa`,
  displayName: 'Carta de Apresentação emitida',
  previewData: {
    studentName: 'Maria Silva',
    institutionName: 'Univanguard',
    courseName: 'Administração',
    scholarshipTitle: 'Bolsa 50% Noturno',
    uniqueCode: 'TDB-AB12CD',
    reservationCode: 'RES-0001',
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    reservationUrl: 'https://todebolsa.com.br/reservas/abc',
    validateUrl: 'https://todebolsa.com.br/validar-carta/TDB-AB12CD',
    siteUrl: 'https://todebolsa.com.br',
    supportEmail: 'contato@todebolsa.com.br',
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const badge = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  borderRadius: '999px',
  padding: '6px 14px',
  marginBottom: '20px',
}
const badgeText = { margin: 0, color: '#166534', fontSize: '13px', fontWeight: 700 as const }
const h1 = { fontSize: '24px', fontWeight: 800 as const, color: '#0f172a', lineHeight: '1.25', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '18px 0',
}
const cardLabel = { margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const cardCode = { margin: '4px 0 10px', fontSize: '22px', fontWeight: 800 as const, color: '#0f172a', fontFamily: 'monospace' }
const cardHr = { borderColor: '#e2e8f0', margin: '8px 0 12px' }
const cardRow = { margin: '4px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '28px 0 16px' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '4px 0' }
