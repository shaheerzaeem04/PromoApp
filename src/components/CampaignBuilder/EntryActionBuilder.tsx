import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  GripVertical,
  Plus,
  Trash2,
  Gift,
  Zap,
  Check,
  Mail,
  Link2,
  Newspaper,
  Smartphone,
  Facebook,
  Share2,
  AtSign,
  Instagram,
  Music2,
  Youtube,
  MessageCircle,
  Bookmark,
  Linkedin,
  Headphones,
  HelpCircle,
  Users,
  KeyRound,
  Ticket,
  Star,
  Image as ImageIcon,
  FileUp,
  Puzzle,
  Send,
  Music,
  Apple,
  Gamepad2,
  Store,
  Play,
  Hash,
  Calendar,
  ShoppingBag,
  MapPin,
  Download,
  PlayCircle,
  Volume2,
  Globe,
  Webhook,
} from 'lucide-react';
import { Card, Button, Input, Modal, Badge, FilterSelect } from '../ui';
import type { FilterSelectOption } from '../ui';
import { cn } from '../../utils/cn';
import {
  ACTION_DEFINITIONS,
  ACTION_GROUPS,
  getActionDefinition,
  verificationLabelForMode,
  type ActionDefinition,
} from '../../campaign/actionCatalog';

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

const ACTION_TYPE_ICONS: Record<string, LucideIcon> = {
  NEWSLETTER: Mail,
  VISIT_URL: Link2,
  BLOG_VISIT: Newspaper,
  APP_DOWNLOAD: Smartphone,
  FACEBOOK_LIKE: Facebook,
  FACEBOOK_SHARE: Facebook,
  FACEBOOK_GROUP_VISIT: Users,
  TWITTER_FOLLOW: AtSign,
  TWITTER_RETWEET: Share2,
  TWITTER_TWEET: AtSign,
  INSTAGRAM_FOLLOW: Instagram,
  INSTAGRAM_LIKE: Instagram,
  INSTAGRAM_PROFILE_VISIT: Instagram,
  TIKTOK_FOLLOW: Music2,
  TIKTOK_LIKE: Music2,
  YOUTUBE_SUBSCRIBE: Youtube,
  YOUTUBE_WATCH: Youtube,
  YOUTUBE_CHANNEL_VISIT: Youtube,
  REDDIT_VISIT: MessageCircle,
  REDDIT_JOIN: MessageCircle,
  PINTEREST_PIN: Bookmark,
  PINTEREST_FOLLOW: Bookmark,
  LINKEDIN_SHARE: Linkedin,
  LINKEDIN_FOLLOW: Linkedin,
  PODCAST_LISTEN: Headphones,
  QUESTION: HelpCircle,
  VIRAL_SHARE: Users,
  BONUS_ENTRY: Gift,
  SECRET_CODE: KeyRound,
  COUPON_CODE: Ticket,
  LOYALTY_BONUS: Star,
  PHOTO_UPLOAD: ImageIcon,
  DOCUMENT_UPLOAD: FileUp,
  CUSTOM_ACTION: Puzzle,
  TELEGRAM_JOIN: Send,
  WHATSAPP_VISIT: MessageCircle,
  SPOTIFY_FOLLOW: Music,
  SPOTIFY_LISTEN: Music,
  APPLE_MUSIC_LISTEN: Apple,
  TWITCH_FOLLOW: Gamepad2,
  TWITCH_WATCH: Gamepad2,
  APP_STORE_VISIT: Store,
  GOOGLE_PLAY_VISIT: Play,
  DISCORD_JOIN: Hash,
  BOOK_APPOINTMENT: Calendar,
  PRODUCT_PAGE_VISIT: ShoppingBag,
  STORE_VISIT: MapPin,
  DOWNLOAD_RESOURCE: Download,
  WATCH_VIDEO: PlayCircle,
  LISTEN_AUDIO: Volume2,
  JOIN_COMMUNITY: Globe,
  WEBHOOK_COMPLETE: Webhook,
  REVIEW_SITE_VISIT: Star,
};

function iconForActionType(type: string): LucideIcon {
  return ACTION_TYPE_ICONS[type] ?? Zap;
}

