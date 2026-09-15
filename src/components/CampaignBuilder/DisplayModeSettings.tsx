import { motion } from 'framer-motion';
import { 
  Layout, 
  Maximize2, 
  ArrowDownToLine, 
  SidebarClose,
  Clock,
  MousePointer,
  ArrowDown,
  LogOut,
  Smartphone,
  Check,
} from 'lucide-react';
import { Card, Input, Select, Checkbox } from '../ui';

interface DisplayModeSettingsProps {
  value: {
    displayMode: string;
    popupTrigger?: string;
    popupDelay?: number;
    popupScrollPercent?: number;
    bannerPosition?: string;
    slideInPosition?: string;
    showOnMobile?: boolean;
    embedFrequencyHours?: number;
  };
  onChange: (value: any) => void;
}

const displayModes = [
  { 
    value: 'INLINE', 
    label: 'Inline / Embedded', 
    icon: Layout,
    description: 'Embed directly into your page content',
    color: 'from-blue-500 to-blue-600',
  },
  { 
    value: 'POPUP', 
    label: 'Popup Modal', 
    icon: Maximize2,
    description: 'Display in a centered modal overlay',
    color: 'from-purple-500 to-purple-600',
  },
  { 
    value: 'BANNER', 
    label: 'Banner', 
    icon: ArrowDownToLine,
    description: 'Fixed banner at top or bottom of page',
    color: 'from-emerald-500 to-emerald-600',
  },
  { 
    value: 'SLIDE_IN', 
    label: 'Slide-in Panel', 
    icon: SidebarClose,
    description: 'Slides in from the side of the screen',
    color: 'from-amber-500 to-amber-600',
  },
];

const popupTriggers = [
  { value: 'immediate', label: 'Immediately', icon: Clock, description: 'Show as soon as page loads' },
  { value: 'delay', label: 'After Delay', icon: Clock, description: 'Show after X seconds' },
  { value: 'scroll', label: 'On Scroll', icon: ArrowDown, description: 'Show when user scrolls down' },
  { value: 'exit_intent', label: 'Exit Intent', icon: LogOut, description: 'Show when user tries to leave' },
  { value: 'click', label: 'On Click', icon: MousePointer, description: 'Show when user clicks a button' },
];

const bannerPositions = [
  { value: 'top', label: 'Top of Page' },
  { value: 'bottom', label: 'Bottom of Page' },
];

export function DisplayModeSettings({ value, onChange }: DisplayModeSettingsProps) {
  const showPopupOptions = value.displayMode === 'POPUP' || value.displayMode === 'SLIDE_IN';
  const showBannerOptions = value.displayMode === 'BANNER';

  return (
    <div className="space-y-6">
      {/* Display Mode Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Display Mode</h3>
        <p className="text-zinc-400 text-sm mb-4">Choose how your giveaway appears to visitors</p>
        
        <div className="grid grid-cols-2 gap-3">
          {displayModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = value.displayMode === mode.value;
            
            return (
              <motion.button
                key={mode.value}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ ...value, displayMode: mode.value })}
                className={`relative p-4 text-left card-interactive group ${
                  isSelected ? 'card-interactive-selected' : ''
                }`}
              >
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${mode.color} mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-medium mb-1 group-hover:text-primary-300 transition-colors duration-[400ms]">{mode.label}</h4>
                <p className="text-sm text-zinc-400">{mode.description}</p>
                
                {isSelected && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-primary-500">
                    <Check className="w-3 h-3 text-zinc-950" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Popup Trigger Options */}
      {showPopupOptions && (
        <Card className="p-4 border border-zinc-800">
          <h4 className="font-medium mb-3">Trigger Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">When to show</label>
              <div className="grid grid-cols-2 gap-2">
                {popupTriggers.map((trigger) => {
                  const Icon = trigger.icon;
                  const isSelected = value.popupTrigger === trigger.value;
                  
                  return (
                    <button
                      key={trigger.value}
                      type="button"
                      onClick={() => onChange({ ...value, popupTrigger: trigger.value })}
                      className={`p-3 text-left flex items-start gap-3 card-interactive ${
                        isSelected ? 'card-interactive-selected' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium">{trigger.label}</p>
                        <p className="text-xs text-zinc-500">{trigger.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {value.popupTrigger === 'delay' && (
              <Input
                label="Delay (seconds)"
                type="number"
                min={1}
                max={60}
                value={value.popupDelay || 5}
                onChange={(e) => onChange({ ...value, popupDelay: parseInt(e.target.value) || 5 })}
              />
            )}

            {value.popupTrigger === 'scroll' && (
              <Input
                label="Scroll depth (%)"
                type="number"
                min={1}
                max={100}
                value={value.popupScrollPercent || 50}
                onChange={(e) => onChange({ ...value, popupScrollPercent: parseInt(e.target.value) || 50 })}
              />
            )}

            <Input
              label="Frequency cap (hours)"
              type="number"
              min={0}
              max={8760}
              value={value.embedFrequencyHours ?? 24}
              onChange={(e) => onChange({ ...value, embedFrequencyHours: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-zinc-500">0 means do not show again after dismiss. Stored on this browser for this campaign and host.</p>
          </div>
        </Card>
      )}

      {value.displayMode === 'SLIDE_IN' && (
        <Card className="p-4 border border-zinc-800">
          <h4 className="font-medium mb-3">Slide-in Settings</h4>
          <Select
            label="Side"
            options={[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }]}
            value={value.slideInPosition || 'right'}
            onChange={(e) => onChange({ ...value, slideInPosition: e.target.value })}
          />
        </Card>
      )}
      {showBannerOptions && (
        <Card className="p-4 border border-zinc-800">
          <h4 className="font-medium mb-3">Banner Settings</h4>
          
          <Select
            label="Position"
            options={bannerPositions}
            value={value.bannerPosition || 'top'}
            onChange={(e) => onChange({ ...value, bannerPosition: e.target.value })}
          />
        </Card>
      )}

      {/* Mobile Settings */}
      <Card className="p-4 border border-zinc-800">
        <Checkbox
          indicator="end"
          className="cursor-pointer"
          isSelected={value.showOnMobile !== false}
          onChange={(checked) => onChange({ ...value, showOnMobile: checked })}
        >
          <span className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-zinc-400" />
            <span>
              <span className="block font-medium">Show on Mobile</span>
              <span className="block text-sm text-zinc-400">Display on phones and tablets</span>
            </span>
          </span>
        </Checkbox>
      </Card>

      {/* Preview Hint */}
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-300">Preview:</strong> Use the preview button to see how your 
          {value.displayMode === 'POPUP' ? ' popup' : 
           value.displayMode === 'BANNER' ? ' banner' : 
           value.displayMode === 'SLIDE_IN' ? ' slide-in panel' : 
           ' embedded widget'} will appear to visitors.
        </p>
      </div>
    </div>
  );
}

