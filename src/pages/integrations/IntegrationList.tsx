import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Mail,
  Webhook,
  Settings,
  Trash2,
  Power,
  TestTube,
  Table,
  List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Modal, Input, Select, PageSpinner, PageHeader, EmptyState } from '../../components/ui';
import api, { integrationsApi, planLimitMessage } from '../../services/api';
import { AUTOMATION_EVENTS, fieldLabel, healthVariant } from '../../utils/integrations';

const ICONS: Record<string, typeof Mail> = {
  ZAPIER: Webhook,
  CUSTOM_WEBHOOK: Webhook,
  GOOGLE_SHEETS: Table,
};

export function IntegrationListPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    type: 'MAILCHIMP',
    name: '',
    config: {} as Record<string, string | string[]>,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list(),
  });
  const { data: catalogData } = useQuery({
    queryKey: ['integration-catalog'],
    queryFn: () => integrationsApi.catalog(),
  });

  const catalog = catalogData?.data?.data || [];
  const selectedCap = catalog.find((item: any) => item.type === newIntegration.type);

  const createMutation = useMutation({
    mutationFn: (payload: any) => integrationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration added');
      setShowAddModal(false);
      setNewIntegration({ type: 'MAILCHIMP', name: '', config: {} });
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Failed to add integration'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.test(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      if (response.data.success) toast.success(response.data.message);
      else toast.error(response.data.message);
    },
    onError: () => toast.error('Test failed'),
  });

  const testEventMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.testEvent(id, 'participant.created'),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-deliveries'] });
      if (response.data.success) toast.success(response.data.message || 'Test event sent');
      else toast.error(response.data.message || 'Test event failed');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Test event failed'),
  });

  const integrations = data?.data.data || [];
  const typeOptions = useMemo(
    () =>
      catalog.map((item: any) => ({
        value: item.type,
        label: !item.serverConfigured
          ? `${item.name} (not configured)`
          : item.available
            ? item.name
            : `${item.name} (${item.minPlan}+)`,
      })),
    [catalog]
  );

  const authFields: string[] = selectedCap?.authFields || [];
  const isZapier = newIntegration.type === 'ZAPIER' || newIntegration.type === 'CUSTOM_WEBHOOK';
  const selectedEvents = Array.isArray(newIntegration.config.events)
    ? (newIntegration.config.events as string[])
    : AUTOMATION_EVENTS.map((item) => item.value);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Integrations"
        description="Connect email, CRM, and automation tools. Tracking pixels live on each campaign’s Design step — they are not integrations."
        actions={
          <div className="flex gap-2">
            <Link to="/integrations/deliveries">
              <Button variant="secondary">
                <List className="w-4 h-4" />
                Delivery log
              </Button>
            </Link>
            <Button onClick={() => setShowAddModal(true)} data-testid="add-integration">
              <Plus className="w-5 h-5" />
              Add Integration
            </Button>
          </div>
        }
      />

      {integrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration: any, index: number) => {
            const cap = catalog.find((item: any) => item.type === integration.type);
            const Icon = ICONS[integration.type] || Mail;
            return (
              <motion.div
                key={integration.id}
                data-testid={`integration-card-${integration.type}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-zinc-400">{cap?.name || integration.type}</p>
                      </div>
                    </div>
                    <Badge variant={healthVariant(integration.health)}>{integration.health || 'NOT_CONFIGURED'}</Badge>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-zinc-500">
                    <p>Campaigns: {integration._count?.campaignIntegrations ?? 0}</p>
                    <p>
                      Last test:{' '}
                      {integration.lastTestAt ? new Date(integration.lastTestAt).toLocaleString() : 'never'}{' '}
                      {integration.lastTestOk === false ? '(failed)' : integration.lastTestOk ? '(ok)' : ''}
                    </p>
                    <p>Last success: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'never'}</p>
                    {integration.lastError && <p className="text-red-400">Last error: {integration.lastError}</p>}
                    {integration.config?.apiKeyMasked && <p>API key: {integration.config.apiKeyMasked}</p>}
                    {integration.config?.secretConfigured && <p>Signing secret: •••• (hidden)</p>}
                    {integration.type === 'ZAPIER' && (
                      <p>Works with Zapier Webhooks (Catch Hook). Not an official Zapier Marketplace app.</p>
                    )}
                    {integration.type === 'GOOGLE_SHEETS' && (
                      <p>Spreadsheet sync uses the workspace Google connection. Tokens are never shown in the browser.</p>
                    )}
                    {cap?.oauthLiveQaRequired && (
                      <p className="text-amber-400">OAuth live account QA required — adapter is configured in code.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-6">
                    <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(integration.id)}>
                      <Power className="w-4 h-4" />
                      {integration.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => testMutation.mutate(integration.id)} loading={testMutation.isPending}>
                      <TestTube className="w-4 h-4" />
                      Test
                    </Button>
                    {(integration.type === 'ZAPIER' || integration.type === 'CUSTOM_WEBHOOK') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid="send-test-event"
                        onClick={() => testEventMutation.mutate(integration.id)}
                        loading={testEventMutation.isPending}
                      >
                        Send test event
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(integration.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Settings className="w-5 h-5" />}
          title="No integrations yet"
          description="Connect Mailchimp, Klaviyo, or a Zapier Catch Hook when you are ready. You can publish a campaign without an integration."
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Add Integration
            </Button>
          }
          data-testid="integrations-empty"
        />
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Integration" size="md">
        <div className="space-y-4">
          <Input
            label="Integration Name"
            placeholder="My Mailchimp audience"
            value={newIntegration.name}
            onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
          />
          <Select
            label="Provider"
            options={typeOptions}
            value={newIntegration.type}
            onChange={(e) => setNewIntegration({ ...newIntegration, type: e.target.value, config: {} })}
          />
          {selectedCap && (
            <p className="text-sm text-zinc-400">
              {selectedCap.description} Auth: {selectedCap.authType.replace('_', ' ')}. Plan: {selectedCap.minPlan}+.
              {selectedCap.requiresMarketingConsent && ' Marketing consent is required before participants are subscribed.'}
            </p>
          )}
          {newIntegration.type === 'ZAPIER' && (
            <p className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              Works with Zapier Webhooks. In Zapier, create a Zap with a Catch Hook trigger, paste the webhook URL here, choose events, then send a test event. This is not an official Zapier Marketplace listing.
            </p>
          )}
          {newIntegration.type === 'GOOGLE_SHEETS' && <GoogleSheetsConnect />}
          {authFields.map((field) => (
            <Input
              key={field}
              label={fieldLabel(field)}
              placeholder={`Enter ${fieldLabel(field).toLowerCase()}`}
              type={/key|secret|token/i.test(field) ? 'password' : 'text'}
              value={String(newIntegration.config[field] || '')}
              onChange={(e) =>
                setNewIntegration({
                  ...newIntegration,
                  config: { ...newIntegration.config, [field]: e.target.value },
                })
              }
            />
          ))}
          {isZapier && (
            <fieldset>
              <legend className="text-sm text-zinc-300 mb-2">Events</legend>
              <div className="space-y-1">
                {AUTOMATION_EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedEvents, event.value]
                          : selectedEvents.filter((item) => item !== event.value);
                        setNewIntegration({
                          ...newIntegration,
                          config: { ...newIntegration.config, events: next },
                        });
                      }}
                    />
                    {event.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              data-testid="save-integration"
              onClick={() =>
                createMutation.mutate({
                  ...newIntegration,
                  config: isZapier ? { ...newIntegration.config, events: selectedEvents } : newIntegration.config,
                })
              }
              loading={createMutation.isPending}
              disabled={createMutation.isPending || (newIntegration.type === 'GOOGLE_SHEETS' && selectedCap?.serverConfigured === false)}
            >
              Add Integration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GoogleSheetsConnect() {
  const { data } = useQuery({
    queryKey: ['google-status'],
    queryFn: () => api.get('/integrations/google/status').then((r) => r.data.data),
  });
  if (!data) return <p className="text-sm text-zinc-500">Checking Google Sheets…</p>;
  if (!data.configured) {
    return <p className="text-sm text-amber-400">Not configured. Set GOOGLE_SHEETS_CLIENT_ID and CLIENT_SECRET on the server.</p>;
  }
  if (!data.connected) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          const response = await api.get('/integrations/google/connect');
          if (response.data.data.url) window.location.href = response.data.data.url;
        }}
      >
        Connect Google
      </Button>
    );
  }
  return <p className="text-sm text-emerald-400">Google is connected. Enter spreadsheet ID and sheet name below.</p>;
}
