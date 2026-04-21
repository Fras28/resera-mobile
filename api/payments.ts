import apiClient from './client';

export interface PaymentPreference {
  id:          string;
  orderId:     string;
  paymentType: 'seña' | 'saldo';
  amount:      number;
  initPoint:   string;
  status:      string;
}

export const paymentsApi = {
  /**
   * Genera (o recupera) el link de pago de la SEÑA.
   * Retorna la URL de Mercado Pago lista para abrir en el browser.
   */
  createSeñaPreference: async (orderId: string): Promise<PaymentPreference> => {
    const { data } = await apiClient.post(`/payments/orders/${orderId}/sena`);
    return data?.data ?? data;
  },

  /**
   * Genera (o recupera) el link de pago del SALDO.
   * Solo disponible cuando el pedido está en estado 'despachado'.
   */
  createSaldoPreference: async (orderId: string): Promise<PaymentPreference> => {
    const { data } = await apiClient.post(`/payments/orders/${orderId}/saldo`);
    return data?.data ?? data;
  },

  /** Historial de pagos de un pedido (seña + saldo). */
  getForOrder: async (orderId: string): Promise<PaymentPreference[]> => {
    const { data } = await apiClient.get(`/payments/orders/${orderId}`);
    const result = data?.data ?? data;
    return Array.isArray(result) ? result : [];
  },
};
