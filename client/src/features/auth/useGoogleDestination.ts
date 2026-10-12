import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { api } from '../../lib/api.js';

const LOCAL_REDIRECT = /^\/(?!\/)/;
function hasInvalidRedirectCharacter(value: string) {
  return value.includes('\\') || [...value].some(character => character.charCodeAt(0) < 32);
}

export function useGoogleDestination() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const isCurrentUser = () => useAuthStore.getState().user === user;
    if (user.role === 'admin') { navigate('/admin'); return; }
    const plan = params.get('plan');
    if (plan === 'monthly' || plan === 'yearly') {
      try {
        const response = await api.post('/payments/create-checkout', { planType: plan });
        if (isCurrentUser()) window.location.assign(response.data.data.checkoutUrl);
      } catch { if (isCurrentUser()) navigate('/gia?checkoutError=1'); }
      return;
    }
    const redirect = params.get('redirect');
    if (redirect && LOCAL_REDIRECT.test(redirect) && !hasInvalidRedirectCharacter(redirect)) {
      navigate(redirect); return;
    }
    const children = await useChildStore.getState().fetchChildren();
    if (isCurrentUser()) navigate(children.length ? '/kham-pha' : '/bat-dau');
  };
}
