import { db, schema } from '@/db'
import { and, count, desc, eq } from 'drizzle-orm'
import 'server-only'

export async function listBoardsForUser(userId: string) {
    const memberships = await db
        .select({ board: schema.boards })
        .from(schema.boardMemberships)
        .innerJoin(
            schema.boards,
            eq(schema.boards.id, schema.boardMemberships.boardId)
        )
        .where(
            and(
                eq(schema.boardMemberships.userId, userId),
                eq(schema.boardMemberships.status, 'active')
            )
        )
        .orderBy(desc(schema.boards.updatedAt))

    const boards = await Promise.all(
        memberships.map(async ({ board }) => {
            const [{ value: cardCount }] = await db
                .select({ value: count() })
                .from(schema.cards)
                .where(
                    and(
                        eq(schema.cards.boardId, board.id),
                        eq(schema.cards.status, 'active')
                    )
                )

            return { board, cardCount }
        })
    )

    return {
        active: boards.filter((b) => b.board.status === 'active'),
        closed: boards.filter((b) => b.board.status === 'closed'),
    }
}
