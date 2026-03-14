package com.nexusfocus.notifications

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.nexusfocus.notifications.models.AnalyticsSummary
import com.nexusfocus.notifications.models.DistractionItem
import com.nexusfocus.notifications.models.SessionSummary
import java.util.UUID

class FocusDb(context: Context) {
  private val helper = DbHelper(context)

  fun logDistraction(
    ts: Long,
    packageName: String,
    appLabel: String,
    category: String,
    blocked: Boolean,
    sessionId: String?,
    titleHash: String?,
    textHash: String?,
  ): String {
    val db = helper.writableDatabase
    val id = UUID.randomUUID().toString()

    val values = ContentValues()
    values.put("id", id)
    values.put("ts", ts)
    values.put("package_name", packageName)
    values.put("app_label", appLabel)
    values.put("category", category)
    values.put("blocked", if (blocked) 1 else 0)
    values.put("session_id", sessionId)
    values.put("title_hash", titleHash)
    values.put("text_hash", textHash)

    db.insert("distractions", null, values)
    return id
  }

  fun getRecentDistractions(limit: Int): List<DistractionItem> {
    val db = helper.readableDatabase
    val out = ArrayList<DistractionItem>()

    val c = db.rawQuery(
      "SELECT id, ts, app_label, package_name, category, blocked, session_id FROM distractions ORDER BY ts DESC LIMIT ?",
      arrayOf(limit.toString())
    )

    c.use {
      while (it.moveToNext()) {
        out.add(
          DistractionItem(
            id = it.getString(0),
            ts = it.getLong(1),
            app = it.getString(2),
            packageName = it.getString(3),
            category = it.getString(4),
            blocked = it.getInt(5) == 1,
            sessionId = it.getString(6),
          )
        )
      }
    }

    return out
  }

  fun countBlockedForSession(sessionId: String): Int {
    val db = helper.readableDatabase
    val c = db.rawQuery(
      "SELECT COUNT(*) FROM distractions WHERE blocked = 1 AND session_id = ?",
      arrayOf(sessionId)
    )
    c.use {
      return if (it.moveToFirst()) it.getInt(0) else 0
    }
  }

  fun getAnalytics(days: Int): AnalyticsSummary {
    val sinceTs = System.currentTimeMillis() - days.toLong() * 24L * 60L * 60L * 1000L
    val db = helper.readableDatabase

    val total = db.rawQuery(
      "SELECT COUNT(*) FROM distractions WHERE ts >= ?",
      arrayOf(sinceTs.toString())
    ).use { if (it.moveToFirst()) it.getInt(0) else 0 }

    val byApp = db.rawQuery(
      "SELECT app_label, COUNT(*) as c FROM distractions WHERE ts >= ? GROUP BY app_label ORDER BY c DESC",
      arrayOf(sinceTs.toString())
    ).use { cur ->
      val list = ArrayList<Pair<String, Int>>()
      while (cur.moveToNext()) list.add(cur.getString(0) to cur.getInt(1))
      list
    }

    val byCategory = db.rawQuery(
      "SELECT category, COUNT(*) as c FROM distractions WHERE ts >= ? GROUP BY category ORDER BY c DESC",
      arrayOf(sinceTs.toString())
    ).use { cur ->
      val list = ArrayList<Pair<String, Int>>()
      while (cur.moveToNext()) list.add(cur.getString(0) to cur.getInt(1))
      list
    }

    val byHour = db.rawQuery(
      "SELECT CAST(strftime('%H', ts/1000, 'unixepoch', 'localtime') AS INTEGER) as h, COUNT(*) as c " +
        "FROM distractions WHERE ts >= ? GROUP BY h ORDER BY c DESC",
      arrayOf(sinceTs.toString())
    ).use { cur ->
      val list = ArrayList<Pair<Int, Int>>()
      while (cur.moveToNext()) list.add(cur.getInt(0) to cur.getInt(1))
      list
    }

    return AnalyticsSummary(days = days, total = total, byApp = byApp, byCategory = byCategory, byHour = byHour)
  }

