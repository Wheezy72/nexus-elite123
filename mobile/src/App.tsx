import 'react-native-get-random-values';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from './lib/supabase';
import { parseMpesaSms } from './lib/mpesaSmsParser';
import { keywordCategorize } from './lib/financeCategorizer';
import { financeOfflineStore } from './services/financeOfflineStore';

type ParsedItem = {
  raw: string;
  merchant: string;
  amount: number;
  date?: string;
  category: string;
  selected: boolean;
};

export default function App() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [status, setStatus] = useState<'idle' | 'reading' | 'ready'>('idle');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [manual, setManual] = useState('');
  const [pending, setPending] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSessionUserId(data.session?.user?.id || null);
      setPending(await financeOfflineStore.getPendingCount());
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id || null);
    });

    return () => {
      sub.subscription.unsubscribe();
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
      setPending(await financeOfflineStore.getPendingCount());
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message || 'Unknown error');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setItems([]);
    setStatus('idle');
  };

  const sync = async () => {
    try {
      await financeOfflineStore.sync(supabase);
      setPending(await financeOfflineStore.getPendingCount());
      Alert.alert('Sync', 'Done');
    } catch {
      Alert.alert('Sync', 'Failed');
    }
  };

  const readSms = async () => {
    setStatus('reading');

    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', maxCount: 120 }),
      () => {
        setStatus('idle');
        Alert.alert('SMS', 'Could not read SMS (permission denied?)');
      },
      (_count: number, smsList: string) => {
        try {
          const messages = JSON.parse(smsList) as Array<{ body: string }>;
          const parsed: ParsedItem[] = [];

          for (const m of messages) {
            const tx = parseMpesaSms(m.body);
            if (!tx) continue;
            parsed.push({
              raw: tx.raw,
              merchant: tx.merchant,
              amount: tx.amount,
              date: tx.date,
              category: keywordCategorize(tx.merchant),
              selected: true,
            });
          }

          setItems(parsed.slice(0, 50));
          setStatus('ready');
        } catch {
          setStatus('idle');
          Alert.alert('SMS', 'Failed to parse SMS messages');
        }
      }
    );
  };

  const parseManual = () => {
    const lines = manual
      .split(/\n\s*\n|\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const parsed: ParsedItem[] = [];
    for (const line of lines) {
      const tx = parseMpesaSms(line);
      if (!tx) continue;
      parsed.push({
        raw: tx.raw,
        merchant: tx.merchant,
        amount: tx.amount,
        date: tx.date,
        category: keywordCategorize(tx.merchant),
        selected: true,
      });
    }

    setItems(parsed);
    setStatus('ready');
  };

  const importSelected = async () => {
    const chosen = items.filter(i => i.selected);
    if (!chosen.length) return;

    for (const it of chosen) {
      const date = it.date || new Date().toISOString().split('T')[0];
      await financeOfflineStore.addTransaction({
        id: uuidv4(),
        date,
        amount: it.amount,
        category: it.category,
        note: it.merchant,
      });
    }

    setPending(await financeOfflineStore.getPendingCount());
    setItems([]);
    setStatus('idle');

    // Best-effort sync
    await sync();
  };

  const selectedCount = useMemo(() => items.filter(i => i.selected).length, [items]);

  if (!sessionUserId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Nexus Elite</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Sign in to sync finance imports to your Supabase account.
          </Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12, gap: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Sign in</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ color: '#fff' }}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
              style={{ color: '#fff' }}
            />

            <Button label={authBusy ? 'Signing in…' : 'Sign in'} onPress={signIn} disabled={authBusy} />

            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
              Create the account first using the web app (same email + password).
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Finance Import (Android)</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>
          Reads M-Pesa SMS locally, then syncs categorized transactions to Supabase.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button label={status === 'reading' ? 'Reading…' : 'Read SMS inbox'} onPress={readSms} disabled={status === 'reading'} />
          <Button label={`Sync (pending ${pending})`} onPress={sync} />
          <Button label="Sign out" onPress={signOut} />
        </View>

        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Manual paste (fallback)</Text>
          <TextInput
            value={manual}
            onChangeText={setManual}
            placeholder="Paste M-Pesa messages here"
            placeholderTextColor="#64748b"
            style={{ color: '#fff', marginTop: 8, minHeight: 90 }}
            multiline
          />
          <Button label="Parse" onPress={parseManual} disabled={!manual.trim()} />
        </View>

        {items.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Preview</Text>

            {items.slice(0, 30).map((it, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{it.merchant}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                  {it.date || '—'} · {it.amount.toFixed(2)}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    label={it.selected ? 'Selected' : 'Select'}
                    onPress={() => setItems(prev => prev.map((x, i) => (i === idx ? { ...x, selected: !x.selected } : x)))}
                  />

                  <View style={{ flex: 1, minWidth: 160 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>Category</Text>
                    <TextInput
                      value={it.category}
                      onChangeText={t => setItems(prev => prev.map((x, i) => (i === idx ? { ...x, category: t } : x)))}
                      placeholder="e.g. utilities"
                      placeholderTextColor="#64748b"
                      style={{ color: '#fff', paddingVertical: 6 }}
                    />
                  </View>
                </View>
              </View>
            ))}

            <Button label={`Import selected (${selectedCount})`} onPress={importSelected} disabled={!selectedCount} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled }: { label: string; onPress: () => any; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.9)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}
