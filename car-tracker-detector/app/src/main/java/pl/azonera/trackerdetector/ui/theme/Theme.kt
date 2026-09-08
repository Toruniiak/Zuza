package pl.azonera.trackerdetector.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

// Aplikacja jest zaprojektowana jako ciemna/techniczna z założenia (czytelność w samochodzie,
// w nocy) - nie oferujemy jasnego motywu w MVP, niezależnie od ustawień systemu.
private val DarkColors = darkColorScheme(
    primary = RadarGreen,
    secondary = AccentCyan,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onPrimary = BackgroundDark,
    onSecondary = BackgroundDark,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = RiskHigh
)

@Composable
fun CarTrackerDetectorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        typography = AppTypography,
        content = content
    )
}
