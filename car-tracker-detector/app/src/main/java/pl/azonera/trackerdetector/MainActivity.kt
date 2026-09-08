package pl.azonera.trackerdetector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import pl.azonera.trackerdetector.ui.navigation.CarTrackerNavHost
import pl.azonera.trackerdetector.ui.theme.CarTrackerDetectorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { CarTrackerDetectorAppRoot() }
    }
}

@Composable
private fun CarTrackerDetectorAppRoot() {
    CarTrackerDetectorTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            CarTrackerNavHost()
        }
    }
}
