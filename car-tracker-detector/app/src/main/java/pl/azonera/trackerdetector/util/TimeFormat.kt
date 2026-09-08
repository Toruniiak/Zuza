package pl.azonera.trackerdetector.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object TimeFormat {
    private val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    private val dateTimeFormatter = SimpleDateFormat("dd.MM.yyyy, HH:mm", Locale.getDefault())

    fun time(millis: Long): String = timeFormatter.format(Date(millis))
    fun dateTime(millis: Long): String = dateTimeFormatter.format(Date(millis))

    fun durationSeconds(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return "%d:%02d".format(m, s)
    }
}
