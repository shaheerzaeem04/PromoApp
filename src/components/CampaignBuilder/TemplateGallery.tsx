import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Sparkles, 
  Users, 
  Mail, 
  Target,
  Snowflake,
  Zap,
  Check,
} from 'lucide-react';
import { templateApi } from '../../services/api';
import { Card, Button, PageSpinner } from '../ui';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  config: Record<string, any>;
  isPublic: boolean;
}

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  selectedId?: string;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'product-launch': Target,
  'holiday': Snowflake,
  'social-growth': Users,
  'email-growth': Mail,
  'instant-win': Sparkles,
  'minimal': Zap,
  'custom': Gift,
  'general': Gift,
};

const categoryColors: Record<string, string> = {
  'product-launch': 'from-blue-500 to-cyan-500',
  'holiday': 'from-red-500 to-green-500',
  'social-growth': 'from-pink-500 to-rose-500',
  'email-growth': 'from-indigo-500 to-blue-500',
  'instant-win': 'from-amber-500 to-orange-500',
  'minimal': 'from-zinc-500 to-zinc-600',
  'custom': 'from-purple-500 to-violet-500',
  'general': 'from-emerald-500 to-teal-500',
};

export function TemplateGallery({ onSelect, selectedId }: TemplateGalleryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templateApi.getAll();
      return res.data.data as Template[];
    },
  });

  const templates = data || [];

  if (isLoading) {
    return <PageSpinner />;
  }

  const categoryLabels: Record<string, string> = {
    'product-launch': 'Product Launch',
    'holiday': 'Holiday & Seasonal',
    'social-growth': 'Social Media Growth',
    'email-growth': 'Email List Building',
    'instant-win': 'Instant Win / Spin Wheel',
    'minimal': 'Minimal & Simple',
    'custom': 'Your Templates',
    'general': 'General Purpose',
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500">Pick a blank campaign or a pre-built template.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect({ id: 'blank', name: 'Blank', category: 'blank', config: {}, isPublic: false })}
          className={`relative text-left p-4 min-h-[148px] card-interactive group ${
            selectedId === 'blank' ? 'card-interactive-selected' : 'border-dashed'
          }`}
        >
          <div className="h-16 rounded-lg mb-3 bg-zinc-800/80 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors duration-[400ms]">
            <Zap className="w-6 h-6 text-zinc-400 group-hover:text-primary-300 transition-colors duration-[400ms]" />
          </div>
          <p className="font-semibold group-hover:text-primary-300 transition-colors duration-[400ms]">Start from Scratch</p>
          <p className="text-sm text-zinc-400 mt-0.5">Build your campaign step by step</p>
          {selectedId === 'blank' && (
            <div className="absolute top-3 right-3 p-1 rounded-full bg-primary-500">
              <Check className="w-3.5 h-3.5 text-zinc-950" />
            </div>
          )}
        </motion.button>

        {templates.map((template) => {
          const Icon = categoryIcons[template.category] || Gift;
          const colorClass = categoryColors[template.category] || 'from-zinc-500 to-zinc-600';
          const isSelected = selectedId === template.id;
          const config = template.config as Record<string, any>;

          return (
            <motion.button
              key={template.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(template)}
              className={`relative text-left p-4 min-h-[148px] card-interactive group ${
                isSelected ? 'card-interactive-selected' : ''
              }`}
            >
              <div
                className={`h-16 rounded-lg mb-3 bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                style={template.thumbnail ? {
                  backgroundImage: `url(${template.thumbnail})`,
                  backgroundSize: 'cover',
                } : undefined}
              >
                <Icon className="w-6 h-6 text-white/90" />
              </div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
                {categoryLabels[template.category] || template.category}
              </p>
              <h4 className="font-semibold group-hover:text-primary-300 transition-colors duration-[400ms]">{template.name}</h4>
              <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">{template.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                {config.entryActions && (
                  <span>{config.entryActions.length} entry actions</span>
                )}
                {config.enableSpinWheel && (
                  <span className="text-amber-400">Spin wheel</span>
                )}
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-primary-500">
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
                </div>
              )}
              {!template.isPublic && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-zinc-800/90 border border-primary-500/20 text-zinc-300 text-[11px]">
                  Your template
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
          <p className="text-zinc-400 mb-4">Templates will appear here once they are created.</p>
          <Button onClick={() => onSelect({ id: 'blank', name: 'Blank', category: 'blank', config: {}, isPublic: false })}>
            Start from Scratch
          </Button>
        </Card>
      )}
    </div>
  );
}

