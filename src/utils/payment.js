// Sans cible : paiement du panier. Avec { kind, id } : achat direct sans panier.
export const purchaseUrl = (apiUrl, userId, target) => {
  const base = apiUrl.replace(/\/$/, '');
  if (target?.kind === 'consultation') return `${base}/work/purchase/${encodeURIComponent(target.id)}`;
  if (target?.kind === 'subscription') return `${base}/subscription/purchase/${encodeURIComponent(target.id)}`;
  return `${base}/cart/purchase/${encodeURIComponent(userId)}`;
};

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
  return `${new Intl.NumberFormat('fr', { maximumFractionDigits: 2 }).format(numericAmount)} ${currency || ''}`.trim();
};
