package com.futurefocus.notifications.models

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class FocusStatus(
  val active: Boolean,
  val sessionId: String? = null,
  val startAt: Long? = null,
  val endAt: Long? = null,
  val blockLevel: BlockLevel? = null,
  val blockedCount: Int = 0,
) {
  fun toWritableMap(): WritableMap {
    val m = Arguments.createMap()
    m.putBoolean("active", active)
    if (sessionId != null) m.putString("sessionId", sessionId)
    if (startAt != null) m.putDouble("startAt", startAt.toDouble())
    if (endAt != null) m.putDouble("endAt", endAt.toDouble())
    if (blockLevel != null) m.putString("blockLevel", blockLevel.js)
    m.putInt("blockedCount", blockedCount)
    return m
  }
}
