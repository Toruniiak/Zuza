package pl.azonera.trackerdetector.ui.scanning

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.drawscope.rotate
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.ui.theme.AccentCyan
import pl.azonera.trackerdetector.ui.theme.RadarGreen
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * Prosta, minimalistyczna animacja radaru (punkt 15 specyfikacji).
 *
 * WAŻNE uproszczenie: pozycja "blipu" na tarczy NIE odzwierciedla rzeczywistego kierunku
 * urządzenia (telefon nie zna kierunku BLE) — kąt jest tylko stabilnym, wizualnym rozłożeniem
 * wyliczonym z adresu urządzenia, a promień od środka odpowiada sile sygnału (im bliżej środka,
 * tym silniejszy sygnał). To celowe, żeby nie sugerować fałszywej precyzji.
 */
@Composable
fun RadarView(devices: List<DetectedDevice>, modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "radar")
    val sweepAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sweepAngle"
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
    ) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val radius = min(size.width, size.height) / 2f * 0.92f

        repeat(3) { ring ->
            val ringRadius = radius * (ring + 1) / 3f
            drawCircle(
                color = RadarGreen.copy(alpha = 0.25f),
                radius = ringRadius,
                center = center,
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5f)
            )
        }

        rotate(degrees = sweepAngle, pivot = center) {
            drawArc(
                brush = Brush.sweepGradient(
                    0f to RadarGreen.copy(alpha = 0f),
                    0.85f to RadarGreen.copy(alpha = 0f),
                    1f to RadarGreen.copy(alpha = 0.35f),
                    center = center
                ),
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = true,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
            )
        }

        devices.forEach { device ->
            val angle = ((device.address.hashCode() % 360) + 360) % 360
            val angleRad = Math.toRadians(angle.toDouble())
            // RSSI zwykle w zakresie ok. -100..-30 dBm; mapujemy na promień 0.15..0.95 tarczy.
            val normalized = ((device.lastRssi + 100).coerceIn(0, 70)) / 70f
            val distanceFactor = 0.95f - (normalized * 0.8f)
            val blipRadius = radius * distanceFactor
            val x = center.x + (cos(angleRad) * blipRadius).toFloat()
            val y = center.y + (sin(angleRad) * blipRadius).toFloat()
            drawCircle(color = AccentCyan, radius = 6f, center = Offset(x, y))
        }

        drawCircle(color = RadarGreen, radius = 4f, center = center)
    }
}
