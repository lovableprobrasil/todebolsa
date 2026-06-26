import type { ComponentType } from 'react'
import { template as institutionApplicationSubmitted } from './institution-application-submitted'
import { template as scholarshipLetterIssued } from './scholarship-letter-issued'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'institution-application-submitted': institutionApplicationSubmitted,
  'scholarship-letter-issued': scholarshipLetterIssued,
}
