package com.tanseng2027.task_management.config;

import java.time.Clock;
import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.tanseng2027.task_management.ai.AiClient;
import com.tanseng2027.task_management.ai.AiProperties;
import com.tanseng2027.task_management.ai.GeminiAiClient;

import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    @Bean
    public AiClient aiClient(AiProperties properties, JsonMapper jsonMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(properties.timeout());

        RestClient restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
        return new GeminiAiClient(properties, restClient, jsonMapper);
    }

    /** Đồng hồ hệ thống; tách thành bean để test cố định được "hôm nay". */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
