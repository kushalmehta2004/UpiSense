/**
 * Reusable WhatsApp-style message bubble.
 * Props: message (string), sender ('user' | 'bot'), timestamp (optional string), showLabel (optional bool)
 */
const MINT = '#00D4A0';
const TEXT = '#E5E7EB';

export function WhatsAppBubble({ message, sender, timestamp, showLabel = false }) {
  const isUser = sender === 'user';
  return (
    <div className={`flex flex-col max-w-[320px] ${isUser ? 'items-start' : 'items-end'}`}>
      {showLabel && (
        <span
          className="text-[10px] mb-1 px-1"
          style={{ color: isUser ? '#9CA3AF' : MINT }}
        >
          {isUser ? 'You' : 'UpiSense'}
        </span>
      )}
      <div
        className="px-3 py-2.5 text-[13px] leading-snug"
        style={{
          fontFamily: 'Satoshi, DM Sans, sans-serif',
          color: TEXT,
          background: isUser ? '#1F2937' : 'rgba(0,212,160,0.08)',
          border: isUser ? 'none' : '1px solid rgba(0,212,160,0.15)',
          borderRadius: isUser ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
        }}
      >
        {message}
      </div>
      {timestamp && (
        <span className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{timestamp}</span>
      )}
    </div>
  );
}
