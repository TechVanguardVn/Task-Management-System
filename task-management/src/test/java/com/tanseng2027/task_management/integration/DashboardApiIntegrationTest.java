package com.tanseng2027.task_management.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Số liệu kỳ vọng dựa trên dữ liệu seed V3 (hạn tính theo ngày chạy test):
 * Alice: 10 task = 6 TODO + 2 IN_PROGRESS + 2 DONE; 1 task quá hạn chưa xong;
 *        task chưa xong có hạn sau 1, 3, 5, 7, 10, 12 ngày.
 * Bob:   3 task = 1 TODO + 1 IN_PROGRESS + 1 DONE.
 */
class DashboardApiIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Alice: thống kê đúng theo trạng thái, quá hạn và 4 task sắp đến hạn trong 7 ngày")
    void stats_alice_default7Days() throws Exception {
        LocalDate today = LocalDate.now();

        mockMvc.perform(get("/api/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(login(ALICE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(10))
                .andExpect(jsonPath("$.todoTasks").value(6))
                .andExpect(jsonPath("$.inProgressTasks").value(2))
                .andExpect(jsonPath("$.doneTasks").value(2))
                .andExpect(jsonPath("$.overdueTasks").value(1))
                .andExpect(jsonPath("$.upcomingDays").value(7))
                .andExpect(jsonPath("$.upcomingTasks", hasSize(4)))
                // sắp xếp hạn gần nhất lên trước
                .andExpect(jsonPath("$.upcomingTasks[0].dueDate").value(today.plusDays(1).toString()))
                .andExpect(jsonPath("$.upcomingTasks[3].dueDate").value(today.plusDays(7).toString()));
    }

    @Test
    @DisplayName("days=2 → chỉ 1 task; days=999 → giới hạn 30 ngày → 6 task")
    void stats_daysParam() throws Exception {
        String token = login(ALICE);

        mockMvc.perform(get("/api/dashboard").param("days", "2").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upcomingTasks", hasSize(1)));

        mockMvc.perform(get("/api/dashboard").param("days", "999").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upcomingDays").value(30))
                .andExpect(jsonPath("$.upcomingTasks", hasSize(6)));
    }

    @Test
    @DisplayName("Chuyển 1 task sắp hạn sang DONE → biến khỏi danh sách sắp hạn, doneTasks tăng")
    void stats_doneTaskLeavesUpcoming() throws Exception {
        String token = login(ALICE);
        String body = mockMvc.perform(get("/api/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        long firstUpcomingId = ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.upcomingTasks[0].id")).longValue();

        mockMvc.perform(put("/api/tasks/{id}", firstUpcomingId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "done", "status": "DONE"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(jsonPath("$.doneTasks").value(3))
                .andExpect(jsonPath("$.upcomingTasks", hasSize(3)));
    }

    @Test
    @DisplayName("Bob chỉ thấy số liệu của mình")
    void stats_bob_isolated() throws Exception {
        mockMvc.perform(get("/api/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(login(BOB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(3))
                .andExpect(jsonPath("$.todoTasks").value(1))
                .andExpect(jsonPath("$.inProgressTasks").value(1))
                .andExpect(jsonPath("$.doneTasks").value(1))
                .andExpect(jsonPath("$.overdueTasks").value(0));
    }

    @Test
    @DisplayName("days không phải số → 400; không có token → 401")
    void stats_errors() throws Exception {
        mockMvc.perform(get("/api/dashboard").param("days", "abc").header(HttpHeaders.AUTHORIZATION, bearer(login(ALICE))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
