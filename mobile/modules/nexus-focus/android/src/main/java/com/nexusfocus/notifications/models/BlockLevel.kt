package com.nexusfocus.notifications.models

enum class BlockLevel(val js: String) {
  SILENT("silent"),
  VIBRATE("vibrate"),
  IMPORTANT("important"),
  FULL("full");

  companion object {
    fun fromJs(value: String): BlockLevel {
      return when (value.lowercase()) {
        "silent" -> SILENT
        "vibrate" -> VIBRATE
        "important" -> IMPORTANT
        "full" -> FULL
        else -> SILENT
      }
    }
  }
}
