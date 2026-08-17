package com.petdiet.app.data.model

import kotlinx.serialization.Serializable

/**
 * 喂食结果（TDD §3.3 标准定义）。
 */
@Serializable
data class FeedingResult(
    val petState: PetState,
    val message: String,
    val animation: PetStatus,
)
