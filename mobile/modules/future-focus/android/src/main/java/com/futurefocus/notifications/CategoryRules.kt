package com.futurefocus.notifications

object CategoryRules {
  // Default categorization by Android package name.
  // Users can refine this later; keep defaults conservative.
  private val packageToCategory = mapOf(
    // Work / school
    "com.Slack".lowercase() to "work",
    "com.slack" to "work",
    "com.microsoft.teams" to "work",
    "com.google.android.gm" to "work",
    "com.google.android.apps.meetings" to "work",
    "com.google.android.calendar" to "work",

    // Social / comms
    "com.whatsapp" to "social",
    "com.facebook.orca" to "social",
    "com.instagram.android" to "social",
    "com.twitter.android" to "social",
    "com.snapchat.android" to "social",
    "org.telegram.messenger" to "social",

    // Finance
    "com.safaricom.mpesa" to "finance",
    "ke.co.safaricom.mpesa" to "finance",

    // Entertainment
    "com.google.android.youtube" to "entertainment",
    "com.netflix.mediaclient" to "entertainment",
    "com.spotify.music" to "entertainment",
    "com.reddit.frontpage" to "entertainment",
  )

  fun categorize(packageName: String): String {
    val key = packageName.lowercase()
    return packageToCategory[key] ?: "other"
  }
}
