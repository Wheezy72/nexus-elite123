package com.futurefocus.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class FocusEndReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val sessionId = intent.getStringExtra("sessionId")

    val db = FocusDb(context)
    val settings = FocusSettingsStore(context)

    if (sessionId != null) {
      db.markSessionCompleted(sessionId)
    }

    // Always end focus mode and DND at alarm time.
    FocusController.stopFocus(context, db, settings)

    val blocked = if (sessionId != null) db.countBlockedForSession(sessionId) else 0
    val duration = if (sessionId != null) db.getSessionDurationMinutes(sessionId) else 0

    // Gamification: +50 XP + streak updates
    GamificationStore(context).recordFocusSession(durationMinutes = duration, blockedCount = blocked)

    notifySummary(context, blocked)
  }

  private fun notifySummary(context: Context, blocked: Int) {
    val nm = context.getSystemService(NotificationManager::class.java)
    val channelId = "future_focus"

    if (Build.VERSION.SDK_INT >= 26) {
      val channel = NotificationChannel(channelId, "Future Focus", NotificationManager.IMPORTANCE_DEFAULT)
      nm.createNotificationChannel(channel)
    }

    val n = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("Focus complete")
      .setContentText("Blocked $blocked distractions")
      .setAutoCancel(true)
      .build()

    nm.notify(7_010, n)
  }
}
