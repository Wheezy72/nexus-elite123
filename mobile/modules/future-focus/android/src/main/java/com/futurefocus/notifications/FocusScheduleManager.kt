package com.futurefocus.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object FocusScheduleManager {
  private const val REQUEST_CODE = 7_200

  fun sync(context: Context, settings: FocusSettingsStore) {
    if (settings.getScheduleEnabled()) {
      scheduleNext(context, settings)
    } else {
      cancel(context)
    }
  }

  fun cancel(context: Context) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val pi = pendingIntent(context)
    alarmManager.cancel(pi)
  }

  fun scheduleNext(context: Context, settings: FocusSettingsStore) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)

    val next = computeNextTrigger(settings)
    val pi = pendingIntent(context)

    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.timeInMillis, pi)
  }

  private fun pendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, FocusScheduleReceiver::class.java)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
  }

  private fun computeNextTrigger(settings: FocusSettingsStore): Calendar {
    val now = Calendar.getInstance()
    val days = settings.getScheduleDays().toSet()

    for (i in 0..7) {
      val candidate = Calendar.getInstance()
      candidate.timeInMillis = now.timeInMillis
      candidate.add(Calendar.DAY_OF_YEAR, i)

      val dow = candidate.get(Calendar.DAY_OF_WEEK)
      if (!days.contains(dow)) continue

      candidate.set(Calendar.HOUR_OF_DAY, settings.getScheduleHour())
      candidate.set(Calendar.MINUTE, settings.getScheduleMinute())
      candidate.set(Calendar.SECOND, 0)
      candidate.set(Calendar.MILLISECOND, 0)

      if (candidate.timeInMillis > now.timeInMillis + 10_000) {
        return candidate
      }
    }

    // Fallback: tomorrow at the configured time.
    val fallback = Calendar.getInstance()
    fallback.add(Calendar.DAY_OF_YEAR, 1)
    fallback.set(Calendar.HOUR_OF_DAY, settings.getScheduleHour())
    fallback.set(Calendar.MINUTE, settings.getScheduleMinute())
    fallback.set(Calendar.SECOND, 0)
    fallback.set(Calendar.MILLISECOND, 0)
    return fallback
  }
}
