import { createFileRoute } from '@tanstack/react-router';
import { CampaignManager } from '@/components/admin/campaigns/CampaignManager';

export const Route = createFileRoute('/_authenticated/admin/configuracoes-comerciais')({
  component: () => (
    <div className="space-y-6">
      <CampaignManager />
    </div>
  ),
});
