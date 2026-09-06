export const safePaymentUrl = value => {
  if (typeof value !== 'string') return '';
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

export const formatPaymentAmount = (amount, currency) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 'Montant calculé automatiquement';
  return `${new Intl.NumberFormat('fr', { maximumFractionDigits: 0 }).format(numericAmount)} ${currency || ''}`.trim();
};
