package com.nexusfocus.notifications

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.nexusfocus.notifications.models.BlockLevel
import com.nexusfocus.notifications.models.FocusStatus

object FocusController {
  private const val PREFS = "nexus_focus_state"

  fun hasNotificationAccess(context: Context): Boolean {
    val cn = ComponentName(context, NexusNotificationListenerService::class.java)
    val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: return false
    return flat.contains(cn.flattenToString())
  }

  fun getStatus(context: Context): FocusStatus {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val active = prefs.getBoolean("active", false)
    if (!active) return FocusStatus(active = false)

    val sessionId = prefs.getString("sessionId", null)
    val startAt = prefs.getLong("startAt", 0L)
    val endAt = prefs.getLong("endAt", 0L)
    val blockLevel = BlockLevel.fromJs(prefs.getString("blockLevel", "silent") ?: "silent")
    val blockedCount = prefs.getInt("blockedCount", 0)

    return FocusStatus(
      active = true,
      sessionId = sessionId,
      startAt = startAt,
      endAt = endAt,
      blockLevel = blockLevel,
      blockedCount = blockedCount,
    )
  }

  fun startFocus(
    context: Context,
    db: FocusDb,
    settings: FocusSettingsStore,
    durationMinutes: Int,
    level: BlockLevel,
    whitelist: List<String>,
    blockCategories: List<String>,
  ): FocusStatus {
    val now = System.currentTimeMillis()
    val endAt = now + durationMinutes.toLong() * 60L * 1000L

    val sessionId = db.createFocusSession(now, endAt, level.js)

    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit()
      .putBoolean("active", true)
      .putString("sessionId", sessionId)
      .putLong("startAt", now)
      .putLong("endAt", endAt)
      .putString("blockLevel", level.js)
      .putInt("blockedCount", 0)
      .putStringSet("whitelist", (settings.getAlwaysAllowedPackages() + whitelist).toSet())
      .putStringSet("blockCategories", (if (blockCategories.isNotEmpty()) blockCategories else settings.getBlockedCategories()).toSet())
      .apply()

    setDnd(context, level)
    scheduleEndAlarm(context, sessionId, endAt)
    FocusForegroundService.start(context, endAt)

    return FocusStatus(active = true, sessionId = sessionId, startAt = now, endAt = endAt, blockLevel = level, blockedCount = 0)
  }

  fun stopFocus(context: Context, db: FocusDb, settings: FocusSettingsStore): FocusStatus {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val active = prefs.getBoolean("active", false)
    if (!active) return FocusStatus(active = false)

    val sessionId = prefs.getString("sessionId", null)
    if (sessionId != null) {
      db.markSessionCompleted(sessionId)
    }

    prefs.edit().putBoolean("active", false).apply()

    setDndOff(context)
    cancelEndAlarm(context)
    FocusForegroundService.stop(context)

    return FocusStatus(active = false)
  }

  fun incrementBlocked(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("active", false)) return
    val next = prefs.getInt("blockedCount", 0) + 1
    prefs.edit().putInt("blockedCount", next).apply()
  }

  fun getActiveSessionId(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("active", false)) return null
    return prefs.getString("sessionId", null)
  }

  fun getWhitelist(context: Context): Set<String> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return prefs.getStringSet("whitelist", emptySet()) ?: emptySet()
  }

  fun getBlockCategories(context: Context): Set<String> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return prefs.getStringSet("blockCategories", emptySet()) ?: emptySet()
  }

  fun getBlockLevel(context: Context): BlockLevel {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return BlockLevel.fromJs(prefs.getString("blockLevel", "silent") ?: "silent")
  }

  fun isActive(context: Context): Boolean {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("active", false)) return false

    val endAt = prefs.getLong("endAt", 0L)
    if (endAt <= 0L) return false

    if (System.currentTimeMillis() >= endAt) {
      prefs.edit().putBoolean("active", false).apply()
      return false
    }

    return true
  }

  private fun scheduleEndAlarm(context: Context, sessionId: String, endAt: Long) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)

    val intent = Intent(context, FocusEndReceiver::class.java)
    intent.putExtra("sessionId", sessionId)

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    val pi = PendingIntent.getBroadcast(context, 7_001, intent, flags)

    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAt, pi)
  }

  private fun cancelEndAlarm(context: Context) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val intent = Intent(context, FocusEndReceiver::class.java)

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    val pi = PendingIntent.getBroadcast(context, 7_001, intent, flags)
    alarmManager.cancel(pi)
  }

  private fun setDnd(context: Context, level: BlockLevel) {
    val nm = context.getSystemService(NotificationManager::class.java)
    if (!nm.isNotificationPolicyAccessGranted) return

    when (level) {
      BlockLevel.IMPORTANT -> nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
      BlockLevel.SILENT -> nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
      BlockLevel.VIBRATE -> nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
      BlockLevel.FULL -> nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
    }
  }

  private fun setDndOff(context: Context) {
    val nm = context.getSystemService(NotificationManager::class.java)
    if (!nm.isNotificationPolicyAccessGranted) return
    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
  }
}
