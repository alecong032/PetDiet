package com.petdiet.app.data.model

import kotlinx.serialization.Serializable

/**
 * AI 食物识别候选（TDD §3.3 标准定义）。
 */
@Serializable
data class FoodCandidate(
    val id: String,
    val name: String,
    val confidence: Double,
    val caloriesPer100g: Double,
    val proteinPer100g: Double? = null,
    val carbsPer100g: Double? = null,
    val fatPer100g: Double? = null,
)
