import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal, Select } from '../../../components/ui';
import { campaignApi, spinWheelApi } from '../../../services/api';
import { apiErrorMessage, rewardTypes, segmentColors } from './constants';

export function SpinWheelTab({ campaignId, data }: { campaignId: string; data: any }) {
  const queryClient = useQueryClient();
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newSegment, setNewSegment] = useState({
    label: '',
    rewardType: 'BONUS_ENTRIES',
    rewardValue: '',
    probability: 0.1,
    color: '#6366f1',
    maxWins: undefined as number | undefined,
  });

  const { data: segmentsData } = useQuery({
    queryKey: ['segments', campaignId],
    queryFn: () => spinWheelApi.getAllSegments(campaignId),
    enabled: !!data.enableSpinWheel,
  });

  const addSegmentMutation = useMutation({
    mutationFn: () => spinWheelApi.addSegment(campaignId, newSegment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', campaignId] });
      toast.success('Wheel segment added');
      setShowAddSegment(false);
      setNewSegment({ label: '', rewardType: 'BONUS_ENTRIES', rewardValue: '', probability: 0.1, color: '#6366f1', maxWins: undefined });
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not add segment')),
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (segmentId: string) => spinWheelApi.deleteSegment(segmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', campaignId] });
      toast.success('Segment deleted');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not delete segment')),
  });

  const createDefaultSegmentsMutation = useMutation({
    mutationFn: () => spinWheelApi.createDefaultSegments(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', campaignId] });
      toast.success('Default segments created');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not create segments')),
  });

  const toggleSpinWheelMutation = useMutation({
    mutationFn: (enabled: boolean) => campaignApi.update(campaignId, { enableSpinWheel: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['segments', campaignId] });
      toast.success('Spin wheel settings updated');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not update spin wheel')),
  });

  const segments = (segmentsData?.data?.data || []) as any[];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Spin to Win Wheel</h3>
            <p className="text-sm text-zinc-400 mt-1">Let participants spin for instant prizes and bonus entries</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.enableSpinWheel}
              onChange={(e) => toggleSpinWheelMutation.mutate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
          </label>
        </div>
      </Card>

      {data.enableSpinWheel && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Wheel Segments</h3>
            <div className="flex gap-2">
              {segments.length === 0 && (
                <Button variant="secondary" onClick={() => createDefaultSegmentsMutation.mutate()} loading={createDefaultSegmentsMutation.isPending}>
                  Create Default Segments
                </Button>
              )}
              <Button onClick={() => setShowAddSegment(true)}>
                <Plus className="w-4 h-4" />
                Add Segment
              </Button>
            </div>
          </div>

          {segments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-zinc-400">No wheel segments yet. Create default segments or add custom ones.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {segments.map((segment: any) => (
                <Card key={segment.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: segment.color }}>
                      {rewardTypes.find((t) => t.value === segment.rewardType)?.icon || '🎁'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{segment.label}</h4>
                      <p className="text-sm text-zinc-400 mt-1">
                        {rewardTypes.find((t) => t.value === segment.rewardType)?.label}
                        {segment.rewardValue && `: ${segment.rewardValue}`}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span>Probability: {(segment.probability * 100).toFixed(0)}%</span>
                        {segment.maxWins && <span>Max wins: {segment.currentWins}/{segment.maxWins}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteSegmentMutation.mutate(segment.id)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {segments.length > 0 && (
            <Card className="p-4 bg-zinc-800/50">
              <p className="text-sm text-zinc-400">
                <strong>Total Probability:</strong>{' '}
                {(segments.reduce((sum: number, s: any) => sum + s.probability, 0) * 100).toFixed(0)}%
                {' '}
                <span className="text-zinc-500">(should equal 100% for best results)</span>
              </p>
            </Card>
          )}
        </>
      )}

      <Modal isOpen={showAddSegment} onClose={() => setShowAddSegment(false)} title="Add Wheel Segment" size="md">
        <div className="space-y-4">
          <Input label="Label" value={newSegment.label} onChange={(e) => setNewSegment({ ...newSegment, label: e.target.value })} />
          <Select
            label="Reward Type"
            options={rewardTypes.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
            value={newSegment.rewardType}
            onChange={(e) => setNewSegment({ ...newSegment, rewardType: e.target.value })}
          />
          {newSegment.rewardType !== 'NO_WIN' && (
            <Input
              label={newSegment.rewardType === 'BONUS_ENTRIES' ? 'Number of Bonus Entries' : 'Reward value'}
              value={newSegment.rewardValue}
              onChange={(e) => setNewSegment({ ...newSegment, rewardValue: e.target.value })}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Probability (%)</label>
              <input
                type="range"
                min={1}
                max={100}
                value={newSegment.probability * 100}
                onChange={(e) => setNewSegment({ ...newSegment, probability: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
              <p className="text-center text-sm text-zinc-400 mt-1">{(newSegment.probability * 100).toFixed(0)}%</p>
            </div>
            <Input
              label="Max Wins (optional)"
              type="number"
              min={1}
              value={newSegment.maxWins || ''}
              onChange={(e) => setNewSegment({ ...newSegment, maxWins: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Segment Color</label>
            <div className="flex gap-2 flex-wrap">
              {segmentColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewSegment({ ...newSegment, color })}
                  className={`w-8 h-8 rounded-lg ${newSegment.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddSegment(false)}>Cancel</Button>
            <Button onClick={() => addSegmentMutation.mutate()} loading={addSegmentMutation.isPending} disabled={!newSegment.label.trim()}>
              Add Segment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
