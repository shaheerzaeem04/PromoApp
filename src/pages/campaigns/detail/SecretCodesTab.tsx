import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, DateTimePicker, Input, Modal, Badge, PageSpinner } from '../../../components/ui';
import { campaignApi } from '../../../services/api';
import { formatDateTime } from '../../../utils/formatters';
import { apiErrorMessage, fromDateTimeLocal } from './constants';

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = lines[0]?.toLowerCase().includes('code') ? lines.slice(1) : lines;
  return rows.map((line) => {
    const [code, points, maxUses, expiresAt] = line.split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
    return {
      code: (code || '').toUpperCase(),
      points: Number(points) || 10,
      maxUses: Number(maxUses) || 1,
      expiresAt: expiresAt || undefined,
    };
  }).filter((row) => row.code);
}

export function SecretCodesTab({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ code: '', points: 10, maxUses: 1, expiresAt: '' });
  const [csvText, setCsvText] = useState('code,points,maxUses,expiresAt\nSUMMER10,10,1,');
  const [preview, setPreview] = useState<{ accepted?: any[]; errors?: Array<{ code: string; reason: string }>; importable?: number } | null>(null);
  const [generate, setGenerate] = useState({ count: 10, points: 10, maxUses: 1, prefix: 'PA', expiresAt: '' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['secret-codes', campaignId],
    queryFn: () => campaignApi.getSecretCodes(campaignId),
  });

  const codes = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: () => campaignApi.addSecretCode(campaignId, {
      code: form.code.trim().toUpperCase(),
      points: Number(form.points) || 10,
      maxUses: Number(form.maxUses) || 1,
      expiresAt: fromDateTimeLocal(form.expiresAt) || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret-codes', campaignId] });
      toast.success('Secret code created');
      setShowAdd(false);
      setForm({ code: '', points: 10, maxUses: 1, expiresAt: '' });
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not create code')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.deleteSecretCode(campaignId, deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret-codes', campaignId] });
      toast.success('Code deleted');
      setDeleteTarget(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not delete code')),
  });

  const previewMutation = useMutation({
    mutationFn: () => campaignApi.previewSecretCodes(campaignId, { codes: parseCsv(csvText) }),
    onSuccess: (response) => setPreview(response.data.data),
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not preview import')),
  });

  const importMutation = useMutation({
    mutationFn: () => campaignApi.importSecretCodes(campaignId, { codes: parseCsv(csvText), confirm: true }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['secret-codes', campaignId] });
      const result = response.data.data;
      toast.success(`Imported ${result.imported} codes. ${result.errors?.length || 0} skipped.`);
      setShowImport(false);
      setPreview(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not import codes')),
  });

  const generateMutation = useMutation({
    mutationFn: () => campaignApi.generateSecretCodes(campaignId, {
      count: Number(generate.count) || 10,
      points: Number(generate.points) || 10,
      maxUses: Number(generate.maxUses) || 1,
      prefix: generate.prefix,
      expiresAt: fromDateTimeLocal(generate.expiresAt) || undefined,
    }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['secret-codes', campaignId] });
      toast.success(`Generated ${response.data.data.imported} codes`);
      setShowGenerate(false);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not generate codes')),
  });

  if (isLoading) return <PageSpinner />;
  if (isError) return <Card className="p-8 text-center text-zinc-400">Could not load secret codes.</Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-lg font-semibold">Secret Codes</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowGenerate(true)}>
            <Sparkles className="w-4 h-4" />
            Bulk generate
          </Button>
          <Button variant="secondary" onClick={() => { setShowImport(true); setPreview(null); }}>
            <Upload className="w-4 h-4" />
            CSV import
          </Button>
          <Button onClick={() => setShowAdd(true)} data-testid="create-secret-code">
            <Plus className="w-4 h-4" />
            Create code
          </Button>
        </div>
      </div>

      {codes.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-zinc-400">No secret codes yet. Create a code, import a CSV, or generate a batch. Add a Secret Code entry action so participants can redeem them.</p>
        </Card>
      )}

      {codes.length > 0 && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="p-4">Code</th>
                <th className="p-4">Points</th>
                <th className="p-4">Uses</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {codes.map((code: any) => (
                <tr key={code.id}>
                  <td className="p-4 font-mono">{code.code}</td>
                  <td className="p-4">{code.points}</td>
                  <td className="p-4">{code.currentUses} / {code.maxUses}</td>
                  <td className="p-4 text-zinc-400">{code.expiresAt ? formatDateTime(code.expiresAt) : 'None'}</td>
                  <td className="p-4">
                    <Badge size="sm" variant={code.enabled ? 'success' : 'default'}>
                      {code.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleteTarget(code)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create secret code">
        <div className="space-y-4">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="SUMMER2026"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points" type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })} />
            <Input label="Max uses" type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 1 })} />
          </div>
          <DateTimePicker
            label="Expiry (optional)"
            value={form.expiresAt}
            onChange={(expiresAt) => setForm({ ...form, expiresAt })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              data-testid="secret-code-create-confirm"
              loading={createMutation.isPending}
              disabled={form.code.trim().length < 3}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setPreview(null); }} title="Import secret codes" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">CSV columns: code, points, maxUses, expiresAt. Existing codes are never overwritten.</p>
          <textarea
            className="input min-h-[140px] font-mono text-sm"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setPreview(null); }}
          />
          {preview && (
            <div className="text-sm space-y-1">
              <p className="text-emerald-400">{preview.importable} new codes ready</p>
              {(preview.errors || []).map((error) => (
                <p key={`${error.code}-${error.reason}`} className="text-amber-400">{error.code}: {error.reason}</p>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button variant="secondary" loading={previewMutation.isPending} onClick={() => previewMutation.mutate()}>Preview</Button>
            <Button loading={importMutation.isPending} disabled={!preview || !preview.importable} onClick={() => importMutation.mutate()}>Import</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate secret codes">
        <div className="space-y-4">
          <Input label="How many" type="number" min={1} max={200} value={generate.count} onChange={(e) => setGenerate({ ...generate, count: parseInt(e.target.value) || 1 })} />
          <Input label="Prefix" value={generate.prefix} onChange={(e) => setGenerate({ ...generate, prefix: e.target.value.toUpperCase() })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points" type="number" min={1} value={generate.points} onChange={(e) => setGenerate({ ...generate, points: parseInt(e.target.value) || 1 })} />
            <Input label="Max uses" type="number" min={1} value={generate.maxUses} onChange={(e) => setGenerate({ ...generate, maxUses: parseInt(e.target.value) || 1 })} />
          </div>
          <DateTimePicker label="Expiry (optional)" value={generate.expiresAt} onChange={(expiresAt) => setGenerate({ ...generate, expiresAt })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button loading={generateMutation.isPending} onClick={() => generateMutation.mutate()}>Generate</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete secret code">
        <p className="text-sm text-zinc-400 mb-4">Delete code “{deleteTarget?.code}”? Participants will no longer be able to redeem it.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
