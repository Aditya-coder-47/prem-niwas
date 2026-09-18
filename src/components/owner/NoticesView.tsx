import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Pin, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Notice } from '../../types';
import { deleteNotice } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface NoticesViewProps {
  notices: Notice[];
  onOpenCreateModal: () => void;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  notices,
  onOpenCreateModal
}) => {
  const { profile, role } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredNotices = notices.filter(n => {
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    return true;
  });

  const handleDelete = async (notice: Notice) => {
    if (window.confirm(`Are you sure you want to delete the notice "${notice.title}"?`)) {
      setDeletingId(notice.id);
      try {
        await deleteNotice(notice.id, notice.title, profile?.name || 'Building Owner');
      } catch (err) {
        console.error('Failed to delete notice:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Building Notice Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official announcements, maintenance schedules, and building rules for PREM NIWAS.
          </p>
        </div>

        {role === 'owner' && (
          <button
            id="create-notice-btn"
            onClick={onOpenCreateModal}
            className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Notice</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {['all', 'General', 'Maintenance', 'Emergency', 'Building Rule'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Notices' : cat}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-700">No notices posted in this category</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for building announcements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                notice.isPinned ? 'border-amber-400/80 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {notice.isPinned && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3" />
                        <span>Pinned</span>
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {notice.category}
                    </span>
                    {notice.priority === 'high' && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        High Priority
                      </span>
                    )}
                  </div>

                  {role === 'owner' && (
                    <button
                      onClick={() => handleDelete(notice)}
                      disabled={deletingId === notice.id}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {notice.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{notice.createdByName || 'Prem Niwas Office'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(notice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
