import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import GroupRaceChart from '../components/GroupRaceChart';
import Avatar from '../components/Avatar';
import CrownBadge from '../components/CrownBadge';
import StarBadge from '../components/StarBadge';
import PlayerProfileModal, { type PlayerSummary } from '../components/PlayerProfileModal';
import { getGuest } from '../lib/guest';
import { loadProfilePhoto } from '../lib/profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function rankBadgeClass(rank) {
  if (rank === 1) return 'rank-badge gold';
  if (rank === 2) return 'rank-badge silver';
  if (rank === 3) return 'rank-badge bronze';
  return 'rank-badge';
}

const RANGE_OPTIONS = [
  { value: 'day', label: '1 kun' },
  { value: 'week', label: '1 hafta' },
  { value: '10day', label: '10 kun' },
  { value: 'month', label: '1 oylik' }
];

const GROUPS_PAGE_SIZE = 5;
const ALL_PAGE_SIZE = 8;
// Mirrors backend's RANK_TIERS - the 'diamond' tier (labeled "Chempion"
// there) starts at 1000 HP with no upper bound. Kept in sync by hand
// since there's no shared-package boundary between the two apps here.
const CHAMPION_TIER_MIN_HP = 1000;

export default function ReytingPage() {
  const [groupBoard, setGroupBoard] = useState(null);
  const [groupsBoard, setGroupsBoard] = useState(null);
  const [groupsHistory, setGroupsHistory] = useState(null);
  const [allBoard, setAllBoard] = useState(null);
  const [range, setRange] = useState('week');
  const [groupsPage, setGroupsPage] = useState(0);
  const [allPage, setAllPage] = useState(0);
  const [myPhoto, setMyPhoto] = useState(null);
  const [myGuestId, setMyGuestId] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSummary | null>(null);

  useEffect(() => {
    const { guestId } = getGuest();
    setMyGuestId(guestId);
    fetch(`${API_URL}/leaderboard/group?guestId=${guestId}`).then((res) => res.json()).then(setGroupBoard).catch(() => {});
    fetch(`${API_URL}/leaderboard/groups`).then((res) => res.json()).then(setGroupsBoard).catch(() => {});
    fetch(`${API_URL}/leaderboard/all`).then((res) => res.json()).then(setAllBoard).catch(() => {});
    setMyPhoto(loadProfilePhoto(guestId));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard/groups/history?range=${range}`)
      .then((res) => res.json())
      .then(setGroupsHistory)
      .catch(() => {});
  }, [range]);

  // On the global "Barcha o'yinchilar" board, the star marks each group's
  // own top scorer - not just the overall #1 (that's what the crown is
  // for). So there's one star per group, scattered across whatever ranks
  // those students land at, and a student who's both their group's leader
  // AND the overall #1 rightfully gets crown + star together. Ties for a
  // group's top XP all get a star rather than picking one arbitrarily.
  // Being the top scorer alone isn't enough, though - they also have to
  // have actually reached Chempion (diamond) tier themselves. A group
  // whose best student is still Boshlang'ich/O'rta/etc. has no star yet.
  const groupLeaderIds = useMemo(() => {
    if (!allBoard) return new Set<string>();
    const bestByGroup = new Map<string, number>();
    for (const player of allBoard) {
      if (!player.group || player.hp <= 0) continue;
      const best = bestByGroup.get(player.group);
      if (best === undefined || player.hp > best) bestByGroup.set(player.group, player.hp);
    }
    const leaders = new Set<string>();
    for (const player of allBoard) {
      if (
        player.group &&
        player.hp >= CHAMPION_TIER_MIN_HP &&
        player.hp === bestByGroup.get(player.group)
      ) {
        leaders.add(player.guestId);
      }
    }
    return leaders;
  }, [allBoard]);

  return (
    <Layout title="Reyting">
      <article className="race-card">
        <div className="race-card-header">
          <h3>Guruhlar poygasi</h3>
          <select className="race-range-select" value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {groupsHistory ? (
          <GroupRaceChart labels={groupsHistory.labels} series={groupsHistory.series} />
        ) : (
          <p className="muted">Yuklanmoqda...</p>
        )}
      </article>

      <div className="dashboard-grid">
        <div>
          <article className="card">
            <div className="card-header">
              <h3>Guruhim reytingi</h3>
              {groupBoard?.group && <span className="select-chip">{groupBoard.group}</span>}
            </div>
            {!groupBoard && <p className="muted">Yuklanmoqda...</p>}

            {groupBoard && !groupBoard.group && (
              <div className="empty-state">
                <p className="muted">Siz hali biror guruhga a&apos;zo emassiz.</p>
                <Link href="/guruhlar" className="pill-btn primary">
                  Guruhga qo&apos;shilish
                </Link>
              </div>
            )}

            {groupBoard?.group && groupBoard.members.length === 0 && (
              <p className="muted">Bu guruhda hali kod orqali qo&apos;shilgan a&apos;zo yo&apos;q</p>
            )}

            {groupBoard?.group && groupBoard.members.length > 0 && (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>O'rin</th>
                      <th>Talaba</th>
                      <th>XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupBoard.members.map((member) => {
                      const isMe = member.guestId === myGuestId;
                      return (
                        <tr
                          key={member.guestId}
                          className={`clickable-row ${isMe ? 'me-row' : ''}`}
                          onClick={() =>
                            setSelectedPlayer({
                              guestId: member.guestId,
                              name: isMe ? `${member.name} (siz)` : member.name,
                              group: groupBoard.group,
                              photo: isMe ? myPhoto : member.photo
                            })
                          }
                        >
                          <td>
                            <span className="rank-badge-wrap">
                              {member.rank === 1 && member.points > 0 && (
                                <CrownBadge size={20} className="rank-crown" />
                              )}
                              {member.rank === 1 && member.points >= CHAMPION_TIER_MIN_HP && (
                                <StarBadge size={32} className="rank-star" />
                              )}
                              <span className={rankBadgeClass(member.rank)}>{member.rank}</span>
                            </span>
                          </td>
                          <td>
                            <div className="table-name-cell">
                              <Avatar photo={isMe ? myPhoto : member.photo} size={30} />
                              {isMe ? `${member.name} (siz)` : member.name}
                            </div>
                          </td>
                          <td>{member.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <div>
          <article className="card">
            <div className="card-header">
              <h3>Guruhlar reytingi</h3>
              <span className="select-chip">Umumiy XP</span>
            </div>
            {groupsBoard ? (
              <>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>O'rin</th>
                        <th>Guruh</th>
                        <th>XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupsBoard
                        .slice(groupsPage * GROUPS_PAGE_SIZE, groupsPage * GROUPS_PAGE_SIZE + GROUPS_PAGE_SIZE)
                        .map((group) => (
                          <tr key={group.group} className={group.group === groupBoard?.group ? 'me-row' : ''}>
                            <td>
                              <span className={rankBadgeClass(group.rank)}>{group.rank}</span>
                            </td>
                            <td>
                              {group.group}
                              <div className="muted" style={{ fontSize: '0.78rem' }}>
                                {group.membersCount} talaba
                              </div>
                            </td>
                            <td>{group.totalPoints}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {groupsBoard.length > GROUPS_PAGE_SIZE && (
                  <div className="pagination">
                    <button
                      className="pill-btn"
                      disabled={groupsPage === 0}
                      onClick={() => setGroupsPage((p) => Math.max(0, p - 1))}
                    >
                      ← Oldingi
                    </button>
                    <span className="muted">
                      {groupsPage * GROUPS_PAGE_SIZE + 1}-
                      {Math.min(groupsBoard.length, groupsPage * GROUPS_PAGE_SIZE + GROUPS_PAGE_SIZE)} / {groupsBoard.length}
                    </span>
                    <button
                      className="pill-btn"
                      disabled={(groupsPage + 1) * GROUPS_PAGE_SIZE >= groupsBoard.length}
                      onClick={() =>
                        setGroupsPage((p) =>
                          (p + 1) * GROUPS_PAGE_SIZE < groupsBoard.length ? p + 1 : p
                        )
                      }
                    >
                      Keyingi →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">Yuklanmoqda...</p>
            )}
          </article>
        </div>
      </div>

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h3>Barcha o&apos;yinchilar reytingi</h3>
          <span className="select-chip">{allBoard?.length || 0} ta</span>
        </div>

        {!allBoard && <p className="muted">Yuklanmoqda...</p>}
        {allBoard?.length === 0 && <p className="muted">Hali hech kim o&apos;ynamagan</p>}

        {allBoard?.length > 0 && (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>O'rin</th>
                    <th>O&apos;yinchi</th>
                    <th>XP</th>
                  </tr>
                </thead>
                <tbody>
                  {allBoard
                    .slice(allPage * ALL_PAGE_SIZE, allPage * ALL_PAGE_SIZE + ALL_PAGE_SIZE)
                    .map((player) => {
                      const isMe = player.guestId === myGuestId;
                      return (
                        <tr
                          key={player.guestId}
                          className={`clickable-row ${isMe ? 'me-row' : ''}`}
                          onClick={() =>
                            setSelectedPlayer({
                              guestId: player.guestId,
                              name: isMe ? `${player.name} (siz)` : player.name,
                              group: player.group,
                              photo: isMe ? myPhoto : player.photo
                            })
                          }
                        >
                          <td>
                            <span className="rank-badge-wrap">
                              {player.rank === 1 && player.hp > 0 && <CrownBadge size={20} className="rank-crown" />}
                              {groupLeaderIds.has(player.guestId) && <StarBadge size={32} className="rank-star" />}
                              <span className={rankBadgeClass(player.rank)}>{player.rank}</span>
                            </span>
                          </td>
                          <td>
                            <div className="table-name-cell">
                              <Avatar photo={isMe ? myPhoto : player.photo} size={30} />
                              <div>
                                {isMe ? `${player.name} (siz)` : player.name}
                                {player.group && (
                                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                                    {player.group}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{player.hp}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {allBoard.length > ALL_PAGE_SIZE && (
              <div className="pagination">
                <button
                  className="pill-btn"
                  disabled={allPage === 0}
                  onClick={() => setAllPage((p) => Math.max(0, p - 1))}
                >
                  ← Oldingi
                </button>
                <span className="muted">
                  {allPage * ALL_PAGE_SIZE + 1}-
                  {Math.min(allBoard.length, allPage * ALL_PAGE_SIZE + ALL_PAGE_SIZE)} / {allBoard.length}
                </span>
                <button
                  className="pill-btn"
                  disabled={(allPage + 1) * ALL_PAGE_SIZE >= allBoard.length}
                  onClick={() => setAllPage((p) => ((p + 1) * ALL_PAGE_SIZE < allBoard.length ? p + 1 : p))}
                >
                  Keyingi →
                </button>
              </div>
            )}
          </>
        )}
      </article>

      {selectedPlayer && (
        <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </Layout>
  );
}
