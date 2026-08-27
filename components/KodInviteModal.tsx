import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { IconPlay } from './icons';
import { getGuest, GUEST_CHANGED_EVENT } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const INVITE_POLL_MS = 5000;

type KodInvite = {
  id: number;
  code: string;
  groupName: string;
  createdAt: number;
};

// "Kod bilan o'yin" taklifi endi Bildirishnomalar sahifasiga borishni kutib
// o'tirmaydi - Layout ichida yashaydi, shu sababli guruhga o'yin ochilganda
// talaba ilovaning qaysi sahifasida bo'lishidan qat'iy nazar shu zahoti
// Ha/Yo'q so'rovini ko'radi (odatiy "keyinroq o'qiladigan" bildirishnoma
// emas). /oyin/kod sahifasining o'zida bostirilgan - u yerga kirgan
// (taklifni qabul qilib yoki kodni qo'lda kiritib) talaba uchun qo'shilish
// oqimi allaqachon sahifaning o'zida ketyapti, ustiga yana shu modalni
// chiqarish shunchaki halaqit beradi.
//
// Boshqa tasdiqlash oynalaridan (.modal-overlay/.modal-box, masalan
// PresenceCheckModal) ataylab boshqacha - u yerlar sahifani butunlay
// bosib, qorong'ilashtiradi, bu esa har sahifaga kirganda shunga
// duch kelavergani uchun juda halaqit bo'lib qoldi. Shu sabab bu yerda
// yengil ko'rinishda: fon shunchaki sal hiralashadi (butunlay
// qorong'ilashmaydi va bosishni to'sib qo'ymaydi - pointer-events faqat
// kartaning o'zida), xabar va Ha/Yo'q tugmalari esa ekran markazida,
// o'yin kartalari bilan taqqoslanadigan kattalikda aniq va to'liq
// ko'rinib turadi.
export default function KodInviteModal() {
  const router = useRouter();
  const [invite, setInvite] = useState<KodInvite | null>(null);
  const [responding, setResponding] = useState(false);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    function poll() {
      const { guestId } = getGuest();
      fetch(`${API_URL}/kod/invites?guestId=${guestId}`)
        .then((res) => res.json())
        .then((list: KodInvite[]) => setInvite((list && list[0]) || null))
        .catch(() => {});
    }

    poll();
    pollRef.current = setInterval(poll, INVITE_POLL_MS);
    window.addEventListener(GUEST_CHANGED_EVENT, poll);
    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener(GUEST_CHANGED_EVENT, poll);
    };
  }, []);

  async function respond(accept: boolean) {
    if (!invite || responding) return;
    setResponding(true);
    const { guestId } = getGuest();
    const { id, code } = invite;
    try {
      const res = await fetch(`${API_URL}/kod/invites/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, accept })
      });
      const data = await res.json().catch(() => ({}));
      setInvite(null);
      if (res.ok && accept && data.joined) {
        router.push(`/oyin/kod?code=${code}`);
      }
    } catch {
      setInvite(null);
    } finally {
      setResponding(false);
    }
  }

  if (!invite || router.pathname === '/oyin/kod') return null;

  return (
    <div className="kod-invite-wrap">
      <div className="kod-invite-card">
        <div className="notif-card-icon invite">
          <IconPlay size={24} />
        </div>
        <div className="kod-invite-body">
          <p>
            <strong>{invite.groupName}</strong> guruhi uchun &quot;Kod bilan o&apos;yin&quot; boshlanmoqda -
            qo&apos;shilasizmi?
          </p>
          <div className="kod-invite-actions">
            <button type="button" className="pill-btn primary" onClick={() => respond(true)} disabled={responding}>
              Ha
            </button>
            <button type="button" className="pill-btn" onClick={() => respond(false)} disabled={responding}>
              Yo&apos;q
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
