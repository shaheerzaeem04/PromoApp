import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  Plus,
  Trash2,
  Gift,
  Zap,
  Check,
} from 'lucide-react';
import { Card, Button, Input, Modal } from '../ui';
import { ACTION_DEFINITIONS, ACTION_GROUPS, getActionDefinition, verificationLabelForMode } from '../../campaign/actionCatalog';

export interface EntryAction {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  required: boolean;
  order: number;
  dailyLimit?: number | null;
  config: Record<string, any>;
  completionKey?: string;
  completionSecret?: string;
}

interface EntryActionBuilderProps {
  actions: EntryAction[];
  onChange: (actions: EntryAction[]) => void;
  allowedActionTypes?: string[] | null;
}

const actionTypes = ACTION_DEFINITIONS.map((item) => ({
  value: item.type,
  label: item.label,
  group: item.group,
  icon: Zap,
  color: 'from-zinc-500 to-zinc-600',
}));

interface SortableItemProps {
  action: EntryAction;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableItem({ action, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const actionType = actionTypes.find(t => t.value === action.type);
  const Icon = actionType?.icon || Zap;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="p-4 border border-zinc-800 hover:border-zinc-700 transition-all">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className={`p-2 rounded-lg bg-gradient-to-br ${actionType?.color || 'from-zinc-500 to-zinc-600'}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{action.title || actionType?.label}</h4>
              {action.required && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">Required</span>
              )}
              <span className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                {verificationLabelForMode(getActionDefinition(action.type)?.verification)}
              </span>
            </div>
            <p className="text-sm text-zinc-400 truncate">{action.description || actionType?.label}</p>
            {action.completionKey && (
              <p className="text-xs text-zinc-500 mt-1 font-mono truncate">Webhook key: {action.completionKey}</p>
            )}
            {action.completionSecret && (
              <p className="text-xs text-amber-400 mt-1">Copy the webhook secret now — it is shown only once.</p>
            )}
          </div>

          {/* Points */}
          <div className="text-right shrink-0">
            <p className="font-bold text-primary-400">+{action.points}</p>
            <p className="text-xs text-zinc-500">points</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function EntryActionBuilder({ actions, onChange, allowedActionTypes }: EntryActionBuilderProps) {
  const isLocked = (type: string) => Array.isArray(allowedActionTypes) && !allowedActionTypes.includes(type);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAction, setEditingAction] = useState<EntryAction | null>(null);
  const [selectedType, setSelectedType] = useState('NEWSLETTER');
  const [newAction, setNewAction] = useState<Partial<EntryAction>>({
    title: '',
    description: '',
    points: 1,
    required: false,
    config: {},
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = actions.findIndex(a => a.id === active.id);
      const newIndex = actions.findIndex(a => a.id === over.id);
      
      const newActions = arrayMove(actions, oldIndex, newIndex).map((action, index) => ({
        ...action,
        order: index,
      }));
      
      onChange(newActions);
    }
  };

  const handleAddAction = () => {
    if (isLocked(selectedType)) return;
    const actionType = actionTypes.find(t => t.value === selectedType);
    const id = `temp-${Date.now()}`;
    
    const action: EntryAction = {
      id,
      type: selectedType,
      title: newAction.title || actionType?.label || '',
      description: newAction.description || '',
      points: newAction.points || 1,
      required: newAction.required || false,
      order: actions.length,
      dailyLimit: selectedType === 'BONUS_ENTRY' ? 1 : newAction.dailyLimit,
      config: {
        ...(newAction.config || {}),
        completionMode: selectedType === 'BONUS_ENTRY' ? 'daily' : (newAction.config?.completionMode || 'once'),
      },
    };

    onChange([...actions, action]);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditAction = () => {
    if (!editingAction) return;

    const updatedActions = actions.map(a => 
      a.id === editingAction.id ? editingAction : a
    );
    
    onChange(updatedActions);
    setEditingAction(null);
  };

  const handleDeleteAction = (id: string) => {
    const updatedActions = actions
      .filter(a => a.id !== id)
      .map((action, index) => ({ ...action, order: index }));
    onChange(updatedActions);
  };

  const resetForm = () => {
    setSelectedType('NEWSLETTER');
    setNewAction({
      title: '',
      description: '',
      points: 1,
      required: false,
      config: {},
    });
  };

  const renderConfigFields = (type: string, config: Record<string, any>, setConfig: (config: Record<string, any>) => void, extra?: { dailyLimit?: number | null; setDailyLimit?: (value: number | null) => void }) => {
    const definition = getActionDefinition(type);
    const honorNotice = definition && definition.verification === 'honor_system' ? (
      <p className="text-sm text-amber-400">Verification: user-confirmed. This is not verified with the provider.</p>
    ) : definition && definition.verification === 'verified_internal' ? (
      <p className="text-sm text-zinc-400">Verification: automatic internal validation.</p>
    ) : (
      <p className="text-sm text-zinc-400">Verification: recorded. Free-text answers are not marked verified unless you set a quiz answer.</p>
    );

    const completion = (
      <div className="space-y-2">
        <label className="block text-sm text-zinc-300">Completion</label>
        <select
          className="input"
          value={config.completionMode || (type === 'BONUS_ENTRY' ? 'daily' : 'once')}
          onChange={(e) => {
            const completionMode = e.target.value;
            setConfig({ ...config, completionMode });
            extra?.setDailyLimit?.(completionMode === 'once' ? null : completionMode === 'daily' ? 1 : extra.dailyLimit || 1);
          }}
        >
          <option value="once">Once</option>
          <option value="daily">Daily (campaign timezone)</option>
          <option value="repeatable">Repeatable</option>
        </select>
        {(config.completionMode === 'daily' || type === 'BONUS_ENTRY') && extra?.setDailyLimit && (
          <p className="text-xs text-zinc-500">Server uses the campaign timezone day boundary. Participants cannot double-claim the same campaign day.</p>
        )}
      </div>
    );

    const urlField = (
      <Input
        label={type === 'YOUTUBE_SUBSCRIBE' ? 'YouTube channel URL' : 'Destination URL'}
        placeholder="https://"
        value={config.url || config.channelUrl || ''}
        onChange={(e) => setConfig({ ...config, url: e.target.value, channelUrl: type === 'YOUTUBE_SUBSCRIBE' ? e.target.value : config.channelUrl })}
      />
    );

    switch (type) {
      case 'VISIT_URL':
      case 'BLOG_VISIT':
      case 'APP_DOWNLOAD':
      case 'CUSTOM_ACTION':
      case 'FACEBOOK_LIKE':
      case 'FACEBOOK_SHARE':
      case 'TWITTER_RETWEET':
      case 'TWITTER_TWEET':
      case 'INSTAGRAM_LIKE':
      case 'TIKTOK_LIKE':
      case 'YOUTUBE_WATCH':
      case 'REDDIT_VISIT':
      case 'PINTEREST_PIN':
      case 'LINKEDIN_SHARE':
      case 'PODCAST_LISTEN':
        return <>{honorNotice}{urlField}{completion}</>;
      case 'TWITTER_FOLLOW':
      case 'INSTAGRAM_FOLLOW':
      case 'TIKTOK_FOLLOW':
        return (
          <>
            {honorNotice}
            <Input label="Username" placeholder="@username" value={config.username || ''} onChange={(e) => setConfig({ ...config, username: e.target.value })} />
            {urlField}
            {completion}
          </>
        );
      case 'YOUTUBE_SUBSCRIBE':
        return <>{honorNotice}{urlField}{completion}</>;
      case 'QUESTION':
        return (
          <>
            {honorNotice}
            <Input label="Question" placeholder="What is your favorite...?" value={config.question || ''} onChange={(e) => setConfig({ ...config, question: e.target.value })} />
            <label className="block text-sm text-zinc-300">Answer type</label>
            <select className="input" value={config.inputType || 'text'} onChange={(e) => setConfig({ ...config, inputType: e.target.value })}>
              <option value="text">Short answer</option>
              <option value="choice">Single select</option>
              <option value="multi">Multi-select</option>
            </select>
            {(config.inputType === 'choice' || config.inputType === 'select' || config.inputType === 'multi' || config.inputType === 'radio') && (
              <label className="block text-sm text-zinc-400">
                Answer options (one per line)
                <textarea
                  className="input min-h-[80px] mt-1"
                  value={(config.options || []).join('\n')}
                  onChange={(e) => setConfig({ ...config, options: e.target.value.split('\n').map((item: string) => item.trim()).filter(Boolean) })}
                />
              </label>
            )}
            <Input
              label="Correct answer (quiz only, optional)"
              placeholder="Leave blank to record any answer"
              value={config.correctAnswer || ''}
              onChange={(e) => setConfig({ ...config, correctAnswer: e.target.value })}
            />
            {completion}
          </>
        );
      case 'SECRET_CODE':
        return <p className="text-sm text-zinc-400">Codes are managed in Secret Codes. This action is completed when a valid code is redeemed.</p>;
      case 'VIRAL_SHARE':
        return <p className="text-sm text-zinc-400">Referral points are awarded when someone else enters with the participant link. Sharing the link does not itself award those points.</p>;
      case 'BONUS_ENTRY':
        return <>{honorNotice}{completion}</>;
      case 'PHOTO_UPLOAD':
        return <p className="text-sm text-zinc-400">Participants upload a JPEG, PNG, GIF, or WebP. The server validates type and size.</p>;
      case 'DOCUMENT_UPLOAD':
        return <p className="text-sm text-zinc-400">Participants upload a PDF. Generic documents are deferred.</p>;
      case 'WEBHOOK_COMPLETE':
        return (
          <div className="space-y-2 text-sm text-zinc-400">
            <p>External systems complete this action with a signed POST. Participants cannot complete it on the campaign page.</p>
            {editingAction?.completionKey && (
              <p className="font-mono text-xs break-all">POST /api/webhooks/actions/{editingAction.completionKey}/complete</p>
            )}
            {editingAction?.completionSecret && (
              <p className="text-amber-400 text-xs break-all">Secret (once): {editingAction.completionSecret}</p>
            )}
            <p className="text-xs">Send header X-Promo-Webhook-Secret and JSON {`{ "email": "participant@example.com" }`}. Optional HMAC: X-Promo-Signature sha256=...</p>
          </div>
        );
      case 'NEWSLETTER':
        return (
          <>
            {honorNotice}
            <p className="text-sm text-zinc-400">Subscribe / join the newsletter to earn entries. Entering the giveaway does not complete this action automatically.</p>
            {urlField}
            {completion}
          </>
        );
      default:
        return <>{honorNotice}{urlField}{completion}</>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Entry Actions</h3>
          <p className="text-sm text-zinc-400">Drag to reorder. First action is required by default.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} data-testid="builder-add-action">
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </div>

      {/* Action Templates */}
      {actions.length === 0 && (
        <Card className="p-8 border-dashed border-2 border-zinc-700">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-primary-500/10 text-primary-400 mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-medium mb-2">No Entry Actions Yet</h4>
            <p className="text-zinc-400 mb-4">
              Add actions to let participants earn entries. More actions = more engagement!
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
              {actionTypes.slice(0, 6).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedType(type.value);
                      setShowAddModal(true);
                    }}
                    className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 mb-2 text-zinc-400" />
                    <p className="text-sm">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Sortable List */}
      {actions.length > 0 && (
        <div className="relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={actions.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {actions.map((action) => (
                    <SortableItem
                      key={action.id}
                      action={action}
                      onEdit={() => setEditingAction({ ...action })}
                      onDelete={() => handleDeleteAction(action.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Action Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Entry Action" size="lg">
        <div className="space-y-6">
          {/* Action Type Grid */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Select Action Type</label>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {ACTION_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{group.label}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actionTypes.filter((type) => type.group === group.id).map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                const locked = isLocked(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setSelectedType(type.value)}
                    className={`p-3 text-left relative card-interactive ${
                      locked
                        ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none hover:border-primary-500/25'
                        : isSelected
                        ? 'card-interactive-selected'
                        : ''
                    }`}
                  >
                    <div className={`inline-flex p-1.5 rounded bg-gradient-to-br ${type.color} mb-2`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-medium">{type.label}</p>
                    {locked && <p className="text-[10px] text-amber-400 mt-1">Upgrade to unlock</p>}
                    {isSelected && !locked && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                    )}
                  </button>
                );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Details */}
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder={actionTypes.find(t => t.value === selectedType)?.label}
              value={newAction.title || ''}
              onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
            />
            <Input
              label="Description (optional)"
              placeholder="Explain what users need to do"
              value={newAction.description || ''}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Points"
                type="number"
                min={1}
                max={100}
                value={newAction.points || 1}
                onChange={(e) => setNewAction({ ...newAction, points: parseInt(e.target.value) || 1 })}
              />
              <div className="pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAction.required || false}
                    onChange={(e) => setNewAction({ ...newAction, required: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-primary-500"
                  />
                  <span>Required to enter</span>
                </label>
              </div>
            </div>
            
            {/* Type-specific config */}
            {renderConfigFields(
              selectedType,
              newAction.config || {},
              (config) => setNewAction({ ...newAction, config }),
              { dailyLimit: newAction.dailyLimit, setDailyLimit: (dailyLimit) => setNewAction({ ...newAction, dailyLimit }) }
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddAction} data-testid="builder-add-action-confirm">
              Add Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Action Modal */}
      <Modal 
        isOpen={!!editingAction} 
        onClose={() => setEditingAction(null)} 
        title="Edit Entry Action" 
        size="md"
      >
        {editingAction && (
          <div className="space-y-4">
            <Input
              label="Title"
              value={editingAction.title}
              onChange={(e) => setEditingAction({ ...editingAction, title: e.target.value })}
            />
            <Input
              label="Description"
              value={editingAction.description}
              onChange={(e) => setEditingAction({ ...editingAction, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Points"
                type="number"
                min={1}
                value={editingAction.points}
                onChange={(e) => setEditingAction({ ...editingAction, points: parseInt(e.target.value) || 1 })}
              />
              <div className="pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAction.required}
                    onChange={(e) => setEditingAction({ ...editingAction, required: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-primary-500"
                  />
                  <span>Required</span>
                </label>
              </div>
            </div>
            
            {renderConfigFields(
              editingAction.type,
              editingAction.config,
              (config) => setEditingAction({ ...editingAction, config }),
              { dailyLimit: editingAction.dailyLimit, setDailyLimit: (dailyLimit) => setEditingAction({ ...editingAction, dailyLimit }) }
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingAction(null)}>Cancel</Button>
              <Button onClick={handleEditAction}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

