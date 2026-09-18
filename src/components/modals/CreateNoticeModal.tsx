import React, { useState } from 'react';
import { X, Bell, Pin, Plus, AlertCircle } from 'lucide-react';
import { Notice } from '../../types';
import { createNotice } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Notice['category']>('General');
  const [priority, setPriority] = useState<Notice['priority']>('medium');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and announcement content are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPinned,
        createdBy: profile?.uid || 'owner',
        createdByName: profile?.name || 'Building Owner'
      }, profile?.name || 'Building Owner');

      setTitle('');
      setContent('');
      setIsPinned(false);
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating notice:', err);
      setErrorMsg(err.message || 'Failed to publish notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>Publish Building Notice</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast an announcement to all residents of Amit Niwas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notice Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Main Gate Closing Hours / Water Supply Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
              >
                <option value="General">General Announcement</option>
                <option value="Maintenance">Maintenance & Utilities</option>
                <option value="Emergency">Emergency</option>
                <option value="Building Rule">Building Rule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notice Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide detailed instructions or notice information for residents..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="pin-notice-chk"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
            />
            <label htmlFor="pin-notice-chk" className="text-xs font-medium text-slate-700 select-none">
              Pin notice to the top of notice boards
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing...' : 'Publish Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
