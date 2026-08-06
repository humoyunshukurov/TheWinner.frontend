import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GroupRaceChart from '../components/GroupRaceChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const CURRENT_USER = 'Azizbek Nurmatov';

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

export default function ReytingPage() {
  const [groupBoard, setGroupBoard] = useState(null);
  const [groupsBoard, setGroupsBoard] = useState(null);
  const [groupsHistory, setGroupsHistory] = useState(null);
  const [range, setRange] = useState('week');
  const [groupsPage, setGroupsPage] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard/group`).then((res) => res.json()).then(setGroupBoard).catch(() => {});
    fetch(`${API_URL}/leaderboard/groups`).then((res) => res.json()).then(setGroupsBoard).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard/groups/history?range=${range}`)
      .then((res) => res.json())
      .then(setGroupsHistory)
      .catch(() => {});
  }, [range]);

  return (
    <Layout eyebrow="Kim eng ko'p coin to'playapti?" title="Reyting">
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
          <p className="muted" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Yuklanmoqda...
          </p>
        )}
      </article>

      <div className="dashboard-grid">
        <div>
          <article className="card">
            <div className="card-header">
              <h3>Guruhim reytingi</h3>
              <span className="select-chip">{groupBoard?.group}</span>
            </div>
            {groupBoard ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>O'rin</th>
                      <th>Talaba</th>
                      <th>Ball</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupBoard.members.map((member) => (
                      <tr key={member.name} className={member.name === CURRENT_USER ? 'me-row' : ''}>
                        <td>
                          <span className={rankBadgeClass(member.rank)}>{member.rank}</span>
                        </td>
                        <td>{member.name === CURRENT_USER ? `${member.name} (siz)` : member.name}</td>
                        <td>{member.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Yuklanmoqda...</p>
            )}
          </article>
        </div>

        <div>
          <article className="card">
            <div className="card-header">
              <h3>Guruhlar reytingi</h3>
              <span className="select-chip">Umumiy coin</span>
            </div>
            {groupsBoard ? (
              <>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>O'rin</th>
                        <th>Guruh</th>
                        <th>Coin</th>
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
    </Layout>
  );
}
