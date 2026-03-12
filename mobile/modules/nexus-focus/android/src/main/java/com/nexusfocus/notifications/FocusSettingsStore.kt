package com.nexusfocus.notifications

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray

class FocusSettingsStore(context: Context) {
  private val prefs: SharedPreferences = context.getSharedPreferences("nexus_focus_settings", Context.MODE_PRIVATE)

  fun getEnabled(): Boolean = prefs.getBoolean("enabled", true)
  fun setEnabled(value: Boolean) = prefs.edit().putBoolean("enabled", value).apply()

  fun getDefaultDurationMinutes(): Int = prefs.getInt("defaultDurationMinutes", 45)
  fun setDefaultDurationMinutes(value: Int) = prefs.edit().putInt("defaultDurationMinutes", value).apply()

  fun getAlwaysAllowedPackages(): List<String> {
    val raw = prefs.getString("alwaysAllowedPackages", null) ?: return defaultAlwaysAllowed()
    return jsonArrayToList(raw)
  }

  fun setAlwaysAllowedPackages(value: List<String>) {
    prefs.edit().putString("alwaysAllowedPackages", listToJsonArray(value).toString()).apply()
  }

  fun getBlockedCategories(): List<String> {
    val raw = prefs.getString("blockedCategories", null) ?: return defaultBlockedCategories()
    return jsonArrayToList(raw)
  }

  fun setBlockedCategories(value: List<String>) {
    prefs.edit().putString("blockedCategories", listToJsonArray(value).toString()).apply()
  }

  fun getScheduleEnabled(): Boolean = prefs.getBoolean("scheduleEnabled", false)
  fun setScheduleEnabled(value: Boolean) = prefs.edit().putBoolean("scheduleEnabled", value).apply()

  fun getScheduleHour(): Int = prefs.getInt("scheduleHour", 9)
  fun setScheduleHour(value: Int) = prefs.edit().putInt("scheduleHour", value).apply()

  fun getScheduleMinute(): Int = prefs.getInt("scheduleMinute", 0)
  fun setScheduleMinute(value: Int) = prefs.edit().putInt("scheduleMinute", value).apply()

  fun getScheduleDays(): List<Int> {
    val raw = prefs.getString("scheduleDays", null) ?: return defaultScheduleDays()
    return jsonArrayToIntList(raw)
  }

  fun setScheduleDays(value: List<Int>) {
    prefs.edit().putString("scheduleDays", intListToJsonArray(value).toString()).apply()
  }

  fun getAll(): FocusSettings {
    return FocusSettings(
      enabled = getEnabled(),
      defaultDurationMinutes = getDefaultDurationMinutes(),
      alwaysAllowedPackages = getAlwaysAllowedPackages(),
      blockedCategories = getBlockedCategories(),
      scheduleEnabled = getScheduleEnabled(),
      scheduleHour = getScheduleHour(),
      scheduleMinute = getScheduleMinute(),
      scheduleDays = getScheduleDays(),
    )
  }

  private fun jsonArrayToList(raw: String): List<String> {
    val arr = JSONArray(raw)
    val out = ArrayList<String>(arr.length())
    for (i in 0 until arr.length()) {
      out.add(arr.getString(i))
    }
    return out
  }

  private fun jsonArrayToIntList(raw: String): List<Int> {
    val arr = JSONArray(raw)
    val out = ArrayList<Int>(arr.length())
    for (i in 0 until arr.length()) {
      out.add(arr.getInt(i))
    }
    return out
  }

  private fun listToJsonArray(list: List<String>): JSONArray {
    val arr = JSONArray()
    for (item in list) arr.put(item)
    return arr
  }

  private fun intListToJsonArray(list: List<Int>): JSONArray {
    val arr = JSONArray()
    for (item in list) arr.put(item)
    return arr
  }

  private fun defaultAlwaysAllowed(): List<String> {
    return listOf(
      "com.android.dialer",
      "com.google.android.dialer",
      "com.android.contacts",
      "com.google.android.contacts",
      "com.android.incallui",
      "com.android.systemui",
    )
  }

  private fun defaultBlockedCategories(): List<String> {
    return listOf("social", "entertainment")
  }

  private fun defaultScheduleDays(): List<Int> {
    // Calendar day-of-week integers: 1=Sunday..7=Saturday
    return listOf(2, 3, 4, 5, 6)
  }
}

data class FocusSettings(
  val enabled: Boolean,
  val defaultDurationMinutes: Int,
  val alwaysAllowedPackages: List<String>,
  val blockedCategories: List<String>,
  val scheduleEnabled: Boolean,
  val scheduleHour: Int,
  val scheduleMinute: Int,
  val scheduleDays: List<Int>,
) {
  fun toWritableMap(): com.facebook.react.bridge.WritableMap {
    val m = com.facebook.react.bridge.Arguments.createMap()
    m.putBoolean("enabled", enabled)
    m.putInt("defaultDurationMinutes", defaultDurationMinutes)

    val allowed = com.facebook.react.bridge.Arguments.createArray()
    for (p in alwaysAllowedPackages) allowed.pushString(p)
    m.putArray("alwaysAllowedPackages", allowed)

    val cats = com.facebook.react.bridge.Arguments.createArray()
    for (c in blockedCategories) cats.pushString(c)
    m.putArray("blockedCategories", cats)

    m.putBoolean("scheduleEnabled", scheduleEnabled)
    m.putInt("scheduleHour", scheduleHour)
    m.putInt("scheduleMinute", scheduleMinute)

    val days = com.facebook.react.bridge.Arguments.createArray()
    for (d in scheduleDays) days.pushInt(d)
    m.putArray("scheduleDays", days)

    return m
  }
}
