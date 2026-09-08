# Room generates code reflectively-accessed at runtime for a few edge cases;
# the AndroidX Room Gradle/KSP integration ships consumer rules automatically,
# so no manual Room rules are required here.

# Keep Compose runtime classes referenced only via reflection during tooling.
-dontwarn org.jetbrains.annotations.**
