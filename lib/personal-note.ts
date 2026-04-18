/** Serialized personal note for a subject (User). */
export type PersonalNote = {
  readonly id: string
  readonly content: string
  readonly createdAt: string
  readonly updatedAt: string
}

export const PERSONAL_NOTE_MAX_LENGTH = 50_000
