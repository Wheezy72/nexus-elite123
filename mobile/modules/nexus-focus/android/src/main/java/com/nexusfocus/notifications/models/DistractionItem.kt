package com.nexusfocus.notifications.models

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class DistractionItem(
  val id: String,
  val ts: Long,
  val app: String,
  val packageName: String,
  val category: String,
  val blocked: Boolean,
  val sessionId: String? = null,
) {
  fun toWritableMap(): WritableMap {
    val m = Arguments.createMap()
    m.putString("id", id)
    m.putDouble("ts", ts.toDouble())
    m.putString("app", app)
    m.putString("packageName", packageName)
    m.putString("category", category)
    m.putBoolean("blocked", blocked)
    if (sessionId != null) m.putString("sessionId", sessionId)
    return m
  }
}
