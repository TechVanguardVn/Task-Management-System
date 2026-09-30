import { db, schema } from '@/db'
import { and, asc, eq } from 'drizzle-orm'
import 'server-only'

export async function getCardDetail(boardId: string, cardId: string) {
    const [card] = await db
        .select()
        .from(schema.cards)
        .where(
            and(eq(schema.cards.id, cardId), eq(schema.cards.boardId, boardId))
        )
        .limit(1)
    if (!card) return null

    const [comments, column] = await Promise.all([
        db
            .select({ comment: schema.comments, author: schema.users })
            .from(schema.comments)
            .innerJoin(
                schema.users,
                eq(schema.users.id, schema.comments.authorId)
            )
            .where(eq(schema.comments.cardId, cardId))
            .orderBy(asc(schema.comments.createdAt)),
        db
            .select()
            .from(schema.columns)
            .where(eq(schema.columns.id, card.columnId))
            .limit(1),
    ])

    return {
        card,
        column: column[0] ?? null,
        comments,
    }
}
