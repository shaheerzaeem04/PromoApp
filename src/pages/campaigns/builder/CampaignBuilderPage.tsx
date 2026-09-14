import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  Play,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, DateTimePicker, Input, Modal, PageSpinner } from '../../../components/ui';
import {
  TemplateGallery,
  ThemeSelector,
  DisplayModeSettings,
  RulesGenerator,
  EntryActionBuilder,
  CustomFormBuilder,
  LivePreview,
} from '../../../components/CampaignBuilder';
import { campaignApi, draftApi, templateApi, formFieldApi, workspaceApi, spinWheelApi } from '../../../services/api';
import { apiErrorMessage, fromDateTimeLocal } from '../detail/constants';
import { GiveawayExperience, PreviewEntryForm, PreviewReturningState } from '../../../campaign/GiveawayExperience';
import { PreviewSpinWheel } from '../../../campaign/PreviewSpinWheel';
import {
  BUILDER_STEPS,
  type BuilderPrize,
  type BuilderState,
  emptyBuilderState,
  campaignToBuilderState,
  builderCampaignPayload,
  previewCampaignFromState,
} from './state';

function toIso(value: string) {
  if (!value) return undefined;
  return fromDateTimeLocal(value) || new Date(value).toISOString();
}

function isPersistedId(id?: string) {
  return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
}

