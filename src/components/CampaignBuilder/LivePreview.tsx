import { useState } from 'react';
import { Eye, Monitor, Smartphone, Tablet, Maximize2, RotateCcw } from 'lucide-react';
import { Button, Modal } from '../ui';
import { GiveawayExperience, PreviewEntryForm, PreviewReturningState } from '../../campaign/GiveawayExperience';

interface LivePreviewProps {
  campaign: Record<string, any>;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ScreenType = 'page' | 'popup' | 'success' | 'returning';

const deviceSizes: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 1440, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export function LivePreview({ campaign }: LivePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [screen, setScreen] = useState<ScreenType>('page');
  const [fit, setFit] = useState(true);
  const deviceConfig = deviceSizes[device];
  const width = fit ? Math.min(deviceConfig.width, 720) : deviceConfig.width;

  const main =
    screen === 'returning' ? (
      <PreviewReturningState campaign={campaign} />
    ) : (
      <PreviewEntryForm campaign={campaign} />
    );

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        <Eye className="w-4 h-4" />
        Preview
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Design studio preview" size="xl">
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-1.5 border-b border-zinc-800 pb-3" data-testid="preview-toolbar">
            {(['page', 'popup', 'success', 'returning'] as ScreenType[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScreen(item)}
                className={`px-3 py-1.5 rounded-md text-sm ${screen === item ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'}`}
              >
                {item === 'page' ? 'Giveaway' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
            <span className="w-px bg-zinc-700 mx-1" />
            {([
              { type: 'desktop' as DeviceType, icon: Monitor, label: 'Desktop' },
              { type: 'tablet' as DeviceType, icon: Tablet, label: 'Tablet' },
              { type: 'mobile' as DeviceType, icon: Smartphone, label: 'Mobile' },
            ]).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setDevice(type)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${device === type ? 'bg-primary-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
            <button type="button" className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400" onClick={() => setFit((value) => !value)}>
              <Maximize2 className="w-4 h-4 inline mr-1" />
              {fit ? 'Fit' : 'Actual'}
            </button>
            <button type="button" className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400" onClick={() => { setDevice('desktop'); setScreen('page'); setFit(true); }}>
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Reset
            </button>
          </div>

          <div className="flex justify-center py-4 bg-zinc-950 rounded-xl overflow-auto">
            <div
              style={{ width, height: Math.min(deviceConfig.height, 520) }}
              className="bg-zinc-900 rounded-xl overflow-auto border border-zinc-700"
              data-testid="preview-frame"
              data-preview-screen={screen}
              data-preview-device={device}
            >
              <GiveawayExperience
                campaign={campaign}
                mode="preview"
                previewState={screen}
                displayModeOverride={screen === 'popup' ? 'POPUP' : campaign.displayMode}
                main={main}
              />
            </div>
          </div>
          <p className="text-center text-sm text-zinc-500">
            Same renderer as the hosted page. Preview never creates participants.
          </p>
        </div>
      </Modal>
    </>
  );
}
