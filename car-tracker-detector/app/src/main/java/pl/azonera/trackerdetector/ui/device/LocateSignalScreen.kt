package pl.azonera.trackerdetector.ui.device

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.compose.viewModelFactory
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.core.rssi.SignalTrend
import pl.azonera.trackerdetector.ui.theme.RiskHigh
import pl.azonera.trackerdetector.ui.theme.RiskLow
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun LocateSignalScreen(sessionId: String, address: String) {
    val container = rememberAppContainer()
    val viewModel: LocateSignalViewModel = viewModel(
        factory = viewModelFactory {
            initializer { LocateSignalViewModel(container.bleRepository, address) }
        }
    )
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.start() }

    Scaffold { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(stringResource(R.string.locate_title), style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
            Spacer(Modifier.height(24.dp))

            Text(stringResource(R.string.locate_signal_label), color = TextSecondary)
            Text(
                text = state.currentRssi?.let { "$it dBm" } ?: "—",
                fontSize = 56.sp,
                fontWeight = FontWeight.Bold,
                color = if (state.signalLost) RiskHigh else RiskLow
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = state.distance?.displayNamePl?.replaceFirstChar { it.uppercase() } ?: "",
                color = TextSecondary
            )

            Spacer(Modifier.height(24.dp))
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Text(
                    text = trendMessage(state.signalLost, state.trend),
                    modifier = Modifier.padding(16.dp),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.locate_disclaimer),
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun trendMessage(signalLost: Boolean, trend: SignalTrend): String {
    if (signalLost) return stringResource(R.string.locate_device_lost)
    return when (trend) {
        SignalTrend.RISING -> stringResource(R.string.locate_trend_rising)
        SignalTrend.FALLING -> stringResource(R.string.locate_trend_falling)
        SignalTrend.STABLE -> stringResource(R.string.locate_trend_stable)
        SignalTrend.INSUFFICIENT_DATA -> stringResource(R.string.locate_trend_insufficient)
    }
}
