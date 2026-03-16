package com.futurefocus.notifications.models

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

data class AnalyticsSummary(
  val days: Int,
  val total: Int,
  val byApp: List<Pair<String, Int>>,
  val byCategory: List<Pair<String, Int>>,
  val byHour: List<Pair<Int, Int>>,
) {
  fun toWritableMap(): WritableMap {
    val m = Arguments.createMap()
    m.putInt("days", days)
    m.putInt("total", total)

    val apps = Arguments.createArray()
    for ((app, count) in byApp) {
      val row = Arguments.createMap()
      row.putString("app", app)
      row.putInt("count", count)
      apps.pushMap(row)
    }

    val cats = Arguments.createArray()
    for ((cat, count) in byCategory) {
      val row = Arguments.createMap()
      row.putString("category", cat)
      row.putInt("count", count)
      cats.pushMap(row)
    }

    val hours = Arguments.createArray()
    for ((hour, count) in byHour) {
      val row = Arguments.createMap()
      row.putInt("hour", hour)
      row.putInt("count", count)
      hours.pushMap(row)
    }

    m.putArray("byApp", apps)
    m.putArray("byCategory", cats)
    m.putArray("byHour", hours)
    return m
  }
}
