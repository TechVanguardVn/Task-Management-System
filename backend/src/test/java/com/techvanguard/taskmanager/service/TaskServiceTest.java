package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskStatusRequest;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.enums.UserRole;
import com.techvanguard.taskmanager.exception.ResourceNotFoundException;
import com.techvanguard.taskmanager.mapper.TaskMapper;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.repository.UserRepository;
import com.techvanguard.taskmanager.service.implement.TaskServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Bộ kiểm thử đơn vị cho TaskService.
 * Kiểm tra các tình huống tạo, cập nhật trạng thái Kanban, xóa và phòng chống lỗi IDOR.
 */
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskActivityLogService activityLogService;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    @DisplayName("Tạo mới Task thành công và ghi nhận nhật ký hoạt động CREATED")
    void createTask_Success() {
        Long userId = 1L;
        User user = User.builder()
                .email("vanlh25@gmail.com")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();
        user.setId(userId);

        CreateTaskRequest request = CreateTaskRequest.builder()
                .title("Cấu hình cơ sở dữ liệu")
                .description("Thiết lập kết nối PostgreSQL")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .dueDate(LocalDateTime.now().plusDays(2))
                .build();

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .user(user)
                .build();
        task.setId(10L);

        TaskResponse expectedResponse = TaskResponse.builder()
                .id(10L)
                .title("Cấu hình cơ sở dữ liệu")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(taskMapper.toEntity(request, user)).thenReturn(task);
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.toResponse(task)).thenReturn(expectedResponse);

        TaskResponse actualResponse = taskService.createTask(request, userId);

        assertThat(actualResponse).isNotNull();
        assertThat(actualResponse.getId()).isEqualTo(10L);
        verify(activityLogService).logActivity(eq(user), eq(task), eq("CREATED"), any(String.class));
    }

    @Test
    @DisplayName("Xem chi tiết Task thành công khi người dùng sở hữu task đó")
    void getTaskById_Success() {
        Long taskId = 10L;
        Long userId = 1L;

        Task task = Task.builder()
                .title("Viết API")
                .status(TaskStatus.IN_PROGRESS)
                .build();
        task.setId(taskId);

        TaskDetailResponse expectedResponse = TaskDetailResponse.builder()
                .id(taskId)
                .title("Viết API")
                .status(TaskStatus.IN_PROGRESS)
                .build();

        when(taskRepository.findByIdAndUserIdWithSubtasks(taskId, userId)).thenReturn(Optional.of(task));
        when(taskMapper.toDetailResponse(task)).thenReturn(expectedResponse);

        TaskDetailResponse actualResponse = taskService.getTaskById(taskId, userId);

        assertThat(actualResponse).isNotNull();
        assertThat(actualResponse.getId()).isEqualTo(taskId);
    }

    @Test
    @DisplayName("Xem chi tiết thất bại và ném ResourceNotFoundException khi task không thuộc về user (Chống IDOR)")
    void getTaskById_NotOwner_ThrowsException() {
        Long taskId = 99L;
        Long userId = 1L;

        // Giả lập task 99 không tồn tại đối với userId 1 (thuộc user khác)
        when(taskRepository.findByIdAndUserIdWithSubtasks(taskId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(taskId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy Task");
    }

    @Test
    @DisplayName("Cập nhật trạng thái Task thành công trên Bảng Kanban và ghi log STATUS_CHANGED")
    void updateTaskStatus_Success() {
        Long taskId = 10L;
        Long userId = 1L;

        User user = User.builder().email("vanlh25@gmail.com").fullName("Lê Hữu Văn").build();
        user.setId(userId);

        Task task = Task.builder()
                .title("Nhiệm vụ")
                .status(TaskStatus.TODO)
                .user(user)
                .build();
        task.setId(taskId);

        UpdateTaskStatusRequest request = UpdateTaskStatusRequest.builder()
                .status(TaskStatus.IN_PROGRESS)
                .build();

        Task updatedTask = Task.builder()
                .title("Nhiệm vụ")
                .status(TaskStatus.IN_PROGRESS)
                .user(user)
                .build();
        updatedTask.setId(taskId);

        TaskResponse expectedResponse = TaskResponse.builder()
                .id(taskId)
                .status(TaskStatus.IN_PROGRESS)
                .build();

        when(taskRepository.findByIdAndUserId(taskId, userId)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(updatedTask);
        when(taskMapper.toResponse(updatedTask)).thenReturn(expectedResponse);

        TaskResponse actualResponse = taskService.updateTaskStatus(taskId, request, userId);

        assertThat(actualResponse.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        verify(activityLogService).logActivity(eq(user), eq(updatedTask), eq("STATUS_CHANGED"), any(String.class));
    }

    @Test
    @DisplayName("Xóa Task thành công và ghi log DELETED")
    void deleteTask_Success() {
        Long taskId = 10L;
        Long userId = 1L;

        User user = User.builder().email("vanlh25@gmail.com").fullName("Lê Hữu Văn").build();
        user.setId(userId);

        Task task = Task.builder()
                .title("Task cần xóa")
                .user(user)
                .build();
        task.setId(taskId);

        when(taskRepository.findByIdAndUserId(taskId, userId)).thenReturn(Optional.of(task));

        taskService.deleteTask(taskId, userId);

        verify(taskRepository).delete(task);
        verify(activityLogService).logActivity(eq(user), eq(null), eq("DELETED"), any(String.class));
    }
}
