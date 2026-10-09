export type ReferenceKind = 'coach' | 'venue' | 'level'
export interface ReferenceInput { createRequestId?: string; name: string; address?: string | null; version?: number }
export interface ReferenceRecord { id: string; kind: ReferenceKind; name: string; address: string | null; version: number; isSample: boolean }
