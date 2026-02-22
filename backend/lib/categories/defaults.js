/**
 * Task 4: System category defaults
 * 15 standard categories for transaction categorization
 * Names must match dictionary and categorization logic
 */

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { name: 'Groceries', icon: '🛒', color: '#4ECDC4' },
  { name: 'Transport', icon: '🚗', color: '#FFE66D' },
  { name: 'Utilities', icon: '💡', color: '#95E1D3' },
  { name: 'Health', icon: '💊', color: '#F38181' },
  { name: 'Shopping', icon: '🛍️', color: '#AA96DA' },
  { name: 'Entertainment', icon: '🎬', color: '#6C5CE7' },
  { name: 'Finance', icon: '💰', color: '#00B894' },
  { name: 'Education', icon: '📚', color: '#74B9FF' },
  { name: 'Personal Care', icon: '🧴', color: '#FD79A8' },
  { name: 'Rent & Housing', icon: '🏠', color: '#E17055' },
  { name: 'Subscriptions', icon: '📱', color: '#A29BFE' },
  { name: 'Travel', icon: '✈️', color: '#00CEC9' },
  { name: 'Gifts & Donations', icon: '🎁', color: '#FDCB6E' },
  { name: 'Other', icon: '📦', color: '#B2BEC3' }
];

/**
 * P2P-specific category options for clarification flow (Task 5)
 * Shorter labels for WhatsApp messages
 */
const P2P_CLARIFICATION_OPTIONS = [
  { label: 'Friend Payment', category: 'Gifts & Donations' },
  { label: 'Family Transfer', category: 'Gifts & Donations' },
  { label: 'Home Repair', category: 'Rent & Housing' },
  { label: 'Personal Loan', category: 'Finance' },
  { label: 'Rent', category: 'Rent & Housing' },
  { label: 'Other', category: 'Other' }
];

module.exports = {
  DEFAULT_CATEGORIES,
  P2P_CLARIFICATION_OPTIONS,
  getCategoryNames: () => DEFAULT_CATEGORIES.map(c => c.name)
};
