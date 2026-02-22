/**
 * Pre-populate categories table with system defaults
 * Idempotent: only inserts if category name doesn't exist
 */

const { DEFAULT_CATEGORIES } = require('./defaults.js');

async function seedCategories(supabase) {
  const { data: existing } = await supabase
    .from('categories')
    .select('name')
    .is('user_id', null);

  const existingNames = new Set((existing || []).map(r => r.name));
  const toInsert = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.name));

  if (toInsert.length === 0) {
    return { seeded: 0, message: 'All categories already exist' };
  }

  const rows = toInsert.map(c => ({
    name: c.name,
    icon: c.icon,
    color: c.color,
    is_default: true,
    user_id: null
  }));

  const { error } = await supabase.from('categories').insert(rows);
  if (error) throw error;

  return { seeded: rows.length, message: `Inserted ${rows.length} categories` };
}

module.exports = { seedCategories };
