package com.techvanguard.taskmanager.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Cấu hình hệ thống phân tán Redis cho Cache và Blacklist Token.
 * Sử dụng Jackson JSON Serializer để dữ liệu lưu trữ trong Redis có thể đọc được dạng JSON.
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Khởi tạo RedisTemplate tùy biến phục vụ việc lưu trữ Token Blacklist và Rate Limiting.
     *
     * @param connectionFactory Nhà máy quản lý kết nối Redis
     * @return RedisTemplate với cấu hình Serialization tối ưu
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Sử dụng StringRedisSerializer cho Key để dễ tra cứu trực quan trên Redis CLI
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // Sử dụng JSON Serializer cho Value để lưu trữ các Object phức tạp
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * Cấu hình CacheManager cho các annotation @Cacheable và @CacheEvict.
     * Thiết lập TTL mặc định là 10 phút và không lưu các giá trị null vào cache.
     *
     * @param connectionFactory Nhà máy quản lý kết nối Redis
     * @return RedisCacheManager tiêu chuẩn
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .build();
    }
}
