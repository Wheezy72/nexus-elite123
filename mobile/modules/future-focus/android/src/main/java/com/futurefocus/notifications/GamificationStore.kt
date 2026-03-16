package com.futurefocus.notifications

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class GamificationStore(context: Context) {
  private val prefs: SharedPreferences = context.getSharedPreferences("future_focus_game", Context.MODE_PRIVATE)

  private fun dayKey(ts: Long): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    fmt.timeZone = TimeZone.getDefault()
    return fmt.format(Date(ts))
  }

  fun recordFocusSession(durationMinutes: Int, blockedCount: Int) {
    val total = prefs.getInt("focusSessionsTotal", 0) + 1
    val xp = prefs.getInt("xp", 0) + 50

    val today = dayKey(System.currentTimeMillis())
    val yesterday = dayKey(System.currentTimeMillis() - 24L * 60L * 60L * 1000L)

    val lastDay = prefs.getString("lastFocusDay", null)
    val streak = when {
      lastDay == null -> 1
      lastDay == today -> prefs.getInt("focusStreakDays", 1)
      lastDay == yesterday -> prefs.getInt("focusStreakDays", 0) + 1
      else -> 1
    }

    val best = maxOf(prefs.getInt("bestFocusMinutes", 0), durationMinutes)

    val editor = prefs.edit()
    editor.putInt("focusSessionsTotal", total)
    editor.putInt("xp", xp)
    editor.putString("lastFocusDay", today)
    editor.putInt("focusStreakDays", streak)
    editor.putInt("bestFocusMinutes", best)

    // Trophies
    if (total >= 10) editor.putBoolean("trophy_focus_champion", true)
    if (blockedCount == 0) editor.putBoolean("trophy_no_distractions", true)
    if (streak >= 15) editor.putBoolean("trophy_focus_streak_15", true)

    editor.apply()
  }

  fun getState(): GameState {
    return GameState(
      xp = prefs.getInt("xp", 0),
      focusSessionsTotal = prefs.getInt("focusSessionsTotal", 0),
      focusStreakDays = prefs.getInt("focusStreakDays", 0),
      bestFocusMinutes = prefs.getInt("bestFocusMinutes", 0),
      trophies = mapOf(
        "focus_champion" to prefs.getBoolean("trophy_focus_champion", false),
        "no_distractions" to prefs.getBoolean("trophy_no_distractions", false),
        "focus_streak_15" to prefs.getBoolean("trophy_focus_streak_15", false),
      )
    )
  }

  data class GameState(
    val xp: Int,
    val focusSessionsTotal: Int,
    val focusStreakDays: Int,
    val bestFocusMinutes: Int,
    val trophies: Map<String, Boolean>,
  ) {
    fun toWritableMap(): WritableMap {
      val m = Arguments.createMap()
      m.putInt("xp", xp)
      m.putInt("focusSessionsTotal", focusSessionsTotal)
      m.putInt("focusStreakDays", focusStreakDays)
      m.putInt("bestFocusMinutes", bestFocusMinutes)

      val t = Arguments.createMap()
      for ((k, v) in trophies) t.putBoolean(k, v)
      m.putMap("trophies", t)
      return m
    }
  }
}