export function CampaignBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [state, setState] = useState<BuilderState>(emptyBuilderState());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewScreen, setPreviewScreen] = useState<'page' | 'popup' | 'success' | 'returning'>('page');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPaneWidth, setPreviewPaneWidth] = useState(380);
  const [showPreview, setShowPreview] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [confirmTemplate, setConfirmTemplate] = useState<any>(null);
  const [stepBusy, setStepBusy] = useState(false);
  const debounceRef = useRef<number>();
  const knownPrizeIds = useRef<Set<string>>(new Set());
  const knownActionIds = useRef<Set<string>>(new Set());
  const knownFormFieldIds = useRef<Set<string>>(new Set());

  const patch = useCallback((partial: Partial<BuilderState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const editQuery = useQuery({
    queryKey: ['campaign-builder', id],
    enabled: isEdit,
    queryFn: async () => {
      const [campaignRes, draftRes] = await Promise.all([
        campaignApi.getById(id!),
        draftApi.get(id!).catch(() => null),
      ]);
      const campaign = campaignRes.data.data;
      const draft = draftRes?.data?.data?.draftData;
      const next = campaignToBuilderState(campaign, draft);
      knownPrizeIds.current = new Set((next.prizes || []).filter((prize) => isPersistedId(prize.id)).map((prize) => prize.id));
      knownActionIds.current = new Set((next.actions || []).filter((action) => isPersistedId(action.id)).map((action) => action.id));
      knownFormFieldIds.current = new Set((next.formFields || []).filter((field) => isPersistedId(field.id)).map((field) => field.id));
      setState(next);
      return campaign;
    },
  });

  const entitlementsQuery = useQuery({
    queryKey: ['workspace-entitlements'],
    queryFn: () => workspaceApi.entitlements(),
  });
  const allowedActionTypes = entitlementsQuery.data?.data?.data?.entitlements?.allowedActionTypes as string[] | null | undefined;

  const persistCampaignFields = async (current: BuilderState) => {
    if (!current.campaignId || current.title.trim().length < 3) return current;
    await campaignApi.update(current.campaignId, {
      ...builderCampaignPayload(current),
      startDate: toIso(current.startDate) || null,
      endDate: toIso(current.endDate) || null,
    });
    return current;
  };

  const syncCollections = async (current: BuilderState) => {
    if (!current.campaignId) return current;
    let next = current;

    const currentPrizeIds = new Set(next.prizes.filter((prize) => isPersistedId(prize.id)).map((prize) => prize.id));
    for (const id of knownPrizeIds.current) {
      if (!currentPrizeIds.has(id)) {
        await campaignApi.deletePrize(next.campaignId!, id);
      }
    }
    const prizes: BuilderPrize[] = [];
    for (const prize of next.prizes) {
      const payload = {
        name: prize.name,
        description: prize.description || undefined,
        quantity: prize.quantity,
        type: prize.type,
        value: prize.value ? Number(prize.value) : undefined,
        image: prize.image?.trim() || undefined,
      };
      if (isPersistedId(prize.id)) {
        await campaignApi.updatePrize(next.campaignId!, prize.id, payload);
        prizes.push({ ...prize, persisted: true });
      } else {
        const res = await campaignApi.addPrize(next.campaignId!, payload);
        prizes.push({ ...prize, id: res.data.data.id, persisted: true });
      }
    }
    next = { ...next, prizes };
    knownPrizeIds.current = new Set(prizes.map((prize) => prize.id));

    const currentActionIds = new Set(next.actions.filter((action) => isPersistedId(action.id)).map((action) => action.id));
    for (const id of knownActionIds.current) {
      if (!currentActionIds.has(id)) {
        await campaignApi.deleteAction(next.campaignId!, id);
      }
    }
    const actions = [];
    for (const [index, action] of next.actions.entries()) {
      const payload = {
        type: action.type,
        title: action.title,
        description: action.description,
        points: action.points,
        required: action.required,
        config: action.config,
        dailyLimit: action.dailyLimit ?? null,
        order: index,
      };
      if (isPersistedId(action.id)) {
        await campaignApi.updateAction(next.campaignId!, action.id, payload);
        actions.push({ ...action, order: index });
      } else {
        const res = await campaignApi.addAction(next.campaignId!, payload);
        const created = res.data.data;
        if (created.completionSecret) {
          toast.success('Webhook secret shown once — copy it now.');
        }
        actions.push({
          ...action,
          id: created.id,
          order: index,
          completionKey: created.completionKey,
          completionSecret: created.completionSecret,
        });
      }
    }
    next = { ...next, actions };
    knownActionIds.current = new Set(actions.map((action) => action.id));
    const persistedIds = actions.map((action) => action.id).filter(isPersistedId);
    if (persistedIds.length === actions.length && actions.length > 1) {
      await campaignApi.reorderActions(next.campaignId!, persistedIds);
    }

    const currentFieldIds = new Set((next.formFields || []).filter((field) => isPersistedId(field.id)).map((field) => field.id));
    for (const id of knownFormFieldIds.current) {
      if (!currentFieldIds.has(id)) {
        await formFieldApi.delete(id);
      }
    }
    const formFields = [];
    for (const [index, field] of (next.formFields || []).entries()) {
      const payload = {
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required,
        options: field.options,
        order: index,
      };
      if (isPersistedId(field.id)) {
        await formFieldApi.update(field.id, payload);
        formFields.push({ ...field, order: index, persisted: true });
      } else {
        const res = await formFieldApi.add(next.campaignId!, payload);
        formFields.push({ ...field, id: res.data.data.id, order: index, persisted: true });
      }
    }
    next = { ...next, formFields };
    knownFormFieldIds.current = new Set(formFields.map((field) => field.id));
    const persistedFieldIds = formFields.map((field) => field.id).filter(isPersistedId);
    if (persistedFieldIds.length > 1) {
      await formFieldApi.reorder(next.campaignId!, persistedFieldIds);
    }

    setState(next);
    return next;
  };

  const ensureCampaign = async (current: BuilderState) => {
    if (current.campaignId) return current;
    if (current.title.trim().length < 3) {
      throw new Error('Add a campaign title before continuing.');
    }
    const created = await campaignApi.create({
      ...builderCampaignPayload(current),
      startDate: toIso(current.startDate),
      endDate: toIso(current.endDate),
      title: current.title,
    });
    const campaign = created.data.data;
    const next = { ...current, campaignId: campaign.id, slug: campaign.slug, status: campaign.status };
    setState(next);
    return syncCollections(next);
  };

  const saveDraft = useCallback(async (current: BuilderState) => {
    if (!current.campaignId) return;
    setSaveStatus('saving');
    try {
      await draftApi.save(current.campaignId, {
        step: current.step,
        stepId: BUILDER_STEPS[current.step]?.id,
        title: current.title,
        description: current.description,
        featuredImage: current.featuredImage,
        featuredVideo: current.featuredVideo,
        startDate: current.startDate,
        endDate: current.endDate,
        timezone: current.timezone,
        launchMode: current.launchMode,
        requireName: current.requireName,
        requireEmail: current.requireEmail,
        requirePhone: current.requirePhone,
        enableCaptcha: current.enableCaptcha,
        maxEntriesPerUser: current.maxEntriesPerUser,
        restrictByLocation: current.restrictByLocation,
        allowedCountries: current.allowedCountries,
        enableReferrals: current.enableReferrals,
        referralBonusPoints: current.referralBonusPoints,
        showLeaderboard: current.showLeaderboard,
        requireLegalAcceptance: current.requireLegalAcceptance,
        enableSpinWheel: current.enableSpinWheel,
        spinsPerDay: current.spinsPerDay,
        displayMode: current.displayMode,
        popupTrigger: current.popupTrigger,
        popupDelay: current.popupDelay,
        popupScrollPercent: current.popupScrollPercent,
        bannerPosition: current.bannerPosition,
        slideInPosition: current.slideInPosition,
        showOnMobile: current.showOnMobile,
        embedFrequencyHours: current.embedFrequencyHours,
        theme: current.theme,
        customCss: current.customCss,
        logoUrl: current.logoUrl,
        backgroundImageUrl: current.backgroundImageUrl,
        fontFamily: current.fontFamily,
        officialRules: current.officialRules,
        termsConditions: current.termsConditions,
        privacyPolicy: current.privacyPolicy,
        prizes: current.prizes,
        actions: current.actions,
        formFields: current.formFields,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('failed');
    }
  }, []);

  useEffect(() => {
    if (!state.campaignId) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      saveDraft(state);
    }, 1100);
    return () => window.clearTimeout(debounceRef.current);
  }, [state, saveDraft]);

  const applyTemplate = (template: any) => {
    if (template.id === 'blank') {
      patch({ templateId: 'blank', step: 1 });
      return;
    }
    const config = template.config || {};
    patch({
      templateId: template.id,
      title: state.title || template.name || '',
      description: config.description || state.description,
      enableReferrals: config.enableReferrals ?? state.enableReferrals,
      referralBonusPoints: config.referralBonusPoints ?? state.referralBonusPoints,
      enableSpinWheel: Boolean(config.enableSpinWheel),
      spinsPerDay: config.spinsPerDay || 1,
      displayMode: config.displayMode || 'INLINE',
      popupTrigger: config.popupTrigger,
      popupDelay: config.popupDelay,
      theme: { ...state.theme, ...(config.theme || {}) },
      fontFamily: config.theme?.fontFamily || config.theme?.headingFont || state.fontFamily,
      actions: (config.entryActions || []).map((action: any, index: number) => ({
        id: `tpl-${index}-${Date.now()}`,
        type: action.type,
        title: action.title,
        description: action.description || '',
        points: action.points || 1,
        required: Boolean(action.required),
        order: index,
        config: action.config || {},
      })),
      prizes: (config.prizes || []).map((prize: any, index: number) => ({
        id: `tpl-prize-${index}-${Date.now()}`,
        name: prize.name,
        description: prize.description || '',
        quantity: prize.quantity || 1,
        type: prize.type || 'PHYSICAL',
        value: prize.value,
        image: prize.image || '',
      })),
      step: 1,
    });
  };

  const persistForSave = async (current: BuilderState) => {
    if (isEdit && (!editQuery.isSuccess || current.campaignId !== id)) {
      throw new Error('Campaign is still loading. Wait until the builder finishes loading before saving or publishing.');
    }
    const withId = await ensureCampaign(current);
    const withCollections = await syncCollections(withId);
    await persistCampaignFields(withCollections);
    await saveDraft(withCollections);
    return withCollections;
  };

  const goNext = async () => {
    if (stepBusy) return;
    setStepBusy(true);
    try {
      if (state.step === 1 && state.title.trim().length < 3) {
        toast.error('Title must be at least 3 characters');
        return;
      }
      let current = state;
      const stepId = BUILDER_STEPS[state.step]?.id;
      if (state.step >= 1) {
        current = await ensureCampaign(state);
        if (stepId === 'form' || stepId === 'prizes' || stepId === 'actions') {
          current = await syncCollections(current);
        }
        if (current.status === 'DRAFT' || current.status === 'SCHEDULED' || !current.status) {
          await persistCampaignFields(current);
        }
        await saveDraft(current);
      }
      const nextStep = Math.min(state.step + 1, BUILDER_STEPS.length - 1);
      patch({ step: nextStep, stepId: BUILDER_STEPS[nextStep].id });
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Could not continue'));
    } finally {
      setStepBusy(false);
    }
  };

  const publish = async () => {
    try {
      if (isEdit && (!editQuery.isSuccess || state.campaignId !== id)) {
        toast.error('Wait until the campaign finishes loading before publishing');
        return;
      }
      const current = await persistForSave(state);
      if (current.prizes.length === 0 || current.actions.length === 0) {
        toast.error('Add at least one prize and one entry action before publishing');
        return;
      }
      const nextStatus = current.launchMode === 'scheduled' && current.startDate && new Date(current.startDate) > new Date()
        ? 'SCHEDULED'
        : 'ACTIVE';
      if (nextStatus === 'SCHEDULED') {
        toast('Campaign is scheduled. The lifecycle worker will activate it when the start time arrives.');
      }
      await campaignApi.updateStatus(current.campaignId!, nextStatus);
      await queryClient.invalidateQueries({ queryKey: ['campaign', current.campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(nextStatus === 'ACTIVE' ? 'Campaign published' : 'Campaign marked scheduled');
      navigate(`/campaigns/${current.campaignId}`);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Publish failed. The campaign needs a prize and an entry action.'));
    }
  };

  const openPreview = async () => {
    try {
      const current = await persistForSave(state);
      const tokenRes = await campaignApi.createPreviewToken(current.campaignId!);
      window.open(`/preview/${tokenRes.data.data.token}`, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Preview is not available yet'));
    }
  };

  const saveAsTemplate = async () => {
    if (!state.campaignId) {
      toast.error('Save the campaign first');
      return;
    }
    const name = window.prompt('Template name', `${state.title} template`);
    if (!name) return;
    try {
      await persistForSave(state);
      await templateApi.createFromCampaign(state.campaignId, name);
      toast.success('Saved as template');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Could not save template'));
    }
  };

  const previewCampaign = useMemo(() => previewCampaignFromState(state), [state]);
  const previewWidth = previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : 960;

  const checks = [
    { ok: state.title.trim().length >= 3, label: 'Campaign title', testId: 'builder-check-title' },
    { ok: !state.startDate || !state.endDate || new Date(state.startDate) < new Date(state.endDate), label: 'Valid dates', testId: 'builder-check-dates' },
    { ok: state.prizes.length > 0, label: 'At least 1 prize', testId: 'builder-check-prize' },
    { ok: state.actions.length > 0, label: 'At least 1 entry action', testId: 'builder-check-actions' },
    { ok: state.requireEmail, label: 'Email required (recommended)', testId: 'builder-check-email' },
    { ok: Boolean(state.officialRules || state.termsConditions), label: 'Legal/rules added', testId: 'builder-check-legal' },
    { ok: Boolean(state.theme?.primaryColor), label: 'Design configured', testId: 'builder-check-design' },
  ];
  const builderReady = !isEdit || (editQuery.isSuccess && state.campaignId === id);
  const canPublish = checks[2].ok && checks[3].ok && builderReady;

  function builderHint(current: BuilderState, stepId: string) {
    if (current.title.trim().length < 3) {
      return { text: 'Recommended next: add a campaign title of at least 3 characters.', href: '/help/create-your-first-giveaway' };
    }
    if (current.prizes.length === 0) {
      return { text: 'Recommended next: add a prize. Publishing requires at least one.', href: '/help/create-your-first-giveaway' };
    }
    if (current.actions.length === 0) {
      return { text: 'Recommended next: add an entry action so visitors can earn points.', href: '/help/entry-actions-explained' };
    }
    if (stepId === 'review') {
      return { text: 'Recommended next: publish, or save a draft if you are still editing.', href: '/help/publish-a-campaign' };
    }
    return { text: `You are on ${stepId}. Templates stay available on Start — this builder is unchanged.`, href: '/help' };
  }

  if (isEdit && editQuery.isError) {
    return <p className="p-6 text-red-400">Could not load this campaign for editing.</p>;
  }
  if (isEdit && (editQuery.isLoading || !editQuery.isSuccess || state.campaignId !== id)) {
    return <PageSpinner />;
  }

  const step = BUILDER_STEPS[state.step];

  return (
    <div className="min-h-[calc(100vh-4rem)] -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8" data-testid="builder-ready">
      {/* Plain sticky — avoid motion/transform on this node (breaks position:sticky) */}
      <div className="builder-sticky-bar sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
        <div className="relative z-[1] flex items-center gap-3 min-w-0">
          <Link to={state.campaignId ? `/campaigns/${state.campaignId}` : '/campaigns'} className="p-2 rounded-lg hover:bg-zinc-800" aria-label="Back to campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="font-semibold truncate" data-testid="builder-campaign-title">{state.title || 'New campaign'}</p>
            <p className="text-xs text-zinc-500" aria-live="polite">
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'failed' && 'Save failed'}
              {saveStatus === 'idle' && (isEdit ? 'Edit mode' : 'Create mode')}
            </p>
          </div>
        </div>
        <div className="relative z-[1] flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" className="lg:hidden" data-testid="builder-toggle-preview" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button type="button" variant="secondary" size="sm" data-testid="builder-open-preview" onClick={openPreview}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="builder-save-draft"
            onClick={() =>
              persistForSave(state)
                .then(() => toast.success('Draft saved'))
                .catch((error) => toast.error(apiErrorMessage(error, 'Could not save draft')))
            }
          >
            <Save className="w-4 h-4" /> Save draft
          </Button>
        </div>
      </div>

      <div className="builder-tablist flex overflow-x-auto gap-1.5 px-4 py-2.5 border-b border-zinc-800" role="tablist" aria-label="Campaign builder steps">
        {BUILDER_STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === state.step}
            onClick={() => patch({ step: index })}
            className="builder-tab px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70"
          >
            <span className="builder-tab__index">{index + 1}</span>
            <span className="builder-tab__label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] min-h-[70vh]">
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
          <h2 className="text-lg font-semibold tracking-tight">{step.label}</h2>
          <div className="text-sm" data-testid="builder-guidance">
            <p className="text-zinc-500">
              {builderHint(state, step.id).text}{' '}
              <Link to={builderHint(state, step.id).href} className="text-primary-400">Help</Link>
            </p>
            <p className="text-xs text-zinc-500 mt-1">Setup {checks.filter((item) => item.ok).length}/{checks.length} ready</p>
          </div>

          {step.id === 'start' && (
            <TemplateGallery
              selectedId={state.templateId}
              onSelect={(template) => {
                if (template.id === 'blank') {
                  applyTemplate(template);
                  return;
                }
                if (state.title || state.actions.length || state.prizes.length) {
                  setConfirmTemplate(template);
                  return;
                }
                applyTemplate(template);
              }}
            />
          )}

          {step.id === 'basics' && (
            <div className="space-y-4 max-w-xl">
              <Input label="Campaign title" value={state.title} onChange={(e) => patch({ title: e.target.value })} required />
              <label className="block text-sm text-zinc-400" htmlFor="campaign-description">Description</label>
              <textarea id="campaign-description" className="input min-h-[100px] py-2" value={state.description} onChange={(e) => patch({ description: e.target.value })} />
              {state.slug && <p className="text-sm text-zinc-500">Public URL: /c/{state.slug} (slug is generated automatically)</p>}
              <Input label="Featured image URL" value={state.featuredImage} onChange={(e) => patch({ featuredImage: e.target.value })} placeholder="https://" />
              <Input
                label="Featured video URL"
                value={state.featuredVideo}
                onChange={(e) => patch({ featuredVideo: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://cdn.example.com/hero.mp4"
              />
              <p className="text-xs text-zinc-500">YouTube, Vimeo, or a direct mp4/webm URL. Arbitrary iframe HTML is not allowed.</p>
            </div>
          )}

          {step.id === 'schedule' && (
            <div className="space-y-4 max-w-xl">
              <p className="text-sm text-zinc-400">
                The lifecycle worker activates scheduled campaigns when the start time arrives and ends them when the end time passes. Public pages stay closed until the campaign is Active and within its window.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateTimePicker label="Start" value={state.startDate} onChange={(startDate) => patch({ startDate, launchMode: 'scheduled' })} />
                <DateTimePicker label="End" value={state.endDate} onChange={(endDate) => patch({ endDate })} />
              </div>
              <Input label="Timezone" value={state.timezone} onChange={(e) => patch({ timezone: e.target.value })} />
              <fieldset className="space-y-3 text-sm">
                <legend className="font-medium mb-1">Launch</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    {
                      value: 'immediate' as const,
                      label: 'Launch immediately',
                      hint: 'Go live as soon as you publish',
                    },
                    {
                      value: 'scheduled' as const,
                      label: 'Schedule launch',
                      hint: 'Lifecycle worker activates at start time',
                    },
                  ]).map((option) => {
                    const selected = state.launchMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => patch({ launchMode: option.value })}
                        className={`relative text-left p-4 card-interactive group ${
                          selected ? 'card-interactive-selected' : ''
                        }`}
                      >
                        <span
                          className={`inline-flex h-4 w-4 rounded-full border mb-3 items-center justify-center ${
                            selected ? 'border-primary-400 bg-primary-500/20' : 'border-zinc-600'
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-primary-400" />}
                        </span>
                        <p className="font-medium group-hover:text-primary-300 transition-colors duration-[400ms]">
                          {option.label}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{option.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {step.id === 'eligibility' && (
            <div className="space-y-3 max-w-xl text-sm">
              {[
                ['requireName', 'Require name'],
                ['requireEmail', 'Require email'],
                ['requirePhone', 'Require phone'],
                ['enableCaptcha', 'Enable CAPTCHA'],
                ['restrictByLocation', 'Restrict by country'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={(state as any)[key]} onChange={(e) => patch({ [key]: e.target.checked } as any)} />
                  {label}
                </label>
              ))}
              <Input label="Allowed countries (comma-separated ISO codes)" value={state.allowedCountries} onChange={(e) => patch({ allowedCountries: e.target.value })} />
              <Input label="Max entries per user (optional)" type="number" min={1} value={state.maxEntriesPerUser} onChange={(e) => patch({ maxEntriesPerUser: e.target.value })} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={state.businessEmailOnly} onChange={(e) => patch({ businessEmailOnly: e.target.checked })} />
                Business email only (reject common free inbox providers)
              </label>
              <p className="text-xs text-zinc-500">This is not a company-identity check. It only blocks well-known consumer email domains.</p>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={state.allowPrefill} onChange={(e) => patch({ allowPrefill: e.target.checked })} />
                Allow URL prefill (?email=, ?name=, custom field keys)
              </label>
              <p className="text-xs text-zinc-500">Prefill never auto-submits and does not replace an existing participant session.</p>
            </div>
          )}

          {step.id === 'form' && (
            <CustomFormBuilder fields={state.formFields} onChange={(formFields) => patch({ formFields })} />
          )}

          {step.id === 'prizes' && (
            <PrizeStep state={state} patch={patch} />
          )}

          {step.id === 'actions' && (
            <EntryActionBuilder
              actions={state.actions}
              onChange={(actions) => patch({ actions })}
              allowedActionTypes={allowedActionTypes}
            />
          )}

          {step.id === 'referrals' && (
            <div className="space-y-4 max-w-xl">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={state.enableReferrals} onChange={(e) => patch({ enableReferrals: e.target.checked })} />
                Enable referrals
              </label>
              <Input label="Referral bonus points" type="number" min={0} value={state.referralBonusPoints} onChange={(e) => patch({ referralBonusPoints: parseInt(e.target.value) || 0 })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={state.showLeaderboard} onChange={(e) => patch({ showLeaderboard: e.target.checked })} />
                Show public leaderboard
              </label>
              <p className="text-sm text-zinc-500">Existing campaigns keep the leaderboard visible unless you turn this off.</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.enableSpinWheel}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    patch({ enableSpinWheel: enabled });
                    if (enabled && state.campaignId) {
                      spinWheelApi.createDefaultSegments(state.campaignId).catch(() => undefined);
                    }
                  }}
                />
                Enable spin wheel
              </label>
              {state.enableSpinWheel && (
                <div className="space-y-3">
                  <Input label="Spins per day" type="number" min={1} value={state.spinsPerDay} onChange={(e) => patch({ spinsPerDay: parseInt(e.target.value) || 1 })} />
                  <PreviewSpinWheel campaign={previewCampaign} size={240} interactive caption="This is the wheel participants see after they enter." />
                </div>
              )}
            </div>
          )}

          {step.id === 'legal' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">This uses a rules template generator, not an AI model. Review with legal counsel before publishing.</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={state.requireLegalAcceptance} onChange={(e) => patch({ requireLegalAcceptance: e.target.checked })} />
                Require participants to accept legal documents before entering
              </label>
              <RulesGenerator campaignId={state.campaignId} onRulesGenerated={(rules) => patch({ officialRules: rules })} />
              <label className="block text-sm text-zinc-400" htmlFor="official-rules">Official rules</label>
              <textarea id="official-rules" className="input min-h-[160px] py-2" value={state.officialRules} onChange={(e) => patch({ officialRules: e.target.value })} />
              <label className="block text-sm text-zinc-400" htmlFor="terms">Terms</label>
              <textarea id="terms" className="input min-h-[100px] py-2" value={state.termsConditions} onChange={(e) => patch({ termsConditions: e.target.value })} />
              <label className="block text-sm text-zinc-400" htmlFor="privacy">Privacy policy</label>
              <textarea id="privacy" className="input min-h-[100px] py-2" value={state.privacyPolicy} onChange={(e) => patch({ privacyPolicy: e.target.value })} />
            </div>
          )}

          {step.id === 'design' && (
            <div className="space-y-6">
              <ThemeSelector value={state.theme} onChange={(theme) => patch({ theme: { ...state.theme, ...theme }, fontFamily: theme.headingFont || theme.fontFamily || state.fontFamily })} />
              <Input label="Logo URL" value={state.logoUrl} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://" />
              <Input
                label="Background image URL"
                value={state.backgroundImageUrl}
                onChange={(e) => patch({ backgroundImageUrl: e.target.value, theme: { ...state.theme, backgroundImage: e.target.value } })}
                placeholder="https://"
              />
              <label className="block text-sm text-zinc-400" htmlFor="custom-css">Custom CSS (sanitized on save; do not paste HTML)</label>
              <textarea id="custom-css" className="input min-h-[120px] font-mono text-sm" value={state.customCss} onChange={(e) => patch({ customCss: e.target.value })} placeholder=".giveaway-root h1 { letter-spacing: 0.02em; }" />
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <p className="text-sm text-zinc-400">Campaign tracking pixels (IDs only — not integrations, no custom JavaScript)</p>
                <Input label="Meta Pixel ID" value={state.facebookPixelId} onChange={(e) => patch({ facebookPixelId: e.target.value })} placeholder="1234567890" />
                <Input label="Google Ads ID" value={state.googleAdsId} onChange={(e) => patch({ googleAdsId: e.target.value })} placeholder="AW-123456" />
                <Input label="X Pixel ID" value={state.twitterPixelId} onChange={(e) => patch({ twitterPixelId: e.target.value })} placeholder="o123" />
              </div>
              <LivePreview campaign={previewCampaign} />
            </div>
          )}

          {step.id === 'display' && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">These settings are saved on the campaign and honored by the third-party widget runtime (inline, popup, banner, slide-in).</p>
              <DisplayModeSettings
                value={{
                  displayMode: state.displayMode,
                  popupTrigger: state.popupTrigger,
                  popupDelay: state.popupDelay,
                  popupScrollPercent: state.popupScrollPercent,
                  bannerPosition: state.bannerPosition,
                  slideInPosition: state.slideInPosition,
                  showOnMobile: state.showOnMobile,
                  embedFrequencyHours: state.embedFrequencyHours,
                }}
                onChange={(value) => patch(value)}
              />
            </div>
          )}

          {step.id === 'review' && (
            <div className="space-y-4">
              <Card className="p-4 space-y-2 border-primary-500/25 bg-zinc-900/50">
                {checks.map((item) => (
                  <p
                    key={item.label}
                    data-testid={item.testId}
                    data-ok={item.ok ? 'true' : 'false'}
                    className={item.ok ? 'text-emerald-400' : 'text-amber-400'}
                  >
                    {item.ok ? '✓' : '○'} {item.label}
                  </p>
                ))}
              </Card>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" data-testid="builder-save-draft-review" onClick={() => persistForSave(state).then(() => toast.success('Draft saved')).catch((error) => toast.error(apiErrorMessage(error, 'Could not save draft')))}>Save draft</Button>
                <Button type="button" variant="secondary" data-testid="builder-preview-review" onClick={openPreview}>Preview</Button>
                <Button type="button" variant="secondary" onClick={saveAsTemplate}>Save as template</Button>
                <Button type="button" data-testid="builder-publish" onClick={publish} disabled={!canPublish}><Play className="w-4 h-4" /> Publish / Activate</Button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 sticky bottom-0 bg-zinc-950/95 py-3 lg:static">
            <Button type="button" variant="secondary" disabled={state.step === 0} onClick={() => patch({ step: state.step - 1, stepId: BUILDER_STEPS[state.step - 1]?.id })}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {state.step < BUILDER_STEPS.length - 1 && (
              <Button type="button" data-testid="builder-next" onClick={goNext} loading={stepBusy} disabled={stepBusy}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div
          className={`${showPreview ? 'block' : 'hidden'} lg:block border-l border-zinc-800 bg-zinc-950 p-3 min-w-0 relative`}
          style={{ width: '100%', maxWidth: previewPaneWidth }}
          data-testid="builder-preview-pane"
        >
          <div
            className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500/40"
            data-testid="builder-preview-resize"
            onMouseDown={(event) => {
              event.preventDefault();
              const startX = event.clientX;
              const startWidth = previewPaneWidth;
              const onMove = (move: MouseEvent) => {
                setPreviewPaneWidth(Math.min(640, Math.max(280, startWidth - (move.clientX - startX))));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
          <div className="flex justify-center gap-1.5 mb-3 flex-wrap border-b border-zinc-800/80 pb-3" data-testid="builder-preview-toolbar">
            {([
              ['page', 'Giveaway'],
              ['popup', 'Popup'],
              ['success', 'Success'],
              ['returning', 'Returning'],
            ] as const).map(([screen, label]) => (
              <button
                key={screen}
                type="button"
                data-testid={`preview-screen-${screen}`}
                aria-pressed={previewScreen === screen}
                onClick={() => setPreviewScreen(screen)}
                className={`px-2.5 py-1 rounded-md text-xs ring-offset-2 ring-offset-zinc-950 ${previewScreen === screen ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'}`}
              >
                {label}
              </button>
            ))}
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
              <button
                key={device}
                type="button"
                data-testid={`preview-device-${device}`}
                onClick={() => setPreviewDevice(device)}
                className={`p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${previewDevice === device ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'}`}
                aria-label={device}
                aria-pressed={previewDevice === device}
              >
                {device === 'desktop' && <Monitor className="w-4 h-4" />}
                {device === 'tablet' && <Tablet className="w-4 h-4" />}
                {device === 'mobile' && <Smartphone className="w-4 h-4" />}
              </button>
            ))}
            <button
              type="button"
              data-testid="preview-reset-zoom"
              className="px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100"
              onClick={() => setPreviewZoom(1)}
            >
              <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
            </button>
            <button
              type="button"
              data-testid="preview-fit"
              className="px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100"
              onClick={() => setPreviewZoom(previewDevice === 'mobile' ? 0.85 : previewDevice === 'tablet' ? 0.9 : 1)}
            >
              <Maximize2 className="w-3 h-3 inline mr-1" /> Fit
            </button>
          </div>
          <div
            className="mx-auto overflow-auto border border-zinc-800 rounded-xl"
            style={{ width: '100%', maxWidth: Math.min(previewWidth, 640), maxHeight: 640 }}
            data-testid="builder-preview-frame"
            data-preview-screen={previewScreen}
            data-preview-device={previewDevice}
          >
            <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }}>
              <GiveawayExperience
                campaign={previewCampaign}
                mode="preview"
                previewState={previewScreen}
                displayModeOverride={previewScreen === 'popup' ? 'POPUP' : state.displayMode}
                main={previewScreen === 'returning' ? <PreviewReturningState campaign={previewCampaign} /> : <PreviewEntryForm campaign={previewCampaign} />}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(confirmTemplate)}
        onClose={() => setConfirmTemplate(null)}
        title="Replace current builder data?"
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmTemplate(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!confirmTemplate) return;
                applyTemplate(confirmTemplate);
                setConfirmTemplate(null);
              }}
            >
              Apply template
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-400">
          Applying this template can overwrite actions, prizes, and theme values you already edited.
        </p>
      </Modal>
    </div>
  );
}

