package com.nexusfocus.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class FocusForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val endAt = intent?.getLongExtra(EXTRA_END_AT, 0L) ?: 0L
    startForeground(NOTIF_ID, buildNotification(endAt))
    return START_NOT_STICKY
  }

  private fun buildNotification(endAt: Long): android.app.Notification {
    val nm = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= 26) {
      val channel = NotificationChannel(CHANNEL_ID, "Nexus Focus", NotificationManager.IMPORTANCE_LOW)
      nm.createNotificationChannel(channel)
    }

    val remainingMin = if (endAt > 0L) {
      val ms = endAt - System.currentTimeMillis()
      if (ms <= 0L) 0 else (ms / 60_000L).toInt()
    } else {
      0
    }

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("Focus mode active")
      .setContentText("${remainingMin} min remaining")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .build()
  }

  companion object {
    private const val CHANNEL_ID = "nexus_focus_ongoing"
    private const val NOTIF_ID = 7_005
    private const val EXTRA_END_AT = "endAt"

    fun start(context: Context, endAt: Long) {
      val intent = Intent(context, FocusForegroundService::class.java)
      intent.putExtra(EXTRA_END_AT, endAt)

      if (Build.VERSION.SDK_INT >= 26) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, FocusForegroundService::class.java))
    }
  }
}
