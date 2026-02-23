/**
 * Dashboard design tokens — match landing page dark aesthetic
 */
export const colors = {
  pageBg: '#0A0F1E',
  cardBg: '#111827',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardBorderHover: 'rgba(0,212,160,0.2)',
  mint: '#00D4A0',
  amber: '#F5A623',
  orange: '#F97316',
  blue: '#0EA5E9',
  purple: '#8B5CF6',
  gray: '#374151',
  text: '#F9FAFB',
  textSecondary: '#6B7280',
  textMuted: '#374151',
  inputBg: '#1F2937',
  inputBorder: '#374151',
  inputFocus: '#00D4A0',
  sidebarBg: '#0D1117',
};

export const categoryColors = {
  'Food & Dining': colors.mint,
  'Food Delivery': colors.mint,
  Transport: colors.blue,
  Shopping: colors.amber,
  Groceries: colors.purple,
  Health: colors.orange,
  Other: colors.gray,
};

export function getCategoryColor(category) {
  return categoryColors[category] || categoryColors.Other;
}

/** WhatsApp business/bot number for wa.me links (no +). Set VITE_WHATSAPP_NUMBER in env. */
export const whatsappNumber = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) || '919372999366';

export function getWhatsAppUrl(prefilledMessage) {
  const num = whatsappNumber.replace(/\D/g, '');
  if (!num) return '#';
  const base = `https://wa.me/${num}`;
  if (prefilledMessage) return `${base}?text=${encodeURIComponent(prefilledMessage)}`;
  return base;
}
