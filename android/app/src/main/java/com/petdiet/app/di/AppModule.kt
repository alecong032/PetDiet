package com.petdiet.app.di

import android.content.Context
import androidx.room.Room
import com.petdiet.app.data.local.FoodRecordDao
import com.petdiet.app.data.local.PetDietDatabase
import com.petdiet.app.data.network.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import javax.inject.Singleton

// TODO(T3.x)：替换为 CloudBase 云函数的 HTTP 触发地址。
const val API_BASE_URL = "https://example.com/"

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val json = Json { ignoreUnknownKeys = true }
        return Retrofit.Builder()
            .baseUrl(API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): PetDietDatabase =
        Room.databaseBuilder(
            context,
            PetDietDatabase::class.java,
            "petdiet.db",
        ).build()

    @Provides
    fun provideFoodRecordDao(database: PetDietDatabase): FoodRecordDao =
        database.foodRecordDao()
}
