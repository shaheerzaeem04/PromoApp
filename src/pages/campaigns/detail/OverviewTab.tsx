import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button, DateTimePicker, Input, Checkbox } from '../../../components/ui';
import { campaignApi } from '../../../services/api';
import { apiErrorMessage, fromDateTimeLocal, toDateTimeLocal } from './constants';

export function OverviewTab({ campaignId, data }: { campaignId: string; data: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: data.title || '',
    description: data.description || '',
    startDate: toDateTimeLocal(data.startDate),
    endDate: toDateTimeLocal(data.endDate),
    requireName: Boolean(data.requireName),
    requireEmail: Boolean(data.requireEmail),
    enableCaptcha: Boolean(data.enableCaptcha),
    enableReferrals: Boolean(data.enableReferrals),
    referralBonusPoints: data.referralBonusPoints ?? 5,
    enableSpinWheel: Boolean(data.enableSpinWheel),
    spinsPerDay: data.spinsPerDay ?? 1,
  });

  const mutation = useMutation({
    mutationFn: () => campaignApi.update(campaignId, {
      title: form.title,
      description: form.description || null,
      startDate: fromDateTimeLocal(form.startDate),
      endDate: fromDateTimeLocal(form.endDate),
      requireName: form.requireName,
      requireEmail: form.requireEmail,
      enableCaptcha: form.enableCaptcha,
      enableReferrals: form.enableReferrals,
      referralBonusPoints: Number(form.referralBonusPoints) || 0,
      enableSpinWheel: form.enableSpinWheel,
      spinsPerDay: Number(form.spinsPerDay) || 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign updated');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Update failed')),
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Campaign settings</h3>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <DateTimePicker label="Start date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
          <DateTimePicker label="End date" value={form.endDate} onChange={(endDate) => setForm({ ...form, endDate })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Referral bonus points"
            type="number"
            min={0}
            value={form.referralBonusPoints}
            onChange={(e) => setForm({ ...form, referralBonusPoints: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Spins per day"
            type="number"
            min={1}
            value={form.spinsPerDay}
            onChange={(e) => setForm({ ...form, spinsPerDay: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['requireName', 'Require name'],
            ['requireEmail', 'Require email'],
            ['enableCaptcha', 'Enable CAPTCHA'],
            ['enableReferrals', 'Enable referrals'],
            ['enableSpinWheel', 'Enable spin wheel'],
          ].map(([key, label]) => (
            <Checkbox
              key={key}
              isSelected={Boolean((form as any)[key])}
              onChange={(checked) => setForm({ ...form, [key]: checked })}
            >
              {label}
            </Checkbox>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={mutation.isPending}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}
