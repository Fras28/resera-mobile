// Resera — sistema de motion compartido.
//
// Filosofía: animaciones sutiles y profesionales (200–320 ms), con respeto a
// `prefers-reduced-motion`. Pensado para que las pantallas se sientan vivas
// sin entorpecer la lectura ni la interacción.

import { Easing, ReduceMotion } from 'react-native-reanimated';

/* ────────────────────────────────────────────────────────────────────────── */
/* Duraciones                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const DURATION = {
  /** Micro-interacción (press, toggle) */
  micro:   120,
  /** Entrada/salida estándar */
  short:   220,
  /** Transiciones notorias */
  medium:  320,
  /** Transiciones de pantalla / panel */
  long:    480,
} as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Easings                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Curvas de easing reutilizables. Preferimos curvas estándar de Material/iOS
 * para que la app se sienta nativa y predecible.
 */
export const EASING = {
  /** Estándar (acelera y desacelera) — para movimientos en pantalla */
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  /** Decelerated — para entradas (objetos que aparecen) */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Accelerated — para salidas (objetos que se van) */
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  /** Para énfasis (overshoot suave) */
  emphasized: Easing.bezier(0.2, 0.0, 0, 1),
} as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Springs                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Configs de spring para gestos / toques. Mantenemos `damping` alto para que
 * el rebote sea sutil (no bouncy).
 */
export const SPRING = {
  /** Press feedback: rápido y firme */
  press: {
    damping: 18,
    stiffness: 320,
    mass: 0.6,
  },
  /** Pop: para iconos que cambian de estado (favorito) */
  pop: {
    damping: 12,
    stiffness: 240,
    mass: 0.7,
  },
  /** Suave: para entradas con un toque de vida */
  soft: {
    damping: 22,
    stiffness: 180,
    mass: 0.9,
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Stagger                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Calcula el delay para una animación staggered. Limita el delay máximo para
 * que ninguna fila quede esperando demasiado tiempo en listas largas.
 */
export function staggerDelay(index: number, step = 40, max = 240): number {
  return Math.min(index * step, max);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Reduced motion                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Política por defecto para respetar el setting de "reducir movimiento" del
 * sistema operativo. Las animaciones simplemente no se ejecutan.
 */
export const REDUCE_MOTION = ReduceMotion.System;
