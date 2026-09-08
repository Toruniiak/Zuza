package pl.azonera.trackerdetector.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.ui.theme.RiskHigh
import pl.azonera.trackerdetector.ui.theme.RiskLow
import pl.azonera.trackerdetector.ui.theme.RiskSuspicious
import pl.azonera.trackerdetector.ui.theme.RiskUnknown

fun RiskLevel.color() = when (this) {
    RiskLevel.LOW -> RiskLow
    RiskLevel.UNKNOWN -> RiskUnknown
    RiskLevel.SUSPICIOUS -> RiskSuspicious
    RiskLevel.HIGH_RISK -> RiskHigh
}

@Composable
fun RiskBadge(level: RiskLevel, modifier: Modifier = Modifier) {
    Text(
        text = "${level.emoji} ${level.displayNamePl}",
        color = level.color(),
        style = MaterialTheme.typography.labelLarge,
        modifier = modifier
            .background(level.color().copy(alpha = 0.15f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}
