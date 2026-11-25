package com.techvanguard.taskmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskStatusRequest;
import com.techvanguard.taskmanager.dto.response.PageResponse;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.enums.UserRole;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử đơn vị cho tầng Controller của Task API.
 * Sử dụng MockMvc standaloneSetup để kiểm tra định tuyến HTTP, serialization JSON
 * và chuẩn phản hồi ApiResponse<T> mà không cần nạp toàn bộ Spring Context nặng nề.
 */
@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private UserPrincipal mockPrincipal;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .email("candidate@techvanguard.vn")
                .password("Password@123")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();
        user.setId(1L);
        mockPrincipal = UserPrincipal.create(user);

        // Giả lập resolver nạp @AuthenticationPrincipal currentUser vào Controller
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return mockPrincipal;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(taskController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/tasks - Lấy danh sách công việc có phân trang thành công")
    void getTasks_Success() throws Exception {
        TaskResponse taskResponse = TaskResponse.builder()
                .id(100L)
                .title("Nhiệm vụ kiểm thử")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .build();

        PageResponse<TaskResponse> pageResponse = PageResponse.<TaskResponse>builder()
                .content(List.of(taskResponse))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1L)
                .totalPages(1)
                .isLast(true)
                .build();

        when(taskService.getTasks(eq(1L), any(), any(), any(), eq(0), eq(10), eq("createdAt"), eq("desc")))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/tasks")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].id").value(100))
                .andExpect(jsonPath("$.data.content[0].title").value("Nhiệm vụ kiểm thử"));
    }

    @Test
    @DisplayName("POST /api/v1/tasks - Tạo mới công việc thành công trả về 201 CREATED")
    void createTask_Success() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Công việc mới");
        request.setDescription("Mô tả chi tiết");
        request.setStatus(TaskStatus.TODO);
        request.setPriority(TaskPriority.HIGH);

        TaskResponse response = TaskResponse.builder()
                .id(101L)
                .title("Công việc mới")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .build();

        when(taskService.createTask(any(CreateTaskRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(101))
                .andExpect(jsonPath("$.data.title").value("Công việc mới"));
    }

    @Test
    @DisplayName("GET /api/v1/tasks/{id} - Lấy chi tiết công việc kèm subtasks")
    void getTaskById_Success() throws Exception {
        TaskDetailResponse detailResponse = TaskDetailResponse.builder()
                .id(102L)
                .title("Chi tiết công việc")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.MEDIUM)
                .subtasks(Collections.emptyList())
                .activityLogs(Collections.emptyList())
                .build();

        when(taskService.getTaskById(102L, 1L)).thenReturn(detailResponse);

        mockMvc.perform(get("/api/v1/tasks/{id}", 102L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(102))
                .andExpect(jsonPath("$.data.title").value("Chi tiết công việc"));
    }

    @Test
    @DisplayName("PATCH /api/v1/tasks/{id}/status - Cập nhật trạng thái Kanban thành công")
    void updateTaskStatus_Success() throws Exception {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest();
        request.setStatus(TaskStatus.DONE);

        TaskResponse response = TaskResponse.builder()
                .id(103L)
                .title("Đổi trạng thái")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.LOW)
                .build();

        when(taskService.updateTaskStatus(eq(103L), any(UpdateTaskStatusRequest.class), eq(1L)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/tasks/{id}/status", 103L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DONE"));
    }

    @Test
    @DisplayName("DELETE /api/v1/tasks/{id} - Xóa công việc thành công")
    void deleteTask_Success() throws Exception {
        doNothing().when(taskService).deleteTask(104L, 1L);

        mockMvc.perform(delete("/api/v1/tasks/{id}", 104L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa công việc thành công"));
    }
}