function PrizeStep({ state, patch }: { state: BuilderState; patch: (partial: Partial<BuilderState>) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<BuilderPrize['type']>('PHYSICAL');
  const [value, setValue] = useState('');
  const [image, setImage] = useState('');

  const add = () => {
    if (!name.trim()) return toast.error('Prize name is required');
    patch({
      prizes: [
        ...state.prizes,
        {
          id: `local-${Date.now()}`,
          name: name.trim(),
          description,
          quantity,
          type,
          value: value ? Number(value) : undefined,
          image,
        },
      ],
    });
    setName('');
    setDescription('');
    setQuantity(1);
    setValue('');
    setImage('');
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Input label="Prize name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
        <label className="space-y-2">
          <span className="label">Type</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as BuilderPrize['type'])}>
            <option value="PHYSICAL">Physical</option>
            <option value="DIGITAL">Digital</option>
            <option value="DISCOUNT">Discount</option>
            <option value="EXPERIENCE">Experience</option>
          </select>
        </label>
      </div>
      <Input label="Value (optional)" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
      <Input label="Image URL (optional)" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://" />
      <Button type="button" data-testid="builder-add-prize" onClick={add}>Add prize</Button>
      <div className="divide-y divide-zinc-800/70">
        {state.prizes.map((prize) => (
          <div key={prize.id} className="py-3 flex justify-between gap-3 text-sm">
            <span>{prize.name} ×{prize.quantity} · {prize.type}</span>
            <button type="button" className="text-red-400 text-sm" onClick={() => patch({ prizes: state.prizes.filter((item) => item.id !== prize.id) })}>Remove</button>
          </div>
        ))}
        {state.prizes.length === 0 && <p className="text-sm text-zinc-500 py-2">No prizes yet. Add one before publishing.</p>}
      </div>
    </div>
  );
}
