import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Code, QrCode, Copy, Check, Download, Globe, Plug, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select, Badge } from '../../../components/ui';
import { widgetApi, publishingApi, integrationsApi } from '../../../services/api';
import api from '../../../services/api';
import { Link } from 'react-router-dom';
import { SYSTEM_FIELDS, TRIGGER_OPTIONS, triggerLabel } from '../../../utils/integrations';

const modes = [
  { id: 'inline', label: 'Inline', hint: 'Place the campaign in page content. The iframe resizes automatically.' },
  { id: 'popup', label: 'Popup', hint: 'Honors delay, scroll, exit-intent, click, mobile, and frequency settings from the builder.' },
  { id: 'banner', label: 'Banner', hint: 'Fixed top or bottom bar. Opens the campaign in an accessible dialog.' },
  { id: 'slideIn', label: 'Slide-in', hint: 'Side drawer — not a full-screen trap. Uses the same triggers as popup.' },
];

export function EmbedTab({
  campaignId,
  slug,
  status,
}: {
  campaignId: string;
  slug: string;
  status?: string;
}) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [mode, setMode] = useState('inline');
  const [hostname, setHostname] = useState('');
  const [assign, setAssign] = useState({
    integrationId: '',
    trigger: 'PARTICIPANT_CREATED',
    destinationId: '',
  });
  const [fieldRows, setFieldRows] = useState([{ from: 'email', to: 'email' }, { from: 'name', to: 'name' }]);

  const { data: embedData } = useQuery({
    queryKey: ['embed', campaignId],
    queryFn: () => widgetApi.getEmbedCode(campaignId),
  });
  const { data: qrData } = useQuery({
    queryKey: ['qr', campaignId],
    queryFn: () => widgetApi.getQRCode(campaignId, 'png', 300),
  });
  const { data: domainData } = useQuery({
    queryKey: ['domains', campaignId],
    queryFn: () => publishingApi.listDomains(campaignId),
  });
  const { data: assignmentData } = useQuery({
    queryKey: ['campaign-integrations', campaignId],
    queryFn: () => publishingApi.listAssignments(campaignId),
  });
  const { data: deliveryData } = useQuery({
    queryKey: ['deliveries', campaignId],
    queryFn: () => publishingApi.listDeliveries(campaignId),
  });
  const { data: catalogData } = useQuery({
    queryKey: ['integration-catalog'],
    queryFn: () => integrationsApi.catalog(),
  });
  const { data: destinationsData } = useQuery({
    queryKey: ['integration-destinations', assign.integrationId],
    enabled: Boolean(assign.integrationId),
    queryFn: () => integrationsApi.destinations(assign.integrationId),
  });
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations'),
  });

  const embed = embedData?.data?.data;
  const snippet = embed?.embedCodes?.[mode] || '';
  const domains = domainData?.data?.data || [];
  const assignments = assignmentData?.data?.data || [];
  const deliveries = deliveryData?.data?.data || [];
  const integrations = integrationsData?.data?.data || [];
  const catalog = catalogData?.data?.data || [];
  const destinations = destinationsData?.data?.data || [];
  const selectedIntegration = integrations.find((row: any) => row.id === assign.integrationId);
  const selectedCap = catalog.find((item: any) => item.type === selectedIntegration?.type);
  const destKey = selectedCap?.destinationKey || 'listId';

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied');
    setTimeout(() => setCopied(null), 2000);
  };

  const addDomain = useMutation({
    mutationFn: () => publishingApi.addDomain(campaignId, hostname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', campaignId] });
      toast.success('Domain added — configure the CNAME, then verify');
      setHostname('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.error?.message || 'Could not add domain'),
  });
  const verifyDomain = useMutation({
    mutationFn: (id: string) => publishingApi.verifyDomain(campaignId, id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['domains', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['embed', campaignId] });
      toast[res.data.success ? 'success' : 'error'](res.data.success ? 'Domain verified' : 'DNS not verified yet');
    },
  });
  const assignMutation = useMutation({
    mutationFn: (payload?: { integrationId: string; trigger: string; enabled?: boolean; destination?: Record<string, unknown> }) => {
      const mapping = Object.fromEntries(fieldRows.filter((row) => row.from && row.to).map((row) => [row.from, row.to]));
      const destination: Record<string, unknown> = { fieldMapping: mapping };
      if (assign.destinationId) destination[destKey] = assign.destinationId;
      if (selectedIntegration?.type === 'ZAPIER' || selectedIntegration?.type === 'CUSTOM_WEBHOOK') {
        destination.events = selectedIntegration.config?.events || ['participant.created', 'winner.selected', 'campaign.started', 'campaign.ended'];
      }
      return publishingApi.assignIntegration(campaignId, payload || {
        integrationId: assign.integrationId,
        trigger: assign.trigger,
        destination,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-integrations', campaignId] });
      toast.success('Integration assigned to this campaign');
    },
    onError: (error: any) => toast.error(error?.response?.data?.error?.message || 'Could not assign integration'),
  });
  const retryMutation = useMutation({
    mutationFn: (id: string) => publishingApi.retryDelivery(campaignId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', campaignId] });
      toast.success('Retry queued');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold">Publishing</h3>
          <Badge variant={status === 'ACTIVE' ? 'success' : 'default'}>{status || 'UNKNOWN'}</Badge>
        </div>
        {embed?.draftWarning && <p className="text-sm text-amber-400 mb-3">{embed.draftWarning}</p>}
        <p className="text-sm text-zinc-400 mb-2">Hosted URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-zinc-800 rounded-lg px-3 py-2 overflow-x-auto">{embed?.publicUrl || `…/c/${slug}`}</code>
          <Button variant="ghost" size="sm" onClick={() => copy(embed?.publicUrl || '', 'url')}>
            {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Referral links, QR, and share buttons use this canonical URL (verified custom domain when active).</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Embed snippets
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {modes.map((item) => (
              <Button key={item.id} size="sm" variant={mode === item.id ? 'primary' : 'secondary'} onClick={() => setMode(item.id)}>
                {item.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-zinc-400 mb-3">{modes.find((item) => item.id === mode)?.hint}</p>
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => copy(snippet, mode)}>
              {copied === mode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </Button>
          </div>
          <pre className="p-3 bg-zinc-800 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap"><code>{snippet}</code></pre>
          <p className="text-xs text-zinc-500 mt-3">Paste as-is. Origin is already set from the PromoApp host. Test at <code>/widget-qa.html</code> on the app origin.</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code
          </h3>
          {qrData?.data?.data?.qrCode ? (
            <div className="text-center">
              <img src={qrData.data.data.qrCode} alt="Campaign QR Code" className="mx-auto rounded-lg bg-white p-4" style={{ maxWidth: 250 }} />
              <p className="text-sm text-zinc-400 mt-4">Scan: {qrData.data.data.url}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrData.data.data.qrCode;
                  link.download = `qr-${slug}.png`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
                Download QR
              </Button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">QR code is not available yet.</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom domain
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Point a CNAME at the PromoApp host, then verify. TLS certificates are issued by your reverse proxy or CDN — PromoApp verifies DNS only.
        </p>
        <div className="flex gap-2 mb-4">
          <Input placeholder="giveaway.brand.com" value={hostname} onChange={(e) => setHostname(e.target.value)} />
          <Button onClick={() => addDomain.mutate()} loading={addDomain.isPending} disabled={!hostname.trim()}>Add</Button>
        </div>
        <div className="space-y-3">
          {domains.map((domain: any) => (
            <div key={domain.id} className="rounded-lg border border-zinc-800 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{domain.hostname}</p>
                  <Badge variant={domain.status === 'VERIFIED' ? 'success' : 'default'}>{domain.status}</Badge>
                </div>
                {domain.status !== 'VERIFIED' && (
                  <Button size="sm" variant="secondary" onClick={() => verifyDomain.mutate(domain.id)} loading={verifyDomain.isPending}>
                    Verify DNS
                  </Button>
                )}
              </div>
              {domain.lastError && <p className="text-xs text-red-400 mt-2">{domain.lastError}</p>}
            </div>
          ))}
          {domains.length === 0 && <p className="text-sm text-zinc-500">No custom domains yet.</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plug className="w-5 h-5" />
          Campaign integrations
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Connect providers on the Integrations page, then enable them here. Unrelated campaigns never sync. Marketing ESPs require privacy consent when the campaign asks for it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Select
            data-testid="assign-integration"
            options={[{ value: '', label: 'Select integration' }, ...integrations.map((row: any) => ({ value: row.id, label: row.name }))]}
            value={assign.integrationId}
            onChange={(e) => setAssign({ ...assign, integrationId: e.target.value, destinationId: '' })}
          />
          <Select
            options={TRIGGER_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            value={assign.trigger}
            onChange={(e) => setAssign({ ...assign, trigger: e.target.value })}
          />
          {selectedCap?.supportsDestinationDiscovery && destinations.length > 0 ? (
            <Select
              options={[{ value: '', label: selectedCap.destinationLabel || 'Select destination' }, ...destinations.map((row: any) => ({ value: row.id, label: row.name }))]}
              value={assign.destinationId}
              onChange={(e) => setAssign({ ...assign, destinationId: e.target.value })}
            />
          ) : (
            <Input
              placeholder={selectedCap?.destinationLabel || 'List / form / publication ID'}
              value={assign.destinationId}
              onChange={(e) => setAssign({ ...assign, destinationId: e.target.value })}
            />
          )}
        </div>
        <div className="mb-4 space-y-2">
          <p className="text-sm text-zinc-400">Field mapping (PromoApp → provider)</p>
          {fieldRows.map((row, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <Select
                options={SYSTEM_FIELDS}
                value={row.from}
                onChange={(e) => setFieldRows(fieldRows.map((item, i) => i === index ? { ...item, from: e.target.value } : item))}
              />
              <Input
                placeholder="Provider field"
                value={row.to}
                onChange={(e) => setFieldRows(fieldRows.map((item, i) => i === index ? { ...item, to: e.target.value } : item))}
              />
            </div>
          ))}
          <Button size="sm" variant="ghost" type="button" onClick={() => setFieldRows([...fieldRows, { from: 'phone', to: '' }])}>Add mapping row</Button>
        </div>
        <Button className="mb-4" onClick={() => assignMutation.mutate(undefined)} disabled={!assign.integrationId} loading={assignMutation.isPending}>
          Assign to this campaign
        </Button>
        <div className="space-y-2 mb-6" data-testid="campaign-automations">
          {assignments.map((row: any) => {
            const dest = row.destination || {};
            const destValue = dest.listId || dest.formId || dest.publicationId || dest.groupId || dest.campaignId || dest.tagId || dest.spreadsheetId || '';
            return (
              <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border border-zinc-800 rounded-lg p-3">
                <div>
                  <p className="font-medium">{row.integration?.name} · {triggerLabel(row.trigger)} {row.enabled ? '' : '(disabled)'}</p>
                  <p className="text-xs text-zinc-500">{row.integration?.type} {destValue ? `→ ${destValue}` : '→ Enabled'}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setAssign({ integrationId: row.integrationId, trigger: row.trigger, destinationId: String(destValue || '') })}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => assignMutation.mutate({
                      integrationId: row.integrationId,
                      trigger: row.trigger,
                      enabled: !row.enabled,
                      destination: dest,
                    })}
                  >
                    {row.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => integrationsApi.testEvent(row.integrationId).then(() => toast.success('Test sent'))}>Test</Button>
                  <Link to={`/settings/integrations?tab=logs&campaignId=${campaignId}`} className="text-xs text-primary-400 px-2 py-1">Deliveries</Link>
                  <Button size="sm" variant="ghost" onClick={() => publishingApi.removeAssignment(campaignId, row.id).then(() => queryClient.invalidateQueries({ queryKey: ['campaign-integrations', campaignId] }))}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && <p className="text-sm text-zinc-500">No campaign assignments yet.</p>}
        </div>
        <h4 className="font-medium mb-2">Recent deliveries</h4>
        <div className="space-y-2">
          {deliveries.slice(0, 12).map((row: any) => (
            <div key={row.id} className="flex items-center justify-between text-xs border border-zinc-800 rounded-lg p-2">
              <span>{row.event} · {row.status} · {row.destinationHost || 'n/a'} {row.error ? `· ${row.error}` : ''}</span>
              {row.status !== 'SUCCESS' && (
                <Button size="sm" variant="ghost" onClick={() => retryMutation.mutate(row.id)}>
                  <RefreshCw className="w-3 h-3" /> Retry
                </Button>
              )}
            </div>
          ))}
          {deliveries.length === 0 && <p className="text-sm text-zinc-500">No deliveries yet.</p>}
        </div>
      </Card>
    </div>
  );
}
