package com.petdiet.app.data.model

import kotlinx.serialization.Serializable

/**
 * AI 食物识别结果（TDD §3.3 标准定义）。
 */
@Serializable
data class FoodRecognitionResult(
    val candidates: List<FoodCandidate>,
    val bestMatch: FoodCandidate? = null,
)
