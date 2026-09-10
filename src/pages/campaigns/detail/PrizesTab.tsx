import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal, Select, Badge } from '../../../components/ui';
import { campaignApi } from '../../../services/api';
import { apiErrorMessage, prizeTypes } from './constants';

const emptyPrize = {
  name: '',
  description: '',
  quantity: 1,
  type: 'PHYSICAL',
  value: '' as string | number,
  image: '',
  order: 0,
};

export function PrizesTab({ campaignId, prizes }: { campaignId: string; prizes: any[] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(emptyPrize);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });

  const addMutation = useMutation({
    mutationFn: () => campaignApi.addPrize(campaignId, prizePayload(form)),
    onSuccess: () => {
      invalidate();
      toast.success('Prize added');
      setShowAdd(false);
      setForm(emptyPrize);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not add prize')),
  });

  const updateMutation = useMutation({
    mutationFn: () => campaignApi.updatePrize(campaignId, editing.id, prizePayload(form)),
    onSuccess: () => {
      invalidate();
      toast.success('Prize updated');
      setEditing(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not update prize')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.deletePrize(campaignId, deleteTarget.id),
    onSuccess: () => {
      invalidate();
      toast.success('Prize deleted');
      setDeleteTarget(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not delete prize')),
  });

  const openEdit = (prize: any) => {
    setForm({
      name: prize.name || '',
      description: prize.description || '',
      quantity: prize.quantity ?? 1,
      type: prize.type || 'PHYSICAL',
      value: prize.value ?? '',
      image: prize.image || '',
      order: prize.order ?? 0,
    });
    setEditing(prize);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prizes</h3>
        <Button onClick={() => { setForm(emptyPrize); setShowAdd(true); }}>
          <Plus className="w-4 h-4" />
          Add Prize
        </Button>
      </div>

      {(!prizes || prizes.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-zinc-400">No prizes yet. Add prizes before drawing winners.</p>
        </Card>
      )}

      {prizes?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prizes.map((prize: any) => (
            <Card key={prize.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{prize.name}</h4>
                  <p className="text-sm text-zinc-400 mt-1">{prize.description || '—'}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge>{prize.type}</Badge>
                    <span className="text-sm text-zinc-400">×{prize.quantity}</span>
                    {prize.value != null && prize.value !== '' && (
                      <span className="text-sm text-zinc-400">Value {prize.value}</span>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(prize)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(prize)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PrizeFormModal
        isOpen={showAdd}
        title="Add Prize"
        form={form}
        setForm={setForm}
        onClose={() => setShowAdd(false)}
        onSubmit={() => addMutation.mutate()}
        loading={addMutation.isPending}
        submitLabel="Add Prize"
      />
      <PrizeFormModal
        isOpen={!!editing}
        title="Edit Prize"
        form={form}
        setForm={setForm}
        onClose={() => setEditing(null)}
        onSubmit={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
        submitLabel="Save changes"
      />
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete prize">
        <p className="text-sm text-zinc-400 mb-4">Delete “{deleteTarget?.name}”? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function prizePayload(form: typeof emptyPrize) {
  const payload: any = {
    name: form.name,
    description: form.description || undefined,
    quantity: Number(form.quantity) || 1,
    type: form.type,
    order: Number(form.order) || 0,
  };
  if (form.value !== '' && form.value != null) payload.value = Number(form.value);
  if (form.image.trim()) payload.image = form.image.trim();
  return payload;
}

function PrizeFormModal({
  isOpen, title, form, setForm, onClose, onSubmit, loading, submitLabel,
}: {
  isOpen: boolean;
  title: string;
  form: typeof emptyPrize;
  setForm: (form: typeof emptyPrize) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <Input label="Prize Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Quantity" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
          <Select label="Type" options={prizeTypes} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Value (optional)" type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Input label="Display order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
        </div>
        <Input
          label="Image URL (optional)"
          placeholder="https://…"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={loading} disabled={!form.name.trim()}>{submitLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
