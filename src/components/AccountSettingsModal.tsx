import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  User,
  Phone,
  Mail,
  Lock,
  Check,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80',
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const { showToast, language } = useStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setAvatar(ev.target.result);
        showToast('Photo uploaded! Click "Save Profile" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword && !currentPassword) {
      showToast('Please enter your current password to set a new password', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        avatar,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      showToast(
        language === 'km'
          ? 'ព័ត៌មានគណនី និងរូបភាពប្រវត្តិរូបត្រូវបានរក្សាទុកជោគជ័យ!'
          : 'Account profile & picture updated successfully!',
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update account', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {language === 'km' ? 'ការកំណត់គណនី & រូបភាពប្រវត្តិរូប' : 'Account Settings & Profile Picture'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'km' ? 'ប្តូររូបថត ព័ត៌មានផ្ទាល់ខ្លួន និងលេខសម្ងាត់' : 'Update profile avatar, contact details, and password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* PROFILE PICTURE SECTION */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
            <div className="relative group">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg ring-2 ring-purple-500/50"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md transition-transform hover:scale-110"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1.5 shadow-2xs hover:bg-purple-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'ផ្ទុកឡើងរូបថតថ្មី' : 'Upload New Photo'}</span>
              </button>
            </div>

            {/* Avatar Presets */}
            <div className="w-full pt-2 border-t border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 text-center uppercase tracking-wider">
                {language === 'km' ? 'ឬ ជ្រើសរើសរូបតំណាងគំរូ' : 'Or Pick a Preset Avatar'}
              </span>
              <div className="flex justify-center gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                      avatar === url ? 'border-purple-600 ring-2 ring-purple-400' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* USER INFO FIELDS */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>{language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'} *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'km' ? 'អ៊ីមែល' : 'Email Address'}</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+855 ..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>{language === 'km' ? 'តួនាទីសិទ្ធិ' : 'Role (Assigned)'}</span>
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-purple-700 dark:text-purple-300">
                {user?.role}
              </div>
            </div>
          </div>

          {/* PASSWORD CHANGE (OPTIONAL) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs">
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>{language === 'km' ? 'ប្តូរលេខសម្ងាត់ (មិនបាច់បំពេញបើមិនចង់ប្តូរ)' : 'Change Password (Optional)'}</span>
            </span>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">{language === 'km' ? 'លេខសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">{language === 'km' ? 'លេខសម្ងាត់ថ្មី' : 'New Password'}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">{language === 'km' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{language === 'km' ? 'រក្សាទុកព័ត៌មាន' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