const actionTypes = ACTION_DEFINITIONS.map((item) => ({
  value: item.type,
  label: item.label,
  group: item.group,
  icon: iconForActionType(item.type),
}));

type ActionGroupFilter = ActionDefinition['group'] | 'ALL';

const COMPLETION_OPTIONS: FilterSelectOption[] = [
  {
    value: 'once',
    label: 'Once',
    hint: 'Participant can complete this a single time',
    dotClassName: 'bg-zinc-400',
  },
  {
    value: 'daily',
    label: 'Daily',
    hint: 'Resets on the campaign timezone day',
    dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
  },
  {
    value: 'repeatable',
    label: 'Repeatable',
    hint: 'Can be completed more than once',
    dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  },
];

const ANSWER_TYPE_OPTIONS: FilterSelectOption[] = [
  {
    value: 'text',
    label: 'Short answer',
    hint: 'Free-text response',
    dotClassName: 'bg-zinc-400',
  },
  {
    value: 'choice',
    label: 'Single select',
    hint: 'Pick one option',
    dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
  },
  {
    value: 'multi',
    label: 'Multi-select',
    hint: 'Pick more than one',
    dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  },
];

function GroupTablist({
  children,
  reduceMotion,
}: {
  children: ReactNode;
  reduceMotion: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | undefined>(undefined);
  const { scrollXProgress } = useScroll({ container: ref, axis: 'x' });
  const progress = useSpring(scrollXProgress, { stiffness: 280, damping: 36, mass: 0.4 });
  const glowLeft = useTransform(progress, [0, 1], ['0%', '100%']);
  const [edgeLeft, setEdgeLeft] = useState(0);
  const [edgeRight, setEdgeRight] = useState(0);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateEdges = () => {
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 1) {
        setEdgeLeft(0);
        setEdgeRight(0);
        return;
      }
      setEdgeLeft(Math.min(1, node.scrollLeft / 32));
      setEdgeRight(Math.min(1, (max - node.scrollLeft) / 32));
    };

    const onWheel = (event: WheelEvent) => {
      if (node.scrollWidth <= node.clientWidth) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };

    const onScroll = () => {
      updateEdges();
      if (reduceMotion) return;
      setScrolling(true);
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => setScrolling(false), 160);
    };

    updateEdges();
    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);

    return () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('scroll', onScroll);
      observer.disconnect();
      window.clearTimeout(settleRef.current);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      className="relative mb-3"
      animate={reduceMotion ? undefined : { y: scrolling ? -1 : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-zinc-950 to-transparent"
        animate={{ opacity: reduceMotion ? 0 : edgeLeft }}
        transition={{ duration: 0.22 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-950 to-transparent"
        animate={{ opacity: reduceMotion ? 0 : edgeRight }}
        transition={{ duration: 0.22 }}
      />

      <div
        ref={ref}
        className="flex flex-nowrap items-center overflow-x-auto overscroll-x-contain touch-pan-x gap-1.5 py-1.5 min-h-11 scrollbar-hide"
        role="tablist"
        aria-label="Action groups"
      >
        {children}
      </div>

      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-zinc-800" />
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-[2px] w-24 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_14px_rgba(20,184,166,0.55)]"
          style={{ left: glowLeft }}
        />
      )}
    </motion.div>
  );
}

function RequiredToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left group"
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200',
          checked
            ? 'bg-primary-500 border-primary-400/50'
            : 'bg-zinc-800 border-zinc-700 group-hover:border-primary-500/30'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-zinc-50 shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </span>
      <span className="text-sm text-zinc-200">{label}</span>
    </button>
  );
}

