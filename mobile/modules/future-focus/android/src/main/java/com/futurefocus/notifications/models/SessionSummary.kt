package com.futurefocus.notifications.models

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class SessionSummary(
  val sessionId: String,
  val startAt: Long,
  val endAt: Long,
  val blocked: Int,
  val byApp: List<Pair<String, Int>>,
  val byCategory: List<Pair<String, Int>>,
  val peakTime: String?,
) {
  fun toWritableMap(): WritableMap {
    val m = Arguments.createMap()
    m.putString("sessionId", sessionId)
    m.putDouble("startAt", startAt.toDouble())
    m.putDouble("endAt", endAt.toDouble())
    m.putInt("blocked", blocked)

    val apps = Arguments.createArray()
    for ((app, count) in byApp) {
      val row = Arguments.createMap()
      row.putString("app", app)
      row.putInt("count", count)
      apps.pushMap(row)
    }
    m.putArray("byApp", apps)

    val cats = Arguments.createArray()
    for ((cat, count) in byCategory) {
      val row = Arguments.createMap()
      row.putString("category", cat)
      row.putInt("count", count)
      cats.pushMap(row)
    }
    m.putArray("byCategory", cats)

    if (peakTime != null) m.putString("peakTime", peakTime)

    return m
  }
}
