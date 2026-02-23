import { motion } from 'framer-motion';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const categories = [
  { emoji: '🍽️', name: 'Food & Dining', examples: 'Zomato, Swiggy, restaurants', color: MINT },
  { emoji: '🚗', name: 'Transport', examples: 'Ola, Uber, Rapido, petrol', color: '#F5A623' },
  { emoji: '🛒', name: 'Groceries', examples: 'BigBasket, Blinkit, kirana', color: '#0EA5E9' },
  { emoji: '💡', name: 'Utilities', examples: 'Electricity, broadband, OTT', color: '#A78BFA' },
  { emoji: '🛍️', name: 'Shopping', examples: 'Amazon, Flipkart, Meesho', color: '#EC4899' },
  { emoji: '💊', name: 'Health', examples: 'Pharmacy, doctor, gym', color: '#10B981' },
  { emoji: '🏠', name: 'Home', examples: 'Rent, plumber, electrician', color: '#F97316' },
  { emoji: '✈️', name: 'Travel', examples: 'Flights, hotels, trains', color: '#8B5CF6' },
  { emoji: '📚', name: 'Education', examples: 'Courses, tuition, books', color: '#06B6D4' },
  { emoji: '💼', name: 'Business', examples: 'Client expenses, software', color: '#6366F1' },
  { emoji: '🔄', name: 'P2P Transfer', examples: 'Friends & family', color: '#F59E0B' },
  { emoji: '📌', name: 'Other', examples: 'Everything else', color: MUTED },
];

export function Categories() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: CARD }}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-bold text-center mb-16"
          style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
        >
          Every rupee, in its place.
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.05 }}
              whileHover={{ y: -4 }}
              className="p-4 rounded-xl border-l-4 bg-[#0A0F1E]/60 cursor-default transition-shadow hover:shadow-lg"
              style={{ borderLeftColor: cat.color }}
            >
              <span className="text-2xl block mb-2">{cat.emoji}</span>
              <h3 className="font-semibold mb-1" style={{ color: TEXT }}>{cat.name}</h3>
              <p className="text-xs" style={{ color: MUTED }}>{cat.examples}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