function ActionTypeTile({
  type,
  label,
  selected,
  locked,
  index,
  reduceMotion,
  onSelect,
}: {
  type: string;
  label: string;
  selected: boolean;
  locked: boolean;
  index: number;
  reduceMotion: boolean | null;
  onSelect: () => void;
}) {
  const Icon = iconForActionType(type);
  const delay = reduceMotion ? 0 : Math.min(index, 16) * 0.028;

  return (
    <motion.button
      type="button"
      disabled={locked}
      aria-pressed={selected}
      onClick={() => !locked && onSelect()}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: locked ? 0.6 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={locked || reduceMotion ? undefined : { scale: 0.98 }}
      className={cn(
        'p-3 text-left relative card-interactive min-h-[88px]',
        locked && 'cursor-not-allowed hover:translate-y-0 hover:shadow-none hover:border-primary-500/25',
        selected && !locked && 'card-interactive-selected'
      )}
    >
      <div
        className={cn(
          'inline-flex p-1.5 rounded-lg mb-2 transition-colors duration-200',
          selected && !locked
            ? 'bg-primary-400 text-zinc-950 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
            : 'bg-primary-500/15 text-primary-200'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-zinc-100 leading-snug pr-5">{label}</p>
      {locked && <p className="text-[10px] text-amber-400 mt-1">Upgrade to unlock</p>}
      <AnimatePresence>
        {selected && !locked && (
          <motion.span
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-400 text-zinc-950"
          >
            <Check className="w-3 h-3" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

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
      <Card className="p-4 card-interactive hover:translate-y-0">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-primary-200 touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="p-2 rounded-lg bg-primary-500/15 text-primary-200">
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{action.title || actionType?.label}</h4>
              {action.required && (
                <Badge variant="warning" size="sm">Required</Badge>
              )}
              <Badge size="sm">
                {verificationLabelForMode(getActionDefinition(action.type)?.verification)}
              </Badge>
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
  const reduceMotion = useReducedMotion();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState<ActionGroupFilter>('ALL');
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
    setActiveGroup('ALL');
    setNewAction({
      title: '',
      description: '',
      points: 1,
      required: false,
      config: {},
    });
  };

  const renderConfigFields = (
    type: string,
    config: Record<string, any>,
    setConfig: (config: Record<string, any>) => void,
    extra?: {
      dailyLimit?: number | null;
      patch?: (next: { config?: Record<string, any>; dailyLimit?: number | null }) => void;
    }
  ) => {
    const definition = getActionDefinition(type);
    const honorNotice = definition && definition.verification === 'honor_system' ? (
      <p className="text-sm rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-amber-200">
        Verification: user-confirmed. This is not verified with the provider.
      </p>
    ) : definition && definition.verification === 'verified_internal' ? (
      <p className="text-sm rounded-xl border border-primary-500/25 bg-primary-500/8 px-3 py-2 text-primary-100">
        Verification: automatic internal validation.
      </p>
    ) : (
      <p className="text-sm rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-zinc-300">
        Verification: recorded. Free-text answers are not marked verified unless you set a quiz answer.
      </p>
    );

    const completionMode = config.completionMode || (type === 'BONUS_ENTRY' ? 'daily' : 'once');
    const completion = (
      <div className="space-y-2">
        <label className="label mb-0">Completion</label>
        <FilterSelect
          aria-label="Completion"
          options={COMPLETION_OPTIONS}
          value={completionMode}
          onChange={(nextMode) => {
            const nextConfig = { ...config, completionMode: nextMode };
            const dailyLimit =
              nextMode === 'once' ? null : nextMode === 'daily' ? 1 : extra?.dailyLimit ?? 1;
            if (extra?.patch) {
              extra.patch({ config: nextConfig, dailyLimit });
              return;
            }
            setConfig(nextConfig);
          }}
          listClassName="bottom-full top-auto mb-2 mt-0"
        />
        {completionMode === 'daily' && (
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
            <div className="space-y-2">
              <label className="label mb-0">Answer type</label>
              <FilterSelect
                aria-label="Answer type"
                options={ANSWER_TYPE_OPTIONS}
                value={config.inputType || 'text'}
                onChange={(inputType) => setConfig({ ...config, inputType })}
                listClassName="bottom-full top-auto mb-2 mt-0"
              />
            </div>
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
        <Card className="p-8 border-dashed border-2 border-primary-500/25 bg-zinc-950/40">
          <div className="text-center">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex p-3 rounded-full bg-primary-500/10 text-primary-400 mb-4 shadow-[0_0_22px_rgba(20,184,166,0.18)]"
            >
              <Gift className="w-8 h-8" />
            </motion.div>
            <h4 className="text-lg font-medium mb-2">No Entry Actions Yet</h4>
            <p className="text-zinc-400 mb-4">
              Add actions to let participants earn entries. More actions = more engagement!
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
              {actionTypes.slice(0, 6).map((type, index) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.value}
                    type="button"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.28 }}
                    onClick={() => {
                      setSelectedType(type.value);
                      setActiveGroup(type.group);
                      setShowAddModal(true);
                    }}
                    className="p-3 text-left card-interactive"
                  >
                    <span className="inline-flex p-1.5 rounded-lg bg-primary-500/15 text-primary-200 mb-2">
                      <Icon className="w-4 h-4" />
                    </span>
                    <p className="text-sm text-zinc-100 leading-snug">{type.label}</p>
                  </motion.button>
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
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add Entry Action"
        size="lg"
        footer={(
          <>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddAction} data-testid="builder-add-action-confirm">
              <Plus className="w-4 h-4" />
              Add Action
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <label className="block text-sm font-medium text-zinc-300">Select action type</label>
              <Badge size="sm" variant="info">{actionTypes.find((t) => t.value === selectedType)?.label}</Badge>
            </div>
            <GroupTablist reduceMotion={reduceMotion}>
              <button
                type="button"
                role="tab"
                aria-selected={activeGroup === 'ALL'}
                onClick={() => setActiveGroup('ALL')}
                className="builder-tab shrink-0 min-w-max  px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70"
              >
                All
              </button>
              {ACTION_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={activeGroup === group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className="builder-tab shrink-0 min-w-max px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70"
                >
                  {group.label}
                </button>
              ))}
            </GroupTablist>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {(activeGroup === 'ALL' ? ACTION_GROUPS : ACTION_GROUPS.filter((group) => group.id === activeGroup)).map((group) => {
                const types = actionTypes.filter((type) => type.group === group.id);
                if (types.length === 0) return null;
                return (
                  <div key={group.id}>
                    {activeGroup === 'ALL' && (
                      <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{group.label}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {types.map((type, index) => (
                        <ActionTypeTile
                          key={type.value}
                          type={type.value}
                          label={type.label}
                          selected={selectedType === type.value}
                          locked={isLocked(type.value)}
                          index={index}
                          reduceMotion={reduceMotion}
                          onSelect={() => setSelectedType(type.value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedType}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 rounded-xl border border-primary-500/20 bg-zinc-950/40 p-4"
            >
              <Input
                label="Title"
                placeholder={actionTypes.find((t) => t.value === selectedType)?.label}
                value={newAction.title || ''}
                onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
              />
              <Input
                label="Description (optional)"
                placeholder="Explain what users need to do"
                value={newAction.description || ''}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4 items-end">
                <Input
                  label="Points"
                  type="number"
                  min={1}
                  max={100}
                  value={newAction.points || 1}
                  onChange={(e) => setNewAction({ ...newAction, points: parseInt(e.target.value) || 1 })}
                />
                <div className="pb-1">
                  <RequiredToggle
                    checked={newAction.required || false}
                    onChange={(required) => setNewAction({ ...newAction, required })}
                    label="Required to enter"
                  />
                </div>
              </div>

              {renderConfigFields(
                selectedType,
                newAction.config || {},
                (config) => setNewAction((prev) => ({ ...prev, config })),
                {
                  dailyLimit: newAction.dailyLimit,
                  patch: (next) => setNewAction((prev) => ({ ...prev, ...next })),
                }
              )}
            </motion.div>
          </AnimatePresence>
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
            <div className="grid grid-cols-2 gap-4 items-end">
              <Input
                label="Points"
                type="number"
                min={1}
                value={editingAction.points}
                onChange={(e) => setEditingAction({ ...editingAction, points: parseInt(e.target.value) || 1 })}
              />
              <div className="pb-1">
                <RequiredToggle
                  checked={editingAction.required}
                  onChange={(required) => setEditingAction({ ...editingAction, required })}
                  label="Required"
                />
              </div>
            </div>
            
            {renderConfigFields(
              editingAction.type,
              editingAction.config,
              (config) => setEditingAction((prev) => (prev ? { ...prev, config } : prev)),
              {
                dailyLimit: editingAction.dailyLimit,
                patch: (next) => setEditingAction((prev) => (prev ? { ...prev, ...next } : prev)),
              }
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

