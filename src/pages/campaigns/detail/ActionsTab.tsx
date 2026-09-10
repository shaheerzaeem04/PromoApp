import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal, Select, Badge } from '../../../components/ui';
import { campaignApi } from '../../../services/api';
import { apiErrorMessage, entryActionTypes } from './constants';

function SortableAction({
  action,
  onEdit,
  onDelete,
}: {
  action: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 flex items-center gap-4">
        <button type="button" className="cursor-grab text-zinc-500" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{entryActionTypes.find((t) => t.value === action.type)?.icon || '⚡'}</span>
            <span className="font-medium">{action.title}</span>
            {action.required && <Badge variant="warning" size="sm">Required</Badge>}
          </div>
          <p className="text-sm text-zinc-400 mt-1">{action.description || action.type}</p>
        </div>
        <p className="font-semibold text-primary-400">+{action.points} pts</p>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
      </Card>
    </div>
  );
}

const emptyAction = {
  type: 'NEWSLETTER',
  title: '',
  description: '',
  points: 1,
  required: false,
  dailyLimit: '' as string | number,
  config: {} as Record<string, string>,
};

export function ActionsTab({ campaignId, actions }: { campaignId: string; actions: any[] }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(actions || []);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(emptyAction);

  useEffect(() => {
    setItems(actions || []);
  }, [actions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
  };

  const addMutation = useMutation({
    mutationFn: () => campaignApi.addAction(campaignId, payloadFromForm(form)),
    onSuccess: () => {
      invalidate();
      toast.success('Entry action added');
      setShowAdd(false);
      setForm(emptyAction);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not add action')),
  });

  const updateMutation = useMutation({
    mutationFn: () => campaignApi.updateAction(campaignId, editing.id, payloadFromForm(form, true)),
    onSuccess: () => {
      invalidate();
      toast.success('Action updated');
      setEditing(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not update action')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.deleteAction(campaignId, deleteTarget.id),
    onSuccess: () => {
      invalidate();
      toast.success('Action deleted');
      setDeleteTarget(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not delete action')),
  });

  const reorderMutation = useMutation({
    mutationFn: (actionIds: string[]) => campaignApi.reorderActions(campaignId, actionIds),
    onSuccess: () => invalidate(),
    onError: (error: any) => {
      setItems(actions || []);
      toast.error(apiErrorMessage(error, 'Could not save order'));
    },
  });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderMutation.mutate(next.map((item) => item.id));
  };

  const openEdit = (action: any) => {
    setForm({
      type: action.type,
      title: action.title || '',
      description: action.description || '',
      points: action.points ?? 1,
      required: Boolean(action.required),
      dailyLimit: action.dailyLimit ?? '',
      config: { ...(action.config || {}) },
    });
    setEditing(action);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Entry Actions</h3>
        <Button onClick={() => { setForm(emptyAction); setShowAdd(true); }}>
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </div>

      {items.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-zinc-400">No entry actions yet. Add some to let participants earn entries.</p>
        </Card>
      )}

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((action) => (
                <SortableAction
                  key={action.id}
                  action={action}
                  onEdit={() => openEdit(action)}
                  onDelete={() => setDeleteTarget(action)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ActionFormModal
        isOpen={showAdd}
        title="Add Entry Action"
        form={form}
        setForm={setForm}
        allowType
        onClose={() => setShowAdd(false)}
        onSubmit={() => addMutation.mutate()}
        loading={addMutation.isPending}
        submitLabel="Add Action"
      />

      <ActionFormModal
        isOpen={!!editing}
        title="Edit Entry Action"
        form={form}
        setForm={setForm}
        allowType={false}
        onClose={() => setEditing(null)}
        onSubmit={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
        submitLabel="Save changes"
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete action">
        <p className="text-sm text-zinc-400 mb-4">Delete “{deleteTarget?.title}”? Existing entries for this action are not removed.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function payloadFromForm(form: typeof emptyAction, isUpdate = false) {
  const payload: any = {
    title: form.title,
    description: form.description || undefined,
    points: Number(form.points) || 1,
    required: form.required,
    config: form.config,
  };
  if (!isUpdate) payload.type = form.type;
  if (form.dailyLimit !== '' && form.dailyLimit != null) {
    payload.dailyLimit = Number(form.dailyLimit);
  }
  return payload;
}

function ActionFormModal({
  isOpen,
  title,
  form,
  setForm,
  allowType,
  onClose,
  onSubmit,
  loading,
  submitLabel,
}: {
  isOpen: boolean;
  title: string;
  form: typeof emptyAction;
  setForm: (form: typeof emptyAction) => void;
  allowType: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {allowType && (
          <Select
            label="Action Type"
            options={entryActionTypes.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        )}
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Points" type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })} />
          <Input
            label="Daily limit (optional)"
            type="number"
            min={1}
            value={form.dailyLimit}
            onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
          />
        </div>
        {['VISIT_URL', 'BLOG_VISIT'].includes(form.type) && (
          <Input
            label="URL"
            placeholder="https://example.com"
            value={form.config.url || ''}
            onChange={(e) => setForm({ ...form, config: { ...form.config, url: e.target.value } })}
          />
        )}
        {['TWITTER_FOLLOW', 'INSTAGRAM_FOLLOW', 'TIKTOK_FOLLOW', 'YOUTUBE_SUBSCRIBE', 'FACEBOOK_LIKE'].includes(form.type) && (
          <Input
            label="Username or URL"
            placeholder="@username"
            value={form.config.username || form.config.url || ''}
            onChange={(e) => setForm({ ...form, config: { ...form.config, username: e.target.value } })}
          />
        )}
        {form.type === 'QUESTION' && (
          <Input
            label="Question"
            value={form.config.question || ''}
            onChange={(e) => setForm({ ...form, config: { ...form.config, question: e.target.value } })}
          />
        )}
        {form.type === 'VIRAL_SHARE' && (
          <p className="text-sm text-zinc-500">Referral sharing uses the participant referral link on the public campaign. Completing this action is honor-system.</p>
        )}
        {form.type === 'SECRET_CODE' && (
          <p className="text-sm text-zinc-500">Participants redeem codes from the Secret Codes tab. This action is completed when a code is accepted.</p>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-primary-500"
          />
          <span>Required to enter</span>
        </label>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={loading} disabled={!form.title.trim()}>{submitLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
