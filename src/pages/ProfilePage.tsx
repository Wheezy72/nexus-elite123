import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, LogOut, Upload, Trash2, Lock } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { decryptBytes, encryptBytes } from '@/lib/encryption';
import { packEncryptedContainer, unpackEncryptedContainer } from '@/lib/encryptedContainer';
import { pinLockService } from '@/services/pinLockService';
import { toast } from 'sonner';

const AVATARS = [
  { id: 'avatar-01', emoji: '🦊', bg: 'from-orange-500/30 to-amber-500/20' },
  { id: 'avatar-02', emoji: '🐺', bg: 'from-slate-500/30 to-blue-500/20' },
  { id: 'avatar-03', emoji: '🦁', bg: 'from-yellow-500/30 to-orange-500/20' },
  { id: 'avatar-04', emoji: '🐼', bg: 'from-gray-500/30 to-white/10' },
  { id: 'avatar-05', emoji: '🦄', bg: 'from-purple-500/30 to-pink-500/20' },
  { id: 'avatar-06', emoji: '🐲', bg: 'from-green-500/30 to-emerald-500/20' },
  { id: 'avatar-07', emoji: '🦅', bg: 'from-amber-500/30 to-yellow-500/20' },
  { id: 'avatar-08', emoji: '🐙', bg: 'from-pink-500/30 to-red-500/20' },
  { id: 'avatar-09', emoji: '🦋', bg: 'from-cyan-500/30 to-blue-500/20' },
  { id: 'avatar-10', emoji: '🐝', bg: 'from-yellow-500/30 to-amber-500/20' },
  { id: 'avatar-11', emoji: '🦖', bg: 'from-green-600/30 to-lime-500/20' },
  { id: 'avatar-12', emoji: '🐳', bg: 'from-blue-500/30 to-cyan-500/20' },
  { id: 'avatar-13', emoji: '🦉', bg: 'from-amber-700/30 to-orange-500/20' },
  { id: 'avatar-14', emoji: '🐸', bg: 'from-green-500/30 to-lime-500/20' },
  { id: 'avatar-15', emoji: '🦊', bg: 'from-red-500/30 to-orange-500/20' },
  { id: 'avatar-16', emoji: '🤖', bg: 'from-primary/30 to-accent/20' },
  { id: 'avatar-17', emoji: '👾', bg: 'from-violet-500/30 to-purple-500/20' },
  { id: 'avatar-18', emoji: '🎭', bg: 'from-rose-500/30 to-pink-500/20' },
  { id: 'avatar-19', emoji: '🧙', bg: 'from-indigo-500/30 to-blue-500/20' },
  { id: 'avatar-20', emoji: '🚀', bg: 'from-sky-500/30 to-blue-500/20' },
];

export function getAvatarById(id: string | null) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

const ProfilePage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || 'avatar-01');
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSelectedAvatar(profile.avatar_url || 'avatar-01');
    }
  }, [profile]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user?.id) return;
      const path = profile?.profile_photo_path || null;
      if (!path) {
        setPhotoUrl(null);
        return;
      }

      const key = pinLockService.getVaultKey();
      if (!key) {
        setPhotoUrl(null);
        return;
      }

      try {
        setPhotoBusy(true);
        const { data, error } = await supabase.storage.from('future-profile').download(path);
        if (error) throw error;

        const buf = new Uint8Array(await data.arrayBuffer());
        const unpacked = unpackEncryptedContainer(buf);

        const plaintext = await decryptBytes(unpacked.payload, key);
        const contentType = typeof unpacked.header.contentType === 'string' ? unpacked.header.contentType : 'image/png';

        const url = URL.createObjectURL(new Blob([plaintext], { type: contentType }));
        if (!cancelled) setPhotoUrl(url);
      } catch {
        if (!cancelled) setPhotoUrl(null);
      } finally {
        if (!cancelled) setPhotoBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.profile_photo_path]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, avatar_url: selectedAvatar })
        .eq('user_id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canUseEncryptedPhoto = pinLockService.isUnlocked();

  const uploadPhoto = async (file: File) => {
    if (!user) return;

    const key = pinLockService.getVaultKey();
    if (!key) {
      toast.error('Enable App Lock and unlock with your PIN to use encrypted profile photos');
      return;
    }

    setPhotoBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const payload = await encryptBytes(bytes, key);

      const packed = packEncryptedContainer(payload, {
        contentType: file.type || 'image/png',
      });

      const container = new Blob([packed], { type: 'application/octet-stream' });

      const path = `${user.id}/profile-photo.bin`;
      const { error: uploadError } = await supabase.storage.from('future-profile').upload(path, container, {
        upsert: true,
        contentType: 'application/octet-stream',
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_path: path })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Encrypted profile photo updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    const path = profile?.profile_photo_path || null;
    if (!path) return;

    setPhotoBusy(true);
    try {
      await supabase.storage.from('future-profile').remove([path]);
      const { error } = await supabase.from('profiles').update({ profile_photo_path: null }).eq('user_id', user.id);
      if (error) throw error;
      await refreshProfile();
      setPhotoUrl(null);
      toast.success('Profile photo removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo');
    } finally {
      setPhotoBusy(false);
    }
  };

  const currentAvatar = getAvatarById(selectedAvatar);

  return (
    <PageLayout>
      <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Profile</motion.h1>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-2xl">

        {/* Current Avatar & Name */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-6" tilt={false}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentAvatar.bg} border border-white/10 flex items-center justify-center overflow-hidden`}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl">{currentAvatar.emoji}</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold">{displayName || 'User'}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <label className="text-xs text-muted-foreground block mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value.slice(0, 50))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm focus:outline-none focus:border-primary/40 transition-colors mb-4"
            />

            {/* Encrypted Profile Photo */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Encrypted Profile Photo</label>
                {!canUseEncryptedPhoto && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    Unlock required
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoBusy}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {photoUrl ? 'Replace Photo' : 'Upload Photo'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={removePhoto}
                  disabled={photoBusy || !profile?.profile_photo_path}
                  className="px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </motion.button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = '';
                }}
              />

              <p className="mt-2 text-[10px] text-muted-foreground">
                Stored end-to-end encrypted with XChaCha20-Poly1305. Requires App Lock PIN on this device.
              </p>
            </div>

            {/* Avatar Grid */}
            <label className="text-xs text-muted-foreground block mb-2">Choose Avatar</label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
              {AVATARS.map(avatar => (
                <motion.button
                  key={avatar.id}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${avatar.bg} border flex items-center justify-center text-xl transition-all ${
                    selectedAvatar === avatar.id
                      ? 'border-primary ring-2 ring-primary/30 shadow-[0_0_15px_hsl(var(--primary)_/_0.22)]'
                      : 'border-white/[0.06] opacity-60 hover:opacity-100'
                  }`}
                >
                  {avatar.emoji}
                  {selectedAvatar === avatar.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={save}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
            </motion.button>
          </GlassCard>
        </motion.div>

        {/* Sign Out */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="flex items-center gap-2 text-destructive text-sm font-medium hover:underline"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </motion.button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default ProfilePage;
