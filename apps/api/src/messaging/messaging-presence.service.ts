import { Injectable } from '@nestjs/common'
import { inboxRoom, threadRoom } from './messaging.events'

/** In-memory Socket.io room occupancy for email-digest suppression (single API process). */
@Injectable()
export class MessagingPresenceService {
  /** room name → userIds currently joined */
  private readonly roomMembers = new Map<string, Set<string>>()

  joinRoom(room: string, userId: string): void {
    let set = this.roomMembers.get(room)
    if (!set) {
      set = new Set()
      this.roomMembers.set(room, set)
    }
    set.add(userId)
  }

  leaveRoom(room: string, userId: string): void {
    const set = this.roomMembers.get(room)
    if (!set) return
    set.delete(userId)
    if (set.size === 0) this.roomMembers.delete(room)
  }

  leaveAllRooms(userId: string): void {
    for (const [room, set] of this.roomMembers) {
      if (set.delete(userId) && set.size === 0) {
        this.roomMembers.delete(room)
      }
    }
  }

  isInThreadRoom(userId: string, requestId: string): boolean {
    return this.roomMembers.get(threadRoom(requestId))?.has(userId) ?? false
  }

  isInInboxRoom(userId: string, conversationId: string): boolean {
    return this.roomMembers.get(inboxRoom(conversationId))?.has(userId) ?? false
  }
}
