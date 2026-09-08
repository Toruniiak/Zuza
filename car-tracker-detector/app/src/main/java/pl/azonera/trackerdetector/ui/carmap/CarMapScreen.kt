package pl.azonera.trackerdetector.ui.carmap

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pl.azonera.trackerdetector.R

private data class CarMapPoint(val labelRes: Int)

private val carMapPoints = listOf(
    CarMapPoint(R.string.car_map_dashboard),
    CarMapPoint(R.string.car_map_under_seats),
    CarMapPoint(R.string.car_map_glovebox),
    CarMapPoint(R.string.car_map_trunk),
    CarMapPoint(R.string.car_map_wheel_arches),
    CarMapPoint(R.string.car_map_battery),
    CarMapPoint(R.string.car_map_fuse_box),
    CarMapPoint(R.string.car_map_undercarriage)
)

@Composable
fun CarMapScreen() {
    val checked = remember { mutableStateMapOf<Int, Boolean>() }

    Scaffold { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
        ) {
            Text(stringResource(R.string.car_map_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(R.string.car_map_disclaimer),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(Modifier.height(16.dp))

            LazyColumn {
                items(carMapPoints) { point ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val isChecked = checked[point.labelRes] ?: false
                            Checkbox(
                                checked = isChecked,
                                onCheckedChange = { checked[point.labelRes] = it }
                            )
                            Text(stringResource(point.labelRes), style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
            }
        }
    }
}
