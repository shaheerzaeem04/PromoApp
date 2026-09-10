import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { themeApi } from '../../services/api';
import { Button, Input, Modal } from '../ui';

interface Theme {
  id: string;
  name: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor?: string;
  textColor: string;
  mutedTextColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  accentColor: string;
  fontFamily: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius: string;
  backgroundImage?: string;
}

interface ThemeSelectorProps {
  value: Partial<Theme>;
  onChange: (theme: Partial<Theme>) => void;
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const color = value || fallback;
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-0"
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customTheme, setCustomTheme] = useState<Partial<Theme>>(value);

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const res = await themeApi.getAll();
      return res.data.data as Theme[];
    },
  });

  const { data: fontsData } = useQuery({
    queryKey: ['fonts'],
    queryFn: async () => {
      const res = await themeApi.getFonts();
      return res.data.data as string[];
    },
  });

  const themes = themesData || [];
  const fonts = fontsData || ['Inter', 'Poppins', 'Roboto'];

  useEffect(() => {
    setCustomTheme(value);
  }, [value]);

  const selectPreset = (theme: Theme) => {
    onChange({
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      accentColor: theme.accentColor,
      fontFamily: theme.fontFamily,
      headingFont: theme.headingFont || theme.fontFamily,
      bodyFont: theme.bodyFont || theme.fontFamily,
      buttonColor: theme.primaryColor,
      borderRadius: theme.borderRadius,
    });
  };

  const applyCustomTheme = () => {
    onChange(customTheme);
    setShowCustomizer(false);
  };

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Theme Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themes.map((theme) => {
            const isSelected = value.primaryColor === theme.primaryColor && 
                              value.backgroundColor === theme.backgroundColor;
            return (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectPreset(theme)}
                className={`relative p-3 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary-500 ring-2 ring-primary-500/20' 
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {/* Theme Preview */}
                <div 
                  className="h-16 rounded-lg mb-2 overflow-hidden"
                  style={{ backgroundColor: theme.backgroundColor }}
                >
                  <div className="flex items-center justify-center h-full gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium truncate">{theme.name}</p>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-primary-500">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Customize Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setShowCustomizer(true)}
        className="w-full"
      >
        <Palette className="w-4 h-4" />
        Customize Theme
      </Button>

      {/* Customizer Modal */}
      <Modal 
        isOpen={showCustomizer} 
        onClose={() => setShowCustomizer(false)}
        title="Customize Theme"
        size="lg"
      >
        <div className="space-y-6">
          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Primary Color" value={customTheme.primaryColor} fallback="#6366f1" onChange={(primaryColor) => setCustomTheme({ ...customTheme, primaryColor })} />
            <ColorField label="Secondary Color" value={customTheme.secondaryColor} fallback="#8b5cf6" onChange={(secondaryColor) => setCustomTheme({ ...customTheme, secondaryColor })} />
            <ColorField label="Background Color" value={customTheme.backgroundColor} fallback="#18181b" onChange={(backgroundColor) => setCustomTheme({ ...customTheme, backgroundColor })} />
            <ColorField label="Surface / Card" value={customTheme.surfaceColor} fallback="#18181b" onChange={(surfaceColor) => setCustomTheme({ ...customTheme, surfaceColor })} />
            <ColorField label="Text Color" value={customTheme.textColor} fallback="#ffffff" onChange={(textColor) => setCustomTheme({ ...customTheme, textColor })} />
            <ColorField label="Muted Text" value={customTheme.mutedTextColor} fallback="#a1a1aa" onChange={(mutedTextColor) => setCustomTheme({ ...customTheme, mutedTextColor })} />
            <ColorField label="Button Color" value={customTheme.buttonColor} fallback="#6366f1" onChange={(buttonColor) => setCustomTheme({ ...customTheme, buttonColor })} />
            <ColorField label="Button Text" value={customTheme.buttonTextColor} fallback="#ffffff" onChange={(buttonTextColor) => setCustomTheme({ ...customTheme, buttonTextColor })} />
            <ColorField label="Accent Color" value={customTheme.accentColor} fallback="#22c55e" onChange={(accentColor) => setCustomTheme({ ...customTheme, accentColor })} />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Border Radius</label>
              <Input
                value={customTheme.borderRadius || '12px'}
                onChange={(e) => setCustomTheme({ ...customTheme, borderRadius: e.target.value })}
                placeholder="12px"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Type className="w-4 h-4 inline-block mr-1" />
              Heading font
            </label>
            <div className="grid grid-cols-3 gap-2">
              {fonts.map((font) => (
                <button
                  key={`heading-${font}`}
                  type="button"
                  onClick={() => setCustomTheme({ ...customTheme, headingFont: font, fontFamily: customTheme.bodyFont || font })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    (customTheme.headingFont || customTheme.fontFamily) === font
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Type className="w-4 h-4 inline-block mr-1" />
              Body font
            </label>
            <div className="grid grid-cols-3 gap-2">
              {fonts.map((font) => (
                <button
                  key={`body-${font}`}
                  type="button"
                  onClick={() => setCustomTheme({ ...customTheme, bodyFont: font, fontFamily: font })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    (customTheme.bodyFont || customTheme.fontFamily) === font
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <ImageIcon className="w-4 h-4 inline-block mr-1" />
              Background Image URL (optional)
            </label>
            <Input
              value={customTheme.backgroundImage || ''}
              onChange={(e) => setCustomTheme({ ...customTheme, backgroundImage: e.target.value })}
              placeholder="https://example.com/background.jpg"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Preview</label>
            <div 
              className="p-6 rounded-xl"
              style={{ 
                backgroundColor: customTheme.backgroundColor || '#18181b',
                backgroundImage: customTheme.backgroundImage ? `url(${customTheme.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                fontFamily: customTheme.fontFamily || 'Inter',
              }}
            >
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: customTheme.textColor || '#ffffff' }}
              >
                Sample Heading
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: customTheme.textColor || '#ffffff', opacity: 0.8 }}
              >
                This is how your campaign will look with these colors.
              </p>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: customTheme.buttonColor || customTheme.primaryColor || '#6366f1',
                    color: customTheme.buttonTextColor || '#ffffff',
                    borderRadius: customTheme.borderRadius || '12px',
                  }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: customTheme.accentColor || '#22c55e',
                    color: '#ffffff',
                    borderRadius: customTheme.borderRadius || '12px',
                  }}
                >
                  Accent Button
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setShowCustomizer(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={applyCustomTheme}>
              Apply Theme
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

