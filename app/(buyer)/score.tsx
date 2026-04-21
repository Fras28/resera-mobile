import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scoringApi } from '../../api/scoring';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  excellent: { color: '#10B981', bg: '#10B98115', label: 'Excelente',  emoji: '🟢' },
  regular:   { color: '#F59E0B', bg: '#F59E0B15', label: 'Regular',    emoji: '🟡' },
  risky:     { color: '#EF4444', bg: '#EF444415', label: 'Riesgoso',   emoji: '🔴' },
};

const EVENT_LABELS: Record<string, string> = {
  payment_on_time:    'Pago a tiempo',
  payment_late_1_3:   'Pago con retraso leve',
  payment_late_4_7:   'Pago con retraso moderado',
  payment_very_late:  'Pago con retraso grave',
  order_completed:    'Operación completada',
  positive_rating:    'Calificación positiva',
  negative_rating:    'Calificación negativa',
  account_suspended:  'Cuenta suspendida',
  dispute_lost:       'Disputa perdida',
  dispute_won:        'Disputa ganada',
  manual_adjustment:  'Ajuste manual',
};

export default function ScoreScreen() {
  const [profile,    setProfile]    = useState<any>(null);
  const [history,    setHistory]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [p, h] = await Promise.all([scoringApi.getMyScore(), scoringApi.getMyHistory()]);
      setProfile(p);
      setHistory(Array.isArray(h) ? h : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator color="#D4A853" size="large" />
      </SafeAreaView>
    );
  }

  const category = profile?.category ?? 'regular';
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.regular;
  const score = profile?.score ?? 0;
  const señaPercent = profile?.señaTier?.percent ?? profile?.señaPercent ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
      >
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Comprador</Text>
          <Text className="text-white text-2xl font-black">Mi Score</Text>
        </View>

        {/* Score card */}
        <View className="mx-4 rounded-3xl p-6 mt-2 mb-5" style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '30' }}>
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-3xl">{cfg.emoji}</Text>
            <View>
              <Text style={{ color: cfg.color }} className="font-bold text-base">{cfg.label}</Text>
              <Text className="text-white/40 text-xs">Categoría crediticia</Text>
            </View>
          </View>

          <Text style={{ color: cfg.color }} className="text-7xl font-black text-center my-2">{score}</Text>
          <Text className="text-white/30 text-xs text-center uppercase tracking-widest">puntos</Text>

          {/* Score bar */}
          <View className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min((score / 1000) * 100, 100)}%`, backgroundColor: cfg.color }}
            />
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-white/20 text-[10px]">0</Text>
            <Text className="text-white/20 text-[10px]">1000</Text>
          </View>
        </View>

        {/* Seña tier */}
        <View className="mx-4 bg-white/5 rounded-2xl p-5 mb-5">
          <Text className="text-white/60 text-xs uppercase tracking-widest mb-1">Seña requerida</Text>
          <Text className="text-gold text-3xl font-black">{señaPercent}%</Text>
          <Text className="text-white/40 text-sm mt-1">
            {señaPercent === 0 ? 'Sin seña requerida' : `Debés pagar el ${señaPercent}% al confirmar una compra`}
          </Text>
        </View>

        {/* Historial */}
        <View className="px-4">
          <Text className="text-white font-bold text-base mb-3">Historial de eventos</Text>
          {history.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-white/30 text-sm">Sin eventos todavía</Text>
            </View>
          ) : (
            history.slice(0, 20).map((evt) => (
              <View key={evt.id} className="flex-row items-center gap-3 py-3 border-b border-white/5">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: evt.pointsDelta >= 0 ? '#10B98120' : '#EF444420' }}
                >
                  <Text className="text-xs font-bold" style={{ color: evt.pointsDelta >= 0 ? '#10B981' : '#EF4444' }}>
                    {evt.pointsDelta >= 0 ? '+' : ''}{evt.pointsDelta}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm">{EVENT_LABELS[evt.type] ?? evt.type}</Text>
                  <Text className="text-white/30 text-xs mt-0.5">
                    {new Date(evt.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                </View>
                <Text className="text-white/40 text-xs">{evt.scoreAfter} pts</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
