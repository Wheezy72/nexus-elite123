import { supabase } from '@/integrations/supabase/client';
import { decryptString, encryptString, fromBase64, toBase64 } from '@/lib/encryption';
import { packEncryptedContainer, unpackEncryptedContainer } from '@/lib/encryptedContainer';
import { pinLockService } from '@/services/pinLockService';

const BACKUP_BUCKET = 'future-backups';
const LAST_BACKUP_KEY = 'future-last-backup-at';

export interface EncryptedBackup {
  v: 1;
  createdAt: string;
  device: {
    userAgent: string;
  };
  data: {
    chatHistoryBlob: unknown | null;
    profilePhoto: null | {
      path: string;
      contentType: string;
      encryptedFileB64: string;
    };
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

async function downloadEncryptedProfilePhoto(path: string) {
  const { data, error } = await supabase.storage.from('future-profile').download(path);
  if (error) throw error;
  const buf = new Uint8Array(await data.arrayBuffer());
  return {
    contentType: 'application/octet-stream',
    encryptedFileB64: toBase64(buf),
  };
}

async function getProfilePhotoPath(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_photo_path')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return (data?.profile_photo_path as string | null) || null;
}

export const backupService = {
  async createBackupObject(profilePhotoPath: string | null): Promise<EncryptedBackup> {
    const rawChat = localStorage.getItem('future-chat-history');
    const chatHistoryBlob = rawChat ? JSON.parse(rawChat) : null;

    let profilePhoto: EncryptedBackup['data']['profilePhoto'] = null;
    if (profilePhotoPath) {
      const downloaded = await downloadEncryptedProfilePhoto(profilePhotoPath);
      profilePhoto = {
        path: profilePhotoPath,
        contentType: downloaded.contentType,
        encryptedFileB64: downloaded.encryptedFileB64,
      };
    }

    return {
      v: 1,
      createdAt: new Date().toISOString(),
      device: { userAgent: navigator.userAgent },
      data: {
        chatHistoryBlob,
        profilePhoto,
      },
    };
  },

  async uploadBackup(backup: EncryptedBackup) {
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in');

    const key = pinLockService.getVaultKey();
    if (!key) throw new Error('Unlock with PIN to enable encrypted backups');

    const payload = await encryptString(JSON.stringify(backup), key);

    const filename = `backup-${todayKey()}-${Date.now()}.json.enc`;
    const path = `${userId}/${filename}`;

    const packed = packEncryptedContainer(payload);

    const container = new Blob([packed], { type: 'application/octet-stream' });

    const { error } = await supabase.storage.from(BACKUP_BUCKET).upload(path, container, {
      upsert: true,
      contentType: 'application/octet-stream',
    });

    if (error) throw error;

    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    return path;
  },

  async listBackups(limit = 10) {
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in');

    const { data, error } = await supabase.storage.from(BACKUP_BUCKET).list(userId, {
      limit,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;
    return (data || []).map((f) => ({
      name: f.name,
      path: `${userId}/${f.name}`,
      createdAt: f.created_at || null,
    }));
  },

  async downloadAndDecryptBackup(path: string): Promise<EncryptedBackup> {
    const key = pinLockService.getVaultKey();
    if (!key) throw new Error('Unlock with PIN to restore backups');

    const { data, error } = await supabase.storage.from(BACKUP_BUCKET).download(path);
    if (error) throw error;

    const buf = new Uint8Array(await data.arrayBuffer());

    const unpacked = unpackEncryptedContainer(buf);
    const plaintext = await decryptString(unpacked.payload, key);
    return JSON.parse(plaintext) as EncryptedBackup;
  },

  async restoreFromBackup(backup: EncryptedBackup) {
    // Restore chat history (local device)
    if (backup.data.chatHistoryBlob) {
      localStorage.setItem('future-chat-history', JSON.stringify(backup.data.chatHistoryBlob));
    }

    // Restore encrypted profile photo back into storage (still encrypted)
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in');

    if (backup.data.profilePhoto) {
      const { path, contentType, encryptedFileB64 } = backup.data.profilePhoto;
      const bytes = fromBase64(encryptedFileB64);

      const { error } = await supabase.storage.from('future-profile').upload(path, new Blob([bytes], { type: contentType }), {
        upsert: true,
        contentType: 'application/octet-stream',
      });
      if (error) throw error;

      await supabase.from('profiles').update({ profile_photo_path: path }).eq('user_id', userId);
    }
  },

  async maybeAutoBackup() {
    const last = localStorage.getItem(LAST_BACKUP_KEY);
    if (last) {
      const lastTs = Date.parse(last);
      if (!Number.isNaN(lastTs) && Date.now() - lastTs < 24 * 60 * 60 * 1000) return false;
    }

    const key = pinLockService.getVaultKey();
    if (!key) return false;

    const userId = await getUserId();
    if (!userId) return false;

    const profilePhotoPath = await getProfilePhotoPath(userId);
    const backup = await this.createBackupObject(profilePhotoPath);
    await this.uploadBackup(backup);
    return true;
  },
};
