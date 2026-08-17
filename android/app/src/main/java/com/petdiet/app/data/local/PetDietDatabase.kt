package com.petdiet.app.data.local

import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.RoomDatabase

@Database(
    entities = [FoodRecordEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class PetDietDatabase : RoomDatabase() {
    abstract fun foodRecordDao(): FoodRecordDao
}

// 仅用于建立 Room v1 架构；字段将在实现食物记录功能时补充。
@Entity(tableName = "food_records")
data class FoodRecordEntity(
    @PrimaryKey val id: Long,
)
