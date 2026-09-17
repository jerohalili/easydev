// Badge colors per stack layer. I keep this separate because HistoryView and
// ResultsView both need the exact same mapping — drifted once, looked broken.
export const CATEGORY_STYLES = {
  language: { bg: 'var(--badge-lang-bg)', text: 'var(--badge-lang-text)', border: 'var(--badge-lang-border)' },
  frontend: { bg: 'var(--badge-front-bg)', text: 'var(--badge-front-text)', border: 'var(--badge-front-border)' },
  backend: { bg: 'var(--badge-back-bg)', text: 'var(--badge-back-text)', border: 'var(--badge-back-border)' },
  database: { bg: 'var(--badge-db-bg)', text: 'var(--badge-db-text)', border: 'var(--badge-db-border)' },
  infrastructure: { bg: 'var(--badge-infra-bg)', text: 'var(--badge-infra-text)', border: 'var(--badge-infra-border)' }
};

// Domain alias — same object, clearer name at call sites dealing with stack picks.
// NOTE: DB column is still `category` / `tech_items.category`, don't rename that.
export const STACK_LAYER_STYLES = CATEGORY_STYLES;
