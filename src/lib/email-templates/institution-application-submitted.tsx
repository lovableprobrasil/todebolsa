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
  responsibleName?: string
  institutionName?: string
  siteUrl?: string
  supportEmail?: string
}

const Email = ({
  responsibleName = 'responsável',
  institutionName = 'sua instituição',
  siteUrl = 'https://todebolsa.com.br',
  supportEmail = 'contato@todebolsa.com.br',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      Recebemos o cadastro de {institutionName}. Análise em até 2 dias úteis.
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={badge}>
          <Text style={badgeText}>✓ Cadastro recebido</Text>
        </Section>

        <Heading style={h1}>Parabéns! Sua instituição foi cadastrada.</Heading>

        <Text style={text}>Olá, {responsibleName},</Text>

        <Text style={text}>
          Agradecemos o interesse de <strong>{institutionName}</strong> em se tornar
          parceira do <strong>Tô de Bolsa</strong>. Seu cadastro foi recebido com
          sucesso e agora passará por nossa análise interna.
        </Text>

        <Section style={highlight}>
          <Text style={highlightText}>
            ⏱️ <strong>Em até 2 (dois) dias úteis</strong> entraremos em contato
            para informar sobre a aprovação ou solicitar informações adicionais,
            caso necessário.
          </Text>
        </Section>

        <Text style={text}>
          Enquanto isso, você já pode acompanhar o status do seu credenciamento
          no painel da instituição:
        </Text>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Link href={`${siteUrl}/instituicao/credenciamento`} style={button}>
            Acessar painel da instituição
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Dúvidas? Fale com a gente em{' '}
          <Link href={`mailto:${supportEmail}`} style={link}>
            {supportEmail}
          </Link>
          .
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} Tô de Bolsa — Marketplace de bolsas de
          estudo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Confirmação de Cadastro de Instituição Parceira — Tô de Bolsa${
      data?.institutionName ? ` (${data.institutionName})` : ''
    }`,
  displayName: 'Cadastro de instituição — confirmação',
  previewData: {
    responsibleName: 'Carlos Lasselva',
    institutionName: 'Ultracursos e Concursos',
    siteUrl: 'https://todebolsa.com.br',
    supportEmail: 'contato@todebolsa.com.br',
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
}
const badge = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  borderRadius: '999px',
  padding: '6px 14px',
  marginBottom: '20px',
}
const badgeText = {
  margin: 0,
  color: '#166534',
  fontSize: '13px',
  fontWeight: 700 as const,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 800 as const,
  color: '#0f172a',
  lineHeight: '1.25',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const highlight = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #2563eb',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '20px 0',
}
const highlightText = {
  margin: 0,
  fontSize: '14px',
  color: '#1e3a8a',
  lineHeight: '1.5',
}
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
const hr = {
  borderColor: '#e2e8f0',
  margin: '28px 0 16px',
}
const link = { color: '#2563eb', textDecoration: 'underline' }
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '4px 0',
}
