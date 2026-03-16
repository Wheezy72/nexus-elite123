package com.futurefocus.notifications

import android.app.Notification
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest

class FutureNotificationListenerService : NotificationListenerService() {
  private lateinit var db: FocusDb
  private var lastVibrateAt: Long = 0L

  override fun onCreate() {
    super.onCreate()
    db = FocusDb(this)
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val settings = FocusSettingsStore(this)
    if (!settings.getEnabled()) return

    val packageName = sbn.packageName ?: return

    val appLabel = try {
      val appInfo = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(appInfo).toString()
    } catch (_: PackageManager.NameNotFoundException) {
      packageName
    }

    val category = CategoryRules.categorize(packageName)

    val active = FocusController.isActive(this)
    val sessionId = if (active) FocusController.getActiveSessionId(this) else null

    val isBlocked = if (active) shouldBlock(sbn, packageName, category) else false

    // Privacy: hash title/text so the DB never stores message content.
    val titleHash = hashExtra(sbn.notification, Notification.EXTRA_TITLE)
    val textHash = hashExtra(sbn.notification, Notification.EXTRA_TEXT)

    db.logDistraction(
      ts = System.currentTimeMillis(),
      packageName = packageName,
      appLabel = appLabel,
      category = category,
      blocked = isBlocked,
      sessionId = sessionId,
      titleHash = titleHash,
      textHash = textHash,
    )

    if (isBlocked) {
      FocusController.incrementBlocked(this)
      maybeVibrate()
      try {
        cancelNotification(sbn.key)
      } catch (_: Throwable) {
        // Best effort
      }
    }
  }

  private fun shouldBlock(sbn: StatusBarNotification, packageName: String, category: String): Boolean {
    val whitelist = FocusController.getWhitelist(this)
    if (whitelist.contains(packageName)) return false

    val level = FocusController.getBlockLevel(this)

    // Allow "important" notifications (best effort). Android doesn't expose emergency calls reliably.
    if (level == com.futurefocus.notifications.models.BlockLevel.IMPORTANT) {
      val notifCategory = sbn.notification.category
      if (notifCategory == Notification.CATEGORY_CALL || notifCategory == Notification.CATEGORY_ALARM) {
        return false
      }
    }

    val blockedCategories = FocusController.getBlockCategories(this)

    // Full/Silent/Vibrate: treat as global block except whitelist.
    if (
      level == com.futurefocus.notifications.models.BlockLevel.FULL ||
      level == com.futurefocus.notifications.models.BlockLevel.SILENT ||
      level == com.futurefocus.notifications.models.BlockLevel.VIBRATE
    ) {
      return true
    }

    // Important mode: block only selected categories.
    return blockedCategories.contains(category)
  }

  private fun maybeVibrate() {
    val level = FocusController.getBlockLevel(this)
    if (level != com.futurefocus.notifications.models.BlockLevel.VIBRATE) return= com.futurefocus.notifications.models.BlockLevel.VIBRATE)return

    // Avoid vibrating repeatedly if a burst of notifications comes in.
    val now = SystemClock.elapsedRealtime()
    if (now - lastVibrateAt < 10_000) return
    lastVibrateAt = now

    val vibrator = getSystemService(Vibrator::class.java) ?: return
    if (!vibrator.hasVibrator()) return

    if (Build.VERSION.SDK_INT >= 26) {
      vibrator.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(40)
    }
  }

  private fun hashExtra(notification: Notification, key: String): String? {
    val extras = notification.extras ?: return null
    val value = extras.getCharSequence(key)?.toString()?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    return sha256(value)
  }

  private fun sha256(input: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
    val sb = StringBuilder(digest.size * 2)
    for (b in digest) sb.append(String.format("%02x", b))
    return sb.toString()
  }
}
