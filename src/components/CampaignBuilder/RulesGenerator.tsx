import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { rulesApi } from '../../services/api';
import { Card, Button, Input, Modal } from '../ui';

interface RulesGeneratorProps {
  campaignId?: string;
  onRulesGenerated?: (rules: string) => void;
}

export function RulesGenerator({ campaignId, onRulesGenerated }: RulesGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [rulesType, setRulesType] = useState<'full' | 'simple'>('full');
  const [sponsorInfo, setSponsorInfo] = useState({
    sponsorName: '',
    sponsorAddress: '',
    sponsorEmail: '',
  });
  const [generatedRules, setGeneratedRules] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await rulesApi.generate({
        campaignId,
        type: rulesType,
        ...sponsorInfo,
      });
      return res.data.data.rules;
    },
    onSuccess: (rules) => {
      setGeneratedRules(rules);
      if (onRulesGenerated) {
        onRulesGenerated(rules);
      }
      toast.success('Rules generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate rules');
    },
  });

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedRules);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRules = () => {
    const blob = new Blob([generatedRules], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'official-rules.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button 
        type="button" 
        variant="secondary" 
        onClick={() => setShowModal(true)}
        className="w-full"
      >
        <FileText className="w-4 h-4" />
        Generate Rules from Template
      </Button>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Rules Template Generator"
        size="xl"
      >
        <div className="space-y-6">
          {!generatedRules ? (
            <>
              {/* Rules Type Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Rules Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRulesType('full')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      rulesType === 'full'
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <h4 className="font-medium mb-1">Full Official Rules</h4>
                    <p className="text-sm text-zinc-400">
                      Complete legal document with all sections (eligibility, prizes, disclaimers, etc.)
                    </p>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRulesType('simple')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      rulesType === 'simple'
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <h4 className="font-medium mb-1">Simplified Rules</h4>
                    <p className="text-sm text-zinc-400">
                      Brief summary of key rules for display on your campaign
                    </p>
                  </motion.button>
                </div>
              </div>

              {/* Sponsor Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Sponsor Information</h4>
                
                <Input
                  label="Sponsor Name *"
                  placeholder="Your Company Name"
                  value={sponsorInfo.sponsorName}
                  onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsorName: e.target.value })}
                />

                {rulesType === 'full' && (
                  <>
                    <Input
                      label="Sponsor Address"
                      placeholder="123 Main St, City, State ZIP"
                      value={sponsorInfo.sponsorAddress}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsorAddress: e.target.value })}
                    />
                    <Input
                      label="Contact Email"
                      type="email"
                      placeholder="contact@company.com"
                      value={sponsorInfo.sponsorEmail}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsorEmail: e.target.value })}
                    />
                  </>
                )}
              </div>

              {/* Info Note */}
              <Card className="p-4 bg-amber-500/10 border-amber-500/20">
                <p className="text-sm text-amber-200">
                  <strong>Note:</strong> This is a document template generator, not AI. Review with legal counsel before publishing. Laws vary by jurisdiction.
                </p>
              </Card>

              {/* Generate Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => generateMutation.mutate()}
                  loading={generateMutation.isPending}
                  disabled={!sponsorInfo.sponsorName}
                >
                  Generate Rules
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Generated Rules Display */}
              <div className="relative">
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={downloadRules}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <textarea
                  value={generatedRules}
                  onChange={(e) => setGeneratedRules(e.target.value)}
                  className="w-full h-96 p-4 rounded-xl bg-zinc-900 border border-zinc-700 
                           text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-zinc-800">
                <Button 
                  variant="secondary" 
                  onClick={() => setGeneratedRules('')}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      if (onRulesGenerated) {
                        onRulesGenerated(generatedRules);
                      }
                      setShowModal(false);
                      toast.success('Rules applied to campaign');
                    }}
                  >
                    Apply to Campaign
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

