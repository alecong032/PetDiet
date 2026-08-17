package com.petdiet.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val PetDietColorScheme = lightColorScheme(
    primary = PetGreen,
    onPrimary = PetCream,
    secondary = PetGreenLight,
    background = PetCream,
    surface = PetCream,
)

@Composable
fun PetDietTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PetDietColorScheme,
        typography = PetDietTypography,
        content = content,
    )
}

