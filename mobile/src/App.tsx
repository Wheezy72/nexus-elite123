import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FutureFocus, type FocusBlockLevel, type FocusSessionStatus } from 'future-focus';

import { supabase } from './lib/supabase';
import { ensureHealthConnectReady } from './services/healthConnect';
import { syncHealthToSupabase, type DailyHealthMetrics } from './services/healthSync';

type Tab = 'today' | 'focus' | 'settings';

const BG = '#07160f';
const GLASS = 'rgba(255,255,255,0.06)';
const BORDER = 'rgba(255,255,255,0.10)';
const PRIMARY = 'rgba(46,229,157,0.9)';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [syncBusy, setSyncBusy] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [recent, setRecent] = useState<DailyHealthMetrics[]>([]);

  const [focusStatus, setFocusStatus] = useState<FocusSessionStatus | null>(null);

  const tabs = useMemo(
    () =>
      ([
        { id: 'today', label: 'Today' },
        { id: 'focus', label: 'Focus' },
        { id: 'settings', label: 'Settings' },
      ] satisfies Array<{ id: Tab; label: string }>),
    []
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSessionUserId(data.session?.user?.id || null);

      const saved = await AsyncStorage.getItem('future-mobile-health-last-sync');
      if (saved) setLastSyncAt(saved);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id || null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const sub = FutureFocus.addListener('FocusSessionStatus', (evt: any) => {
      setFocusStatus(evt.status);
    });

    (async () => {
      const s = await FutureFocus.getFocusStatus();
      setFocusStatus(s);
    })();

    return () => {
      sub.remove();
    };
  }, []);

  const signIn = async () => {
    if (!email.trim() || !password) return;
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setEmail('');
      setPassword('');
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message || 'Unknown error');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRecent([]);
    setTab('today');
  };

  const syncHealth = async () => {
    setSyncBusy(true);
    try {
      const ok = await ensureHealthConnectReady();
      if (!ok) {
        Alert.alert('Health Connect', 'Health Connect is unavailable. Install it from the Play Store (Android 13 and below), then retry.');
        return;
      }

      const metrics = await syncHealthToSupabase({ days: 14 });
      setRecent(metrics);

      const now = new Date().toISOString();
      setLastSyncAt(now);
      await AsyncStorage.setItem('future-mobile-health-last-sync', now);

      Alert.alert('Health sync', 'Synced the last 14 days.');
    } catch (e: any) {
      Alert.alert('Health sync failed', e?.message || 'Unknown error');
    } finally {
      setSyncBusy(false);
    }
  };

  if (!sessionUserId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Header title="Future" subtitle="Sign in to sync Health Connect metrics and use Focus." />

          <Card>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Sign in</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Use the same email + password as the web app.
            </Text>

            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

            <PrimaryButton label={authBusy ? 'Signing in…' : 'Sign in'} onPress={signIn} disabled={authBusy} />
          </Card>

          <Card>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Setup</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Requires env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Future</Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4, fontSize: 12 }}>
          Health sync + Focus mode (Android)
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
        {tabs.map(t => (
          <TabButton key={t.id} label={t.label} selected={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {tab === 'today' ? (
          <>
            <Card>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Health Connect</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
                Pull steps + sleep + heart rate, then sync to your Future account.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <PrimaryButton label={syncBusy ? 'Syncing…' : 'Sync last 14 days'} onPress={syncHealth} disabled={syncBusy} />
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 10 }}>
                Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : '—'}
              </Text>
            </Card>

            <Card>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Recent</Text>
              {recent.length ? (
                <>
                  {recent.slice(-3).reverse().map(r => (
                    <View
                      key={r.date}
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{r.date}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                        Steps: {r.steps ?? '—'} • Sleep: {r.sleepMinutes != null ? Math.round(r.sleepMinutes / 60 * 10) / 10 + 'h' : '—'}
                        {r.avgHeartRate != null ? ` • HR: ${r.avgHeartRate}` : ''}
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8 }}>
                  Sync to see a preview here.
                </Text>
              )}
            </Card>
          </>
        ) : null}

        {tab === 'focus' ? <FocusPanel status={focusStatus} onStatus={setFocusStatus} /> : null}

        {tab === 'settings' ? (
          <>
            <Card>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Account</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Sign out" onPress={signOut} />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Focus permissions</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6 }}>
                Notification Access + Do Not Disturb access are required for full blocking.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Notification access" onPress={() => FutureFocus.openNotificationAccessSettings()} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="DND access" onPress={() => FutureFocus.openDndAccessSettings()} />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                Health data is stored in Supabase in daily aggregates (steps/sleep/hr). You can revoke access anytime in Health Connect.
              </Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{title}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{subtitle}</Text>
    </View>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: selected ? 'rgba(46,229,157,0.18)' : GLASS,
        borderWidth: 1,
        borderColor: selected ? 'rgba(46,229,157,0.45)' : BORDER,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        gap: 10,
      }}
    >
      {children}
    </View>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="rgba(255,255,255,0.45)"
      style={{
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.12)',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    />
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: disabled ? 'rgba(46,229,157,0.25)' : PRIMARY,
        borderWidth: 1,
        borderColor: disabled ? 'rgba(46,229,157,0.25)' : 'rgba(46,229,157,0.8)',
      }}
    >
      <Text style={{ color: '#07160f', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: selected ? 'rgba(46,229,157,0.18)' : GLASS,
        borderWidth: 1,
        borderColor: selected ? 'rgba(46,229,157,0.45)' : BORDER,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function FocusPanel({
  status,
  onStatus,
}: {
  status: FocusSessionStatus | null;
  onStatus: (s: FocusSessionStatus | null) => void;
}) {
  const [duration, setDuration] = useState(45);
  const [blockLevel, setBlockLevel] = useState<FocusBlockLevel>('silent');

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [dndGranted, setDndGranted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      setNotifGranted(await FutureFocus.hasNotificationAccess());
      setDndGranted(await FutureFocus.hasDndAccess());
    })();
  }, []);

  const active = Boolean(status?.active);
  const remainingMs = status?.active && status.endAt ? Math.max(0, status.endAt - Date.now()) : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  return (
    <>
      <Card>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Permissions</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          Notification access: {notifGranted == null ? '…' : notifGranted ? 'granted' : 'not granted'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          DND access: {dndGranted == null ? '…' : dndGranted ? 'granted' : 'not granted'}
        </Text>
      </Card>

      <Card>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Focus session</Text>

        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {[15, 25, 45, 90].map(min => (
            <Chip key={min} label={`${min} min`} selected={duration === min} onPress={() => setDuration(min)} />
          ))}
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }}>Block level</Text>
        <View style={{ gap: 8 }}>
          <Chip label="Silent" selected={blockLevel === 'silent'} onPress={() => setBlockLevel('silent')} />
          <Chip label="Vibrate" selected={blockLevel === 'vibrate'} onPress={() => setBlockLevel('vibrate')} />
          <Chip label="Important" selected={blockLevel === 'important'} onPress={() => setBlockLevel('important')} />
          <Chip label="Full" selected={blockLevel === 'full'} onPress={() => setBlockLevel('full')} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={active ? 'Focus active' : 'Start focus'}
              disabled={active}
              onPress={async () => {
                const newStatus = await FutureFocus.startFocusSession({
                  durationMinutes: duration,
                  blockLevel,
                });
                onStatus(newStatus);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="End"
              onPress={async () => {
                const newStatus = await FutureFocus.stopFocusSession();
                onStatus(newStatus);
              }}
            />
          </View>
        </View>

        {status?.active ? (
          <Text style={{ color: 'rgba(46,229,157,0.9)', fontSize: 12, marginTop: 8 }}>
            Remaining: {remainingMin}:{String(remainingSec).padStart(2, '0')} • Blocked: {status.blockedCount}
          </Text>
        ) : (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8 }}>
            Start a session to suppress distractions and log them locally.
          </Text>
        )}
      </Card>
    </>
  );
}
