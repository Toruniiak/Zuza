package pl.azonera.trackerdetector.data.database

import androidx.room.TypeConverter

/**
 * Ręczne, proste konwertery zamiast dodatkowej zależności JSON — modele przechowywane w bazie
 * są niewielkie i mają prostą strukturę (listy/mapy liczb i krótkich stringów).
 */
class Converters {

    @TypeConverter
    fun fromIntList(value: List<Int>): String = value.joinToString(",")

    @TypeConverter
    fun toIntList(value: String): List<Int> =
        if (value.isEmpty()) emptyList() else value.split(",").map { it.toInt() }

    @TypeConverter
    fun fromIntSet(value: Set<Int>): String = value.joinToString(",")

    @TypeConverter
    fun toIntSet(value: String): Set<Int> =
        if (value.isEmpty()) emptySet() else value.split(",").map { it.toInt() }.toSet()

    @TypeConverter
    fun fromStringSet(value: Set<String>): String = value.joinToString("|")

    @TypeConverter
    fun toStringSet(value: String): Set<String> =
        if (value.isEmpty()) emptySet() else value.split("|").toSet()

    /** Format: "companyId:hexByte,hexByte;companyId2:hexByte" */
    @TypeConverter
    fun fromManufacturerDataMap(value: Map<Int, List<Byte>>): String =
        value.entries.joinToString(";") { (companyId, bytes) ->
            "$companyId:" + bytes.joinToString(",") { (it.toInt() and 0xFF).toString(16).padStart(2, '0') }
        }

    @TypeConverter
    fun toManufacturerDataMap(value: String): Map<Int, List<Byte>> {
        if (value.isEmpty()) return emptyMap()
        return value.split(";").associate { entry ->
            val (companyIdStr, bytesStr) = entry.split(":", limit = 2)
            val bytes = if (bytesStr.isEmpty()) {
                emptyList()
            } else {
                bytesStr.split(",").map { it.toInt(16).toByte() }
            }
            companyIdStr.toInt() to bytes
        }
    }
}
