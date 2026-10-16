import SteamAPI from 'steamapi';

const steam = new SteamAPI(import.meta.env.VITE_STEAM_API_KEY ?? process.env.STEAM_API_KEY ?? '');
const OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

export function getSteamLoginUrl(returnTo: string) {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': window.location.origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return `${OPENID_ENDPOINT}?${params}`;
}

export async function verifySteamTicket(ticket: string) {
  const body = new URLSearchParams({
    'openid.mode': 'id_res',
    'openid.sig': ticket,
  });
  const res = await fetch(OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  const steamId = text.match(/\/id\/(\d+)/)?.[1];
  if (!steamId) throw new Error('Steam ID não encontrado no ticket');

  const player = await steam.getUserSummary(steamId);
  return {
    steamId,
    name: player.nickname,
    avatar: player.avatar.large,
    profileUrl: player.profileURL,
  };
}
