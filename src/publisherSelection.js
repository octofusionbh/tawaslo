// Publisher targets exactly one account on the platform selected in the top bar.
export function selectPublisherAccount(accounts, platform, accountId, clientId) {
  if (!platform || platform === "all") return null;
  const matches = accounts.filter(account => account.platform === platform && account.is_active !== false && (!clientId || account.client_id === clientId));
  if (matches.length === 1) return matches[0];
  return matches.find(account => account.id === accountId) || null;
}

export function publisherPlatform(platform, available) {
  return available.includes(platform) ? platform : available[0] || null;
}
