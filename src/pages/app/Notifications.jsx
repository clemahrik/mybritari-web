import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { notificationsAPI } from '../../services/api';
import { timeAgo, fmtDate } from '../../utils';

const TABS = ['All', 'Unread', 'Payments', 'General'];
const TYPE_ICON = { payment: '💳', contract: '📄', kyc: '🪪', general: '📢', welcome: '👋', default: '🔔' };

function groupNotifs(notifs) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups    = { TODAY: [], YESTERDAY: [], EARLIER: [] };
  notifs.forEach(n => {
    const d = new Date(n.created_at); d.setHours(0,0,0,0);
    if (d >= today)         groups.TODAY.push(n);
    else if (d >= yesterday) groups.YESTERDAY.push(n);
    else                     groups.EARLIER.push(n);
  });
  return groups;
}

export default function Notifications() {
  const { showToast } = useToast();
  const [notifs,  setNotifs]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [tab,     setTab]      = useState('All');
  const [marking, setMarking]  = useState(false);

  const load = useCallback(() => {
    notificationsAPI.getAll()
      .then(r => setNotifs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  async function handleMarkRead(id) {
    try {
      await notificationsAPI.markRead(id);
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  }

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifs(ns => ns.map(n => ({ ...n, is_read: 1 })));
      showToast('All marked as read', 'success');
    } catch {
      showToast('Failed to mark all read', 'error');
    } finally { setMarking(false); }
  }

  const filtered = notifs.filter(n => {
    if (tab === 'Unread')   return !n.is_read;
    if (tab === 'Payments') return n.type === 'payment';
    if (tab === 'General')  return n.type === 'general' || n.type === 'welcome';
    return true;
  });

  const groups = groupNotifs(filtered);
  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <Layout>
      <TopHeader
        title="Notifications"
        showBack
        rightElement={
          unreadCount > 0 ? (
            <button onClick={handleMarkAllRead} disabled={marking} className="text-white/70 text-[11px] font-700">
              {marking ? '...' : 'Read all'}
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border bg-white sticky top-0 z-10 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-700 border-b-2 transition-all
              ${tab === t ? 'border-red text-red' : 'border-transparent text-textmuted'}`}
          >
            {t} {t === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />
      ) : (
        <div>
          {Object.entries(groups).map(([group, groupNotifs]) => {
            if (groupNotifs.length === 0) return null;
            return (
              <div key={group}>
                <div className="px-4 py-2 bg-surface-2 sticky top-[49px] z-10">
                  <p className="text-xs font-800 text-textmuted uppercase tracking-wide">{group}</p>
                </div>
                {groupNotifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={`w-full flex items-start gap-4 px-4 py-4 border-b border-border text-left transition-all
                      ${!n.is_read ? 'bg-white' : 'bg-surface/50'}`}
                  >
                    <div className="flex-shrink-0 flex items-center">
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-red mr-2 mt-1 flex-shrink-0" />}
                      <span className="text-2xl">{TYPE_ICON[n.type] || TYPE_ICON.default}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-0.5 ${!n.is_read ? 'font-800 text-textmain' : 'font-700 text-textsub'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-textsub leading-4 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-textmuted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
