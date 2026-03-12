package com.nexusfocus

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.app.NotificationManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.nexusfocus.notifications.FocusController
import com.nexusfocus.notifications.FocusDb
import com.nexusfocus.notifications.FocusSettingsStore
import com.nexusfocus.notifications.FocusScheduleManager
import com.nexusfocus.notifications.GamificationStore
import com.nexusfocus.notifications.models.BlockLevel

class NexusFocusModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val db = FocusDb(reactContext)
  private val settings = FocusSettingsStore(reactContext)

  override fun getName(): String = "NexusFocus"

  private fun emit(event: String, params: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, params)
  }

  @ReactMethod
  fun hasNotificationAccess(promise: Promise) {
    promise.resolve(FocusController.hasNotificationAccess(reactContext))
  }

  @ReactMethod
  fun openNotificationAccessSettings(promise: Promise) {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactContext.startActivity(intent)
    promise.resolve(null)
  }

  @ReactMethod
  fun hasDndAccess(promise: Promise) {
    val nm = reactContext.getSystemService(NotificationManager::class.java)
    promise.resolve(nm.isNotificationPolicyAccessGranted)
  }

  @ReactMethod
  fun openDndAccessSettings(promise: Promise) {
    val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactContext.startActivity(intent)
    promise.resolve(null)
  }

  @ReactMethod
  fun getFocusStatus(promise: Promise) {
    val s = FocusController.getStatus(reactContext)
    promise.resolve(s.toWritableMap())
  }

  @ReactMethod
  fun startFocusSession(args: ReadableMap, promise: Promise) {
    val durationMinutes = args.getInt("durationMinutes")
    val level = BlockLevel.fromJs(args.getString("blockLevel") ?: "silent")

    val whitelist = if (args.hasKey("whitelistPackages") && args.getArray("whitelistPackages") != null) {
      args.getArray("whitelistPackages")!!.toArrayList().map { it.toString() }
    } else {
      emptyList()
    }

    val blockCategories = if (args.hasKey("blockCategories") && args.getArray("blockCategories") != null) {
      args.getArray("blockCategories")!!.toArrayList().map { it.toString() }
    } else {
      emptyList()
    }

    if (!settings.getEnabled()) {
      settings.setEnabled(true)
    }

    val status = FocusController.startFocus(reactContext, db, settings, durationMinutes, level, whitelist, blockCategories)

    // Emit to JS (best effort - won't fire if app process is dead)
    val payload = Arguments.createMap()
    payload.putMap("status", status.toWritableMap())
    emit("FocusSessionStatus", payload)

    promise.resolve(status.toWritableMap())
  }

  @ReactMethod
  fun stopFocusSession(promise: Promise) {
    val status = FocusController.stopFocus(reactContext, db, settings)
    val payload = Arguments.createMap()
    payload.putMap("status", status.toWritableMap())
    emit("FocusSessionStatus", payload)
    promise.resolve(status.toWritableMap())
  }

  @ReactMethod
  fun getRecentDistractions(args: ReadableMap, promise: Promise) {
    val limit = args.getInt("limit")
    val list = db.getRecentDistractions(limit)
    val out = Arguments.createArray()

    for (item in list) {
      out.pushMap(item.toWritableMap())
    }

    promise.resolve(out)
  }

  @ReactMethod
  fun getDistractionAnalytics(args: ReadableMap, promise: Promise) {
    val days = args.getInt("days")
    val summary = db.getAnalytics(days)
    promise.resolve(summary.toWritableMap())
  }

  @ReactMethod
  fun getLastSessionSummary(promise: Promise) {
    val summary = db.getLastCompletedSessionSummary()
    promise.resolve(summary?.toWritableMap())
  }

  @ReactMethod
  fun getSettings(promise: Promise) {
    promise.resolve(settings.getAll().toWritableMap())
  }

  @ReactMethod
  fun updateSettings(patch: ReadableMap, promise: Promise) {
    if (patch.hasKey("enabled")) {
      settings.setEnabled(patch.getBoolean("enabled"))
    }
    if (patch.hasKey("defaultDurationMinutes")) {
      settings.setDefaultDurationMinutes(patch.getInt("defaultDurationMinutes"))
    }
    if (patch.hasKey("alwaysAllowedPackages") && patch.getArray("alwaysAllowedPackages") != null) {
      val list = patch.getArray("alwaysAllowedPackages")!!.toArrayList().map { it.toString() }
      settings.setAlwaysAllowedPackages(list)
    }
    if (patch.hasKey("blockedCategories") && patch.getArray("blockedCategories") != null) {
      val list = patch.getArray("blockedCategories")!!.toArrayList().map { it.toString() }
      settings.setBlockedCategories(list)
    }

    if (patch.hasKey("scheduleEnabled")) {
      settings.setScheduleEnabled(patch.getBoolean("scheduleEnabled"))
    }
    if (patch.hasKey("scheduleHour")) {
      settings.setScheduleHour(patch.getInt("scheduleHour"))
    }
    if (patch.hasKey("scheduleMinute")) {
      settings.setScheduleMinute(patch.getInt("scheduleMinute"))
    }
    if (patch.hasKey("scheduleDays") && patch.getArray("scheduleDays") != null) {
      val list = patch.getArray("scheduleDays")!!.toArrayList().map { (it as Number).toInt() }
      settings.setScheduleDays(list)
    }

    FocusScheduleManager.sync(reactContext, settings)

    promise.resolve(settings.getAll().toWritableMap())
  }

  @ReactMethod
  fun getGameState(promise: Promise) {
    promise.resolve(GamificationStore(reactContext).getState().toWritableMap())
  }

  @ReactMethod
  fun clearLocalData(promise: Promise) {
    db.clearAll()
    promise.resolve(null)
  }
}