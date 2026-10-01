'use server'

import {
  derivarExpedienteAction as derivarAction,
  type DerivarExpedienteInput,
  type DerivarExpedientePayload,
} from './expedientes'

export type { DerivarExpedienteInput, DerivarExpedientePayload }

export async function derivarExpedienteAction(
  payloadOrExpedienteId: DerivarExpedienteInput,
  param2?: any,
  param3?: any,
  param4?: any
): Promise<{ success: boolean; error?: string }> {
  return derivarAction(payloadOrExpedienteId, param2, param3, param4)
}
