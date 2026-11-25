package com.tanseng2027.task_management.integration;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

class TaskApiIntegrationTest extends AbstractIntegrationTest {

    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void loginUsers() throws Exception {
        aliceToken = login(ALICE);
        bobToken = login(BOB);
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private ResultActions performJson(MockHttpServletRequestBuilder request, String token, String json) throws Exception {
        return perform(request.contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    /** Lấy id task đầu tiên của Bob (để thử truy cập chéo). */
    private long firstBobTaskId() throws Exception {
        String body = perform(get("/api/tasks"), bobToken).andReturn()
                .getResponse().getContentAsString(StandardCharsets.UTF_8);
        return ((Number) JsonPath.read(body, "$.content[0].id")).longValue();
    }

    // ===== Danh sách, tìm kiếm, lọc, phân trang =====

    @Test
    @DisplayName("Danh sách mặc định: chỉ task của Alice, phân trang size 10")
    void list_default() throws Exception {
        perform(get("/api/tasks"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    @DisplayName("Phân trang: size=3 → 4 trang, trang cuối có 1 task")
    void list_pagination() throws Exception {
        perform(get("/api/tasks").param("size", "3").param("page", "3"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPages").value(4))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    @DisplayName("size vượt quá 100 → tự giới hạn về 100")
    void list_maxPageSize() throws Exception {
        perform(get("/api/tasks").param("size", "1000"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    @DisplayName("Lọc theo status + priority")
    void list_filterByStatusAndPriority() throws Exception {
        perform(get("/api/tasks").param("status", "TODO").param("priority", "HIGH"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("TODO"))))
                .andExpect(jsonPath("$.content[*].priority", everyItem(is("HIGH"))));
    }

    @Test
    @DisplayName("Tìm theo tiêu đề không phân biệt hoa thường")
    void list_searchCaseInsensitive() throws Exception {
        perform(get("/api/tasks").param("search", "api"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("Tìm ký tự % không bị hiểu là wildcard → không trả về tất cả")
    void list_searchEscapesWildcard() throws Exception {
        perform(get("/api/tasks").param("search", "%"), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("status không hợp lệ → 400")
    void list_invalidStatus_returns400() throws Exception {
        perform(get("/api/tasks").param("status", "ABC"), aliceToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("sort theo field không tồn tại → 400")
    void list_invalidSort_returns400() throws Exception {
        perform(get("/api/tasks").param("sort", "notAField"), aliceToken)
                .andExpect(status().isBadRequest());
    }

    // ===== CRUD =====

    @Test
    @DisplayName("Tạo → xem → sửa → xóa task (luồng đầy đủ)")
    void crud_fullFlow() throws Exception {
        // Tạo: không gửi status/priority → TODO/MEDIUM
        String created = performJson(post("/api/tasks"), aliceToken, """
                        {"title": "  Task test  ", "description": "mo ta", "dueDate": "2026-12-31"}
                        """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title").value("Task test"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.dueDate").value("2026-12-31"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();

        // Xem
        perform(get("/api/tasks/{id}", id), aliceToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Task test"));

        // Sửa: đổi status, không gửi priority → giữ MEDIUM; không gửi dueDate → bị xóa
        performJson(put("/api/tasks/{id}", id), aliceToken, """
                        {"title": "Task da sua", "status": "IN_PROGRESS"}
                        """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Task da sua"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.dueDate").doesNotExist());

        // Xóa → 204, xem lại → 404
        perform(delete("/api/tasks/{id}", id), aliceToken)
                .andExpect(status().isNoContent());
        perform(get("/api/tasks/{id}", id), aliceToken)
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Tạo task thiếu tiêu đề → 400 kèm lỗi field title")
    void create_blankTitle_returns400() throws Exception {
        performJson(post("/api/tasks"), aliceToken, """
                        {"title": "   "}
                        """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    @DisplayName("Tạo task với status không hợp lệ → 400")
    void create_invalidEnum_returns400() throws Exception {
        performJson(post("/api/tasks"), aliceToken, """
                        {"title": "x", "status": "FINISHED"}
                        """)
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Task không tồn tại → 404")
    void get_notFound_returns404() throws Exception {
        perform(get("/api/tasks/{id}", 999_999), aliceToken)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // ===== Phân quyền dữ liệu =====

    @Test
    @DisplayName("Alice KHÔNG xem / sửa / xóa được task của Bob (đều 404)")
    void cannotAccessOtherUsersTask() throws Exception {
        long bobTaskId = firstBobTaskId();

        perform(get("/api/tasks/{id}", bobTaskId), aliceToken)
                .andExpect(status().isNotFound());
        performJson(put("/api/tasks/{id}", bobTaskId), aliceToken, """
                        {"title": "hack"}
                        """)
                .andExpect(status().isNotFound());
        perform(delete("/api/tasks/{id}", bobTaskId), aliceToken)
                .andExpect(status().isNotFound());

        // Task của Bob vẫn còn nguyên
        perform(get("/api/tasks/{id}", bobTaskId), bobToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(org.hamcrest.Matchers.not("hack")));
    }

    @Test
    @DisplayName("Bob chỉ thấy 3 task của mình")
    void listOnlyShowsOwnTasks() throws Exception {
        perform(get("/api/tasks"), bobToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }
}
