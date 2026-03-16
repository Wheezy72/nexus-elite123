package com.futurefocus.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.futurefocus.notifications.models.BlockLevel

class FocusScheduleReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val settings = FocusSettingsStore(context)

    if (!settings.getEnabled() || !settings.getScheduleEnabled()) {
      FocusScheduleManager.cancel(context)
      return
    }

    if (FocusController.isActive(context)) {
      // Already focusing; just schedule next.
      FocusScheduleManager.scheduleNext(context, settings)
      return
    }

    val db = FocusDb(context)

    FocusController.startFocus(
      context = context,
      db = db,
      settings = settings,
      durationMinutes = settings.getDefaultDurationMinutes(),
      level = BlockLevel.SILENT,
      whitelist = emptyList(),
      blockCategories = emptyList(),
    )

    FocusScheduleManager.scheduleNext(context, settings)
  }
}
