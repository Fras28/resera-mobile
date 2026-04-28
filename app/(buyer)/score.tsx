import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scoringApi } from '../../api/scoring';
import {
  FadeInView,
  SlideInView,
  AnimatedNumber,
  AnimatedProgressBar,
  Skeleton,
} from '../../components/animated';
import { staggerDelay } from '../../utils/motion';

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
      <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
        <View className="px-4 pt-4 pb-3">
          <Skeleton height={12} width="20%" />
          <View style={{ height: 6 }} />
          <Skeleton height={28} width="40%" />
        </View>
        <View className="mx-4 rounded-3xl p-6 mt-2 mb-5 bg-white/5">
          <Skeleton height={48} width="50%" radius={12} />
          <View style={{ height: 16 }} />
          <Skeleton height={88} radius={12} />
          <View style={{ height: 12 }} />
          <Skeleton height={8} radius={4} />
        </View>
        <View className="mx-4 bg-white/5 rounded-2xl p-5 mb-5">
          <Skeleton height={10} width="30%" />
          <View style={{ height: 8 }} />
          <Skeleton height={32} width="40%" />
        </View>
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
        <SlideInView from="up" distance={12} className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Comprador</Text>
          <Text className="text-white text-2xl font-black">Mi Score</Text>
        </SlideInView>

        {/* Score card */}
        <FadeInView delay={80} translateY={16}>
          <View
            className="mx-4 rounded-3xl p-6 mt-2 mb-5"
            style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '30' }}
            accessible
            accessibilityLabel={`Categoría ${cfg.label}, puntaje ${score} de 1000`}
          >
            <View className="flex-row items-center gap-3 mb-4">
              <Text className="text-3xl">{cfg.emoji}</Text>
              <View>
                <Text style={{ color: cfg.color }} className="font-bold text-base">{cfg.label}</Text>
                <Text className="text-white/40 text-xs">Categoría crediticia</Text>
              </View>
            </View>

            <AnimatedNumber
              value={score}
              style={{ color: cfg.color, fontSize: 72, fontWeight: '900', textAlign: 'center', marginVertical: 8 }}
            />
            <Text className="text-white/30 text-xs text-center uppercase tracking-widest">puntos</Text>

            {/* Score bar */}
            <AnimatedProgressBar
              progress={Math.min(score / 1000, 1)}
              color={cfg.color}
              height={8}
              delay={200}
              style={{ marginTop: 20 }}
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-white/20 text-[10px]">0</Text>
              <Text className="text-white/20 text-[10px]">1000</Text>
            </View>
          </View>
        </FadeInView>

        {/* Seña tier */}
        <FadeInView delay={160} translateY={12}>
          <View className="mx-4 bg-white/5 rounded-2xl p-5 mb-5">
            <Text className="text-white/60 text-xs uppercase tracking-widest mb-1">Seña requerida</Text>
            <AnimatedNumber
              value={señaPercent}
              suffix="%"
              style={{ color: '#D4A853', fontSize: 30, fontWeight: '900' }}
            />
            <Text className="text-white/40 text-sm mt-1">
              {señaPercent === 0 ? 'Sin seña requerida' : `Debés pagar el ${señaPercent}% al confirmar una compra`}
            </Text>
          </View>
        </FadeInView>

        {/* Historial */}
        <View className="px-4">
          <FadeInView delay={220}>
            <Text className="text-white font-bold text-base mb-3">Historial de eventos</Text>
          </FadeInView>
          {history.length === 0 ? (
            <FadeInView delay={260} className="items-center py-8">
              <Text className="text-white/30 text-sm">Sin eventos todavía</Text>
            </FadeInView>
          ) : (
            history.slice(0, 20).map((evt, idx) => (
              <FadeInView key={evt.id} delay={260 + staggerDelay(idx, 30, 360)} translateY={8}>
                <View className="flex-row items-center gap-3 py-3 border-b border-white/5">
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
              </FadeInView>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
