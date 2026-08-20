package com.petdiet.app.data.model

import kotlinx.serialization.Serializable

/**
 * 宠物状态（TDD §3.3 标准定义）。hunger/health/mood 取值 0-100。
 */
@Serializable
data class PetState(
    val id: String,
    val name: String,
    val hunger: Double,
    val health: Double,
    val mood: Double,
    val lastFedAt: Long? = null,
    val status: PetStatus,
)

@Serializable
enum class PetStatus { NORMAL, HAPPY, HUNGRY, EATING, OVERFULL, SICK }
