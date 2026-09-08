package pl.azonera.trackerdetector.ui.navigation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import pl.azonera.trackerdetector.ui.carmap.CarMapScreen
import pl.azonera.trackerdetector.ui.device.DeviceDetailScreen
import pl.azonera.trackerdetector.ui.device.LocateSignalScreen
import pl.azonera.trackerdetector.ui.history.HistoryScreen
import pl.azonera.trackerdetector.ui.home.HomeScreen
import pl.azonera.trackerdetector.ui.results.ResultsScreen
import pl.azonera.trackerdetector.ui.scanning.ScanningScreen
import pl.azonera.trackerdetector.ui.settings.PrivacyScreen
import pl.azonera.trackerdetector.ui.technical.TechnicalScreen

@Composable
fun CarTrackerNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Destinations.HOME) {

        composable(Destinations.HOME) {
            HomeScreen(
                onStartScan = { mode -> navController.navigate(Destinations.scanning(mode)) },
                onOpenHistory = { navController.navigate(Destinations.HISTORY) },
                onOpenPrivacy = { navController.navigate(Destinations.PRIVACY) },
                onOpenCarMap = { navController.navigate(Destinations.CAR_MAP) }
            )
        }

        composable(
            route = Destinations.SCANNING,
            arguments = listOf(navArgument("mode") { type = NavType.StringType })
        ) { entry ->
            val mode = ScanMode.valueOf(entry.arguments?.getString("mode") ?: ScanMode.FULL.name)
            ScanningScreen(
                mode = mode,
                onFinished = { sessionId ->
                    navController.navigate(Destinations.results(sessionId)) {
                        popUpTo(Destinations.HOME)
                    }
                },
                onCancel = { navController.popBackStack() }
            )
        }

        composable(
            route = Destinations.RESULTS,
            arguments = listOf(navArgument("sessionId") { type = NavType.StringType })
        ) { entry ->
            val sessionId = entry.arguments?.getString("sessionId").orEmpty()
            ResultsScreen(
                sessionId = sessionId,
                onScanAgain = {
                    navController.navigate(Destinations.HOME) { popUpTo(Destinations.HOME) { inclusive = true } }
                },
                onOpenTechnicalMode = { id -> navController.navigate(Destinations.technical(id)) },
                onDeviceClick = { address -> navController.navigate(Destinations.deviceDetail(sessionId, address)) }
            )
        }

        composable(
            route = Destinations.TECHNICAL,
            arguments = listOf(navArgument("sessionId") { type = NavType.StringType })
        ) { entry ->
            TechnicalScreen(sessionId = entry.arguments?.getString("sessionId").orEmpty())
        }

        composable(
            route = Destinations.DEVICE_DETAIL,
            arguments = listOf(
                navArgument("sessionId") { type = NavType.StringType },
                navArgument("address") { type = NavType.StringType }
            )
        ) { entry ->
            val sessionId = entry.arguments?.getString("sessionId").orEmpty()
            val address = Uri.decode(entry.arguments?.getString("address").orEmpty())
            DeviceDetailScreen(
                sessionId = sessionId,
                address = address,
                onLocate = { navController.navigate(Destinations.locateSignal(sessionId, address)) }
            )
        }

        composable(
            route = Destinations.LOCATE_SIGNAL,
            arguments = listOf(
                navArgument("sessionId") { type = NavType.StringType },
                navArgument("address") { type = NavType.StringType }
            )
        ) { entry ->
            LocateSignalScreen(
                sessionId = entry.arguments?.getString("sessionId").orEmpty(),
                address = Uri.decode(entry.arguments?.getString("address").orEmpty())
            )
        }

        composable(Destinations.CAR_MAP) { CarMapScreen() }

        composable(Destinations.HISTORY) {
            HistoryScreen(onOpenSession = { sessionId -> navController.navigate(Destinations.results(sessionId)) })
        }

        composable(Destinations.PRIVACY) { PrivacyScreen() }
    }
}
