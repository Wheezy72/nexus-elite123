import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FutureFocus, type FocusBlockLevel, type FocusSessionStatus } from 'future-focus';

type Tab = 'focus' | 'feed' | 'analytics' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('focus');
  const [status, setStatus] = useState<FocusSessionStatus | null>(null);

  const tabs = useMemo(
    () =>
      ([
        { id: 'focus', label: 'Focus' },
        { id: 'feed', label: 'Feed' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'settings', label: 'Settings' },
      ] satisfies Array<{ id: Tab; label: string }>),
    []
  );

  useEffect(() => {
    const sub = FutureFocus.addListener('FocusSessionStatus', (evt: any) => {
      setStatus(evt.status);
    });

    (async () => {
      const s = await FutureFocus.getFocusStatus();
      setStatus(s);
    })();

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0f1a' }}>
      <StatusBar style="light" />

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Future Focus (Andro)<//TText
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 12 }}>
          Notification Listener + Focus Mode + local analytics
        </Text>
        {status?.active ? (
          <Text style={{ color: 'rgba(106,231,173,0.95)', marginTop: 6, fontSize: 12 }}>
            Focus active • ends {new Date(status.endAt).toLocaleTimeString()}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: tab === t.id ? 'rgba(90,120,255,0.35)' : 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: tab === t.id ? 'rgba(90,120,255,0.6)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {tab === 'focus' ? <FocusPanel status={status} onStatus={setStatus} /> : null}
        {tab === 'feed' ? <FeedPanel /> : null}
        {tab === 'analytics' ? <AnalyticsPanel /> : null}
        {tab === 'settings' ? <SettingsPanel /> : null}
      </ScrollView>
    </SafeAreaView>
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
        backgroundColor: selected ? 'rgba(106,231,173,0.18)' : 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: selected ? 'rgba(106,231,173,0.45)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 12,
          gap: 10,
        }}
      >
        {children}
      </View>
    </View>
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
        backgroundColor: disabled ? 'rgba(255,255,255,0.12)' : 'rgba(90,120,255,0.6)',
        borderWidth: 1,
        borderColor: disabled ? 'rgba(255,255,255,0.12)' : 'rgba(90,120,255,0.85)',
      }}
    >
      <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
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
      <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
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

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const remainingMs = status?.active && status.endAt ? Math.max(0, status.endAt - Date.now()) : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  return (
    <>
      <Section title="Permissions">
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
          Notification Access: {notifGranted == null ? '…' : notifGranted ? 'granted' : 'not granted'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
          Do Not Disturb Access: {dndGranted == null ? '…' : dndGranted ? 'granted' : 'not granted'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="Grant Notification Access"
              onPress={async () => {
                await FutureFocus.openNotificationAccessSettings();
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="Grant DND Access"
              onPress={async () => {
                await FutureFocus.openDndAccessSettings();
              }}
            />
          </View>
        </View>
      </Section>

      <Section title="Focus session">
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {[15, 25, 45, 90].map(min => (
            <Chip key={min} label={`${min} min`} selected={duration === min} onPress={() => setDuration(min)} />
          ))}
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 }}>Block level</Text>
        <View style={{ gap: 8 }}>
          <Chip label="Silent" selected={blockLevel === 'silent'} onPress={() => setBlockLevel('silent')} />
          <Chip label="Vibrate only" selected={blockLevel === 'vibrate'} onPress={() => setBlockLevel('vibrate')} />
          <Chip label="Allow important" selected={blockLevel === 'important'} onPress={() => setBlockLevel('important')} />
          <Chip label="Full block" selected={blockLevel === 'full'} onPress={() => setBlockLevel('full')} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={active ? 'Focus is active' : 'Start focus'}
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
              label="End focus"
              onPress={async () => {
                const newStatus = await FutureFocus.stopFocusSession();
                onStatus(newStatus);
              }}
            />
          </View>
        </View>

        {status?.active ? (
          <>
            <Text style={{ color: 'rgba(106,231,173,0.95)', fontSize: 12 }}>
              Remaining: {remainingMin}:{String(remainingSec).padStart(2, '0')}
            </Text>
            <Text style={{ color: 'rgba(106,231,173,0.95)', fontSize: 12 }}>
              Blocked so far: {status.blockedCount}
            </Text>
          </>
        ) : (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            Start a session to suppress distractions and log them locally.
          </Text>
        )}
      </Section>
    </>
  );
}

function FeedPanel() {
  const [items, setItems] = useState<Array<{ id: string; ts: number; app: string; category: string; blocked: boolean }>>(
    []
  );

  useEffect(() => {
    (async () => {
      const list = await FutureFocus.getRecentDistractions({ limit: 80 });
      setItems(list);
    })();
  }, []);

  return (
    <Section title="Distraction feed (local)">
      {items.length === 0 ? (
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>No records yet.</Text>
      ) : (
        items.map(i => (
          <View
            key={i.id}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{i.app}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {i.category} • {new Date(i.ts).toLocaleString()} • {i.blocked ? 'blocked' : 'allowed'}
            </Text>
          </View>
        ))
      )}
    </Section>
  );
}

function AnalyticsPanel() {
  const [summary, setSummary] = useState<
    | null
    | {
        days: number;
        total: number;
        byApp: Array<{ app: string; count: number }>;
        byCategory: Array<{ category: string; count: number }>;
        byHour: Array<{ hour: number; count: number }>;
      }
  >(null);

  const [game, setGame] = useState<
    | null
    | {
        xp: number;
        focusSessionsTotal: number;
        focusStreakDays: number;
        bestFocusMinutes: number;
        trophies: Record<string, boolean>;
      }
  >(null);

  const [lastSession, setLastSession] = useState<
    | null
    | {
        sessionId: string;
        startAt: number;
        endAt: number;
        blocked: number;
        byApp: Array<{ app: string; count: number }>;
        byCategory: Array<{ category: string; count: number }>;
        peakTime?: string;
      }
  >(null);

  useEffect(() => {
    (async () => {
      const s = await FutureFocus.getDistractionAnalytics({ days: 30 });
      setSummary(s);
      const g = await FutureFocus.getGameState();
      setGame(g);
      const ls = await FutureFocus.getLastSessionSummary();
      setLastSession(ls);
    })();
  }, []);

  return (
    <>
      <Section title="Last focus session">
        {!lastSession ? (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>No completed sessions yet.</Text>
        ) : (
          <>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
              Blocked {lastSession.blocked} distractions
            </Text>
            {lastSession.peakTime ? (
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Peak time: {lastSession.peakTime}</Text>
            ) : null}
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>
              Breakdown
            </Text>
            {lastSession.byApp.slice(0, 6).map(r => (
              <Text key={r.app} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                {r.app}: {r.count}
              </Text>
            ))}
            {lastSession.byCategory.map(r => (
              <Text key={r.category} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                {r.category}: {r.count}
              </Text>
            ))}
          </>
        )}
      </Section>

      <Section title="Focus gamification">
        {!game ? (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Loading…</Text>
        ) : (
          <>
            <Text style={{ color: 'white', fontSize: 12 }}>XP: {game.xp}</Text>
            <Text style={{ color: 'white', fontSize: 12 }}>Focus sessions: {game.focusSessionsTotal}</Text>
            <Text style={{ color: 'white', fontSize: 12 }}>Daily streak: {game.focusStreakDays}</Text>
            <Text style={{ color: 'white', fontSize: 12 }}>Personal best: {game.bestFocusMinutes} min</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>
              Trophies
            </Text>
            {Object.entries(game.trophies).map(([k, v]) => (
              <Text key={k} style={{ color: v ? 'rgba(106,231,173,0.95)' : 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                {v ? 'Unlocked' : 'Locked'}: {k}
              </Text>
            ))}
          </>
        )}
      </Section>

      <Section title="30‑day patterns">
        {!summary ? (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Loading…</Text>
        ) : (
          <>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{summary.total} distractions logged</Text>

            <View style={{ marginTop: 6, gap: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' }}>Top apps</Text>
              {summary.byApp.slice(0, 6).map(r => (
                <Text key={r.app} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                  {r.app}: {r.count}
                </Text>
              ))}
            </View>

            <View style={{ marginTop: 10, gap: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' }}>By category</Text>
              {summary.byCategory.map(r => (
                <Text key={r.category} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                  {r.category}: {r.count}
                </Text>
              ))}
            </View>

            <View style={{ marginTop: 10, gap: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' }}>Peak hours</Text>
              {summary.byHour.slice(0, 5).map(r => (
                <Text key={r.hour} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                  {String(r.hour).padStart(2, '0')}:00 — {r.count}
                </Text>
              ))}
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 10 }}>
              Recommendation: schedule focus blocks before your peak distraction hour.
            </Text>
          </>
        )}
      </Section>
    </>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<
    | null
    | {
        enabled: boolean;
        blockedCategories: string[];
        scheduleEnabled: boolean;
        scheduleHour: number;
        scheduleMinute: number;
        scheduleDays: number[];
      }
  >(null);

  useEffect(() => {
    (async () => {
      const s = await FutureFocus.getSettings();
      setSettings(s);
    })();
  }, []);

  const toggleCategory = async (cat: string) => {
    if (!settings) return;
    const next = settings.blockedCategories.includes(cat)
      ? settings.blockedCategories.filter(c => c !== cat)
      : [...settings.blockedCategories, cat];

    const updated = await FutureFocus.updateSettings({ blockedCategories: next });
    setSettings(updated);
  };

  return (
    <Section title="Settings">
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
        Focus system: {!settings ? '…' : settings.enabled ? 'enabled' : 'disabled'}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={settings?.enabled ? 'Disable' : 'Enable'}
            onPress={async () => {
              if (!settings) return;
              const updated = await FutureFocus.updateSettings({ enabled: !settings.enabled });
              setSettings(updated);
            }}
            disabled={!settings}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton
            label="Clear local logs"
            onPress={async () => {
              await FutureFocus.clearLocalData();
            }}
          />
        </View>
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>
        Categories to block during focus
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {['social', 'entertainment', 'work', 'finance', 'other'].map(cat => (
          <Chip
            key={cat}
            label={cat}
            selected={Boolean(settings?.blockedCategories?.includes(cat))}
            onPress={() => toggleCategory(cat)}
          />
        ))}
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 12 }}>
        Auto-focus schedule
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
        Starts a focus session at the chosen time for your default duration.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={settings?.scheduleEnabled ? 'Scheduled: On' : 'Scheduled: Off'}
            onPress={async () => {
              if (!settings) return;
              const updated = await FutureFocus.updateSettings({ scheduleEnabled: !settings.scheduleEnabled });
              setSettings(updated);
            }}
            disabled={!settings}
          />
        </View>
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>Start time</Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {[8, 9, 10].map(h => (
          <Chip
            key={h}
            label={`${String(h).padStart(2, '0')}:00`}
            selected={settings?.scheduleHour === h}
            onPress={async () => {
              if (!settings) return;
              const updated = await FutureFocus.updateSettings({ scheduleHour: h, scheduleMinute: 0 });
              setSettings(updated);
            }}
          />
        ))}
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>Days</Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Chip
          label="Weekdays"
          selected={settings?.scheduleDays?.join(',') === '2,3,4,5,6'}
          onPress={async () => {
            if (!settings) return;
            const updated = await FutureFocus.updateSettings({ scheduleDays: [2, 3, 4, 5, 6] });
            setSettings(updated);
          }}
        />
        <Chip
          label="Every day"
          selected={settings?.scheduleDays?.length === 7}
          onPress={async () => {
            if (!settings) return;
            const updated = await FutureFocus.updateSettings({ scheduleDays: [1, 2, 3, 4, 5, 6, 7] });
            setSettings(updated);
          }}
        />
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 10 }}>
        Privacy: logs store app package/name + timestamps + category. Notification title/text are stored only as SHA-256 hashes.
      </Text>
    </Section>
  );
}
