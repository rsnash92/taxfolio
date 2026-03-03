export type Role = 'owner' | 'manager' | 'preparer'

export type MtdStage =
  | 'not_started'
  | 'awaiting_data'
  | 'categorising'
  | 'ready_for_review'
  | 'ready_to_submit'
  | 'submitted'
  | 'failed'

export type Sa100Stage =
  | 'not_started'
  | 'awaiting_data'
  | 'in_progress'
  | 'ready_for_review'
  | 'ready_to_submit'
  | 'submitted'
  | 'failed'

export type PipelineStage = MtdStage | Sa100Stage

// Stages shown as Kanban columns (excludes not_started and failed)
export const MTD_COLUMN_STAGES: MtdStage[] = [
  'awaiting_data',
  'categorising',
  'ready_for_review',
  'ready_to_submit',
  'submitted',
]

export const SA100_COLUMN_STAGES: Sa100Stage[] = [
  'awaiting_data',
  'in_progress',
  'ready_for_review',
  'ready_to_submit',
  'submitted',
]

/**
 * Define which stage transitions are allowed and by which roles.
 * Key format: "from_stage -> to_stage"
 */
const TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  // Forward transitions
  'not_started -> awaiting_data': ['owner', 'manager', 'preparer'],
  'awaiting_data -> categorising': ['owner', 'manager', 'preparer'],
  'awaiting_data -> in_progress': ['owner', 'manager', 'preparer'],
  'categorising -> ready_for_review': ['owner', 'manager', 'preparer'],
  'in_progress -> ready_for_review': ['owner', 'manager', 'preparer'],
  'ready_for_review -> ready_to_submit': ['owner', 'manager'],
  'ready_to_submit -> submitted': ['owner', 'manager'],

  // Reject/revert transitions
  'ready_for_review -> categorising': ['owner', 'manager'],
  'ready_for_review -> in_progress': ['owner', 'manager'],
  'ready_for_review -> awaiting_data': ['owner', 'manager'],
  'ready_to_submit -> ready_for_review': ['owner', 'manager'],
  'failed -> awaiting_data': ['owner', 'manager'],
  'failed -> categorising': ['owner', 'manager'],
  'failed -> in_progress': ['owner', 'manager'],
  'failed -> ready_to_submit': ['owner', 'manager'],
  'submitted -> awaiting_data': ['owner', 'manager'],
}

export function canTransition(role: Role, fromStage: string, toStage: string): boolean {
  const key = `${fromStage} -> ${toStage}`
  const allowedRoles = TRANSITION_PERMISSIONS[key]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

export function canSubmitToHMRC(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

export function canAddClient(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

export function canDeleteClient(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

export function canViewAllClients(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

export function canSendEmail(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

export function canManageTeam(role: Role): boolean {
  return role === 'owner'
}

export function canManageSettings(role: Role): boolean {
  return role === 'owner'
}

export function canManageBilling(role: Role): boolean {
  return role === 'owner'
}

/**
 * Get available next stages for a given current stage and role.
 */
export function getAvailableTransitions(role: Role, currentStage: string): string[] {
  const available: string[] = []
  for (const key of Object.keys(TRANSITION_PERMISSIONS)) {
    const [from, to] = key.split(' -> ')
    if (from === currentStage && TRANSITION_PERMISSIONS[key].includes(role)) {
      available.push(to)
    }
  }
  return available
}
