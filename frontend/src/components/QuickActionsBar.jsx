import { useState } from 'react';
import { MessageCircle, Users, Share2 } from 'lucide-react';
import { HowToAddModal } from './HowToAddModal';
import { colors } from '../theme';

const ACTIONS = [
  { id: 'cash', label: 'Log a cash payment', icon: MessageCircle },
  { id: 'iou', label: 'Track an IOU', icon: Users },
  { id: 'upi', label: 'Forward a UPI notification', icon: Share2 },
];

export function QuickActionsBar() {
  const [modalType, setModalType] = useState(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setModalType(a.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] transition-all duration-150 hover:border-[rgba(0,212,160,0.3)] hover:text-[#F9FAFB] hover:bg-[rgba(0,212,160,0.06)]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: colors.textSecondary,
            }}
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        ))}
      </div>
      {modalType && (
        <HowToAddModal type={modalType} onClose={() => setModalType(null)} />
      )}
    </>
  );
}
