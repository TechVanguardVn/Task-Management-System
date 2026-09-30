import { getMembership } from '@/lib/auth/membership'
import { requireUser, type SessionUser } from '@/lib/auth/session'
import {
    canMutateBoardContent,
    isActiveMember,
    isBoardOwner,
} from '@/lib/domain/authorization'
import 'server-only'

export class ActionError extends Error {}

/** Re-reads membership from the DB on every call — never trust client-supplied role/state. */
export async function requireMembership(boardId: string): Promise<{
    user: SessionUser
    membership: NonNullable<Awaited<ReturnType<typeof getMembership>>>
}> {
    const user = await requireUser()
    const membership = await getMembership(boardId, user.id)
    if (!isActiveMember(membership)) {
        throw new ActionError('You are not an active member of this board')
    }
    return { user, membership }
}

/**
 * Gate for content mutations: active board members can edit board content.
 */
export async function requireContentEditor(boardId: string) {
    const result = await requireMembership(boardId)
    if (!canMutateBoardContent(result.membership)) {
        throw new ActionError('You cannot make changes to this board')
    }
    return result
}

export async function requireOwner(boardId: string) {
    const result = await requireMembership(boardId)
    if (!isBoardOwner(result.membership)) {
        throw new ActionError('Only the board owner can do that')
    }
    return result
}

export function actionErrorMessage(err: unknown): string {
    if (err instanceof ActionError) return err.message
    if (err instanceof Error && err.message === 'UNAUTHENTICATED')
        return 'Please log in again'
    return 'Something went wrong. Please try again.'
}
