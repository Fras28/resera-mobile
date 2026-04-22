import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';

const fmtMoney = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(mo) - 1]} ${y}`;
};

export default function AdminCommissions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const c = await adminApi.getCommissionStats();
      setData(c);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
      >
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Administración</Text>
          <Text className="text-white text-2xl font-black">Comisiones MP</Text>
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#D4A853" />
          </View>
        ) : data ? (
          <>
            {/* Stats */}
            <View className="px-4 flex-row flex-wrap gap-3 mt-2">
              {[
                { label: 'Comisión cobrada',  value: fmtMoney(data.totalCollected), emoji: '💰', color: '#D4A853' },
                { label: 'Volumen procesado', value: fmtMoney(data.totalVolume),    emoji: '📊', color: '#fff' },
                { label: 'Pagos aprobados',   value: String(data.approvedCount),     emoji: '✅', color: '#10B981' },
                { label: 'Fee Marketplace',   value: `${data.feePercent}%`,          emoji: '🏦', color: '#60A5FA' },
              ].map((s) => (
                <View key={s.label} className="bg-white/5 rounded-2xl p-4 flex-1 min-w-[44%]">
                  <Text className="text-2xl mb-2">{s.emoji}</Text>
                  <Text className="text-lg font-black" style={{ color: s.color }}>{s.value}</Text>
                  <Text className="text-white/40 text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Evolución mensual */}
            {data.byMonth?.length > 0 && (
              <View className="px-4 mt-5">
                <Text className="text-white font-bold text-base mb-3">Evolución mensual</Text>
                <View className="bg-white/5 rounded-2xl p-4">
                  <View className="flex-row justify-between mb-2 pb-2 border-b border-white/10">
                    <Text className="text-white/40 text-xs uppercase tracking-widest flex-1">Mes</Text>
                    <Text className="text-white/40 text-xs uppercase tracking-widest w-24 text-right">Volumen</Text>
                    <Text className="text-white/40 text-xs uppercase tracking-widest w-20 text-right">Comisión</Text>
                  </View>
                  {[...data.byMonth].reverse().map((m: any) => (
                    <View key={m.month} className="flex-row justify-between py-2.5 border-b border-white/5">
                      <Text className="text-white text-sm flex-1">{fmtMonth(m.month)}</Text>
                      <Text className="text-white/60 text-sm w-24 text-right">{fmtMoney(m.volume)}</Text>
                      <Text className="text-gold font-semibold text-sm w-20 text-right">{fmtMoney(m.fee)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Últimos pagos */}
            <View className="px-4 mt-5">
              <Text className="text-white font-bold text-base mb-3">Últimos pagos aprobados</Text>
              <View className="bg-white/5 rounded-2xl p-4">
                {data.recent?.length > 0 ? data.recent.map((p: any) => (
                  <View key={p.id} className="flex-row justify-between items-center py-3 border-b border-white/5">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <View
                          className="rounded-full px-2 py-0.5"
                          style={{ backgroundColor: p.paymentType === 'seña' ? '#F59E0B25' : '#3B82F625' }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: p.paymentType === 'seña' ? '#F59E0B' : '#60A5FA' }}
                          >
                            {p.paymentType === 'seña' ? 'Seña' : 'Saldo'}
                          </Text>
                        </View>
                        <Text className="text-white/30 text-xs font-mono">{p.orderId.slice(0, 8)}…</Text>
                      </View>
                      <Text className="text-white/40 text-xs">
                        {new Date(p.createdAt).toLocaleDateString('es-AR')}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-sm">{fmtMoney(p.amount)}</Text>
                      <Text className="text-gold text-xs font-semibold">+{fmtMoney(p.fee)}</Text>
                    </View>
                  </View>
                )) : (
                  <Text className="text-white/30 text-sm text-center py-8">No hay pagos aprobados aún</Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <View className="py-20 items-center">
            <Text className="text-white/30">No se pudo cargar la información</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