  fun getLastCompletedSessionSummary(): SessionSummary? {
    val db = helper.readableDatabase

    val meta = db.rawQuery(
      "SELECT id, start_at, end_at FROM focus_sessions WHERE completed = 1 ORDER BY end_at DESC LIMIT 1",
      emptyArray()
    ).use { cur ->
      if (!cur.moveToFirst()) return null
      Triple(cur.getString(0), cur.getLong(1), cur.getLong(2))
    }

    val sessionId = meta.first
    val startAt = meta.second
    val endAt = meta.third

    val blocked = countBlockedForSession(sessionId)

    val byApp = db.rawQuery(
      "SELECT app_label, COUNT(*) as c FROM distractions WHERE session_id = ? AND blocked = 1 GROUP BY app_label ORDER BY c DESC",
      arrayOf(sessionId)
    ).use { cur ->
      val list = ArrayList<Pair<String, Int>>()
      while (cur.moveToNext()) list.add(cur.getString(0) to cur.getInt(1))
      list
    }

    val byCategory = db.rawQuery(
      "SELECT category, COUNT(*) as c FROM distractions WHERE session_id = ? AND blocked = 1 GROUP BY category ORDER BY c DESC",
      arrayOf(sessionId)
    ).use { cur ->
      val list = ArrayList<Pair<String, Int>>()
      while (cur.moveToNext()) list.add(cur.getString(0) to cur.getInt(1))
      list
    }

    val peakTime = db.rawQuery(
      "SELECT strftime('%H:%M', ts/1000, 'unixepoch', 'localtime') as t, COUNT(*) as c " +
        "FROM distractions WHERE session_id = ? AND blocked = 1 GROUP BY t ORDER BY c DESC LIMIT 1",
      arrayOf(sessionId)
    ).use { cur ->
      if (cur.moveToFirst()) cur.getString(0) else null
    }

    return SessionSummary(
      sessionId = sessionId,
      startAt = startAt,
      endAt = endAt,
      blocked = blocked,
      byApp = byApp,
      byCategory = byCategory,
      peakTime = peakTime,
    )
  }

  fun clearAll() {
    val db = helper.writableDatabase
    db.delete("distractions", null, null)
    db.delete("focus_sessions", null, null)
  }

  fun createFocusSession(startAt: Long, endAt: Long, blockLevel: String): String {
    val db = helper.writableDatabase
    val id = UUID.randomUUID().toString()

    val values = ContentValues()
    values.put("id", id)
    values.put("start_at", startAt)
    values.put("end_at", endAt)
    values.put("block_level", blockLevel)
    values.put("completed", 0)

    db.insert("focus_sessions", null, values)
    return id
  }

  fun markSessionCompleted(sessionId: String) {
    val db = helper.writableDatabase
    val values = ContentValues()
    values.put("completed", 1)
    db.update("focus_sessions", values, "id = ?", arrayOf(sessionId))
  }

  fun getSessionDurationMinutes(sessionId: String): Int {
    val db = helper.readableDatabase
    val c = db.rawQuery(
      "SELECT start_at, end_at FROM focus_sessions WHERE id = ?",
      arrayOf(sessionId)
    )

    c.use {
      if (!it.moveToFirst()) return 0
      val startAt = it.getLong(0)
      val endAt = it.getLong(1)
      val ms = endAt - startAt
      if (ms <= 0L) return 0
      return (ms / 60_000L).toInt()
    }
  }

  private class DbHelper(context: Context) : SQLiteOpenHelper(context, "nexus_focus.db", null, 2) {
    override fun onCreate(db: SQLiteDatabase) {
      db.execSQL(
        "CREATE TABLE distractions (" +
          "id TEXT PRIMARY KEY," +
          "ts INTEGER NOT NULL," +
          "package_name TEXT NOT NULL," +
          "app_label TEXT NOT NULL," +
          "category TEXT NOT NULL," +
          "blocked INTEGER NOT NULL," +
          "session_id TEXT," +
          "title_hash TEXT," +
          "text_hash TEXT" +
          ")"
      )

      db.execSQL(
        "CREATE TABLE focus_sessions (" +
          "id TEXT PRIMARY KEY," +
          "start_at INTEGER NOT NULL," +
          "end_at INTEGER NOT NULL," +
          "block_level TEXT NOT NULL," +
          "completed INTEGER NOT NULL" +
          ")"
      )

      db.execSQL("CREATE INDEX idx_distractions_ts ON distractions(ts)")
      db.execSQL("CREATE INDEX idx_distractions_session ON distractions(session_id)")
      db.execSQL("CREATE INDEX idx_sessions_end ON focus_sessions(end_at)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
      db.execSQL("DROP TABLE IF EXISTS distractions")
      db.execSQL("DROP TABLE IF EXISTS focus_sessions")
      onCreate(db)
    }
  }
}
