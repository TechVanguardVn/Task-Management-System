package com.tanseng2027.task_management.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.tanseng2027.task_management.dto.request.TaskRequest;
import com.tanseng2027.task_management.dto.response.PageResponse;
import com.tanseng2027.task_management.dto.response.TaskResponse;
import com.tanseng2027.task_management.entity.Task;
import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.exception.ResourceNotFoundException;
import com.tanseng2027.task_management.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").fullName("Alice").password("x").build();
    }

    private Task aliceTask(Long id) {
        return Task.builder()
                .id(id)
                .title("Task cũ")
                .description("Mô tả cũ")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .dueDate(LocalDate.of(2026, 1, 1))
                .user(alice)
                .build();
    }

    // ===== createTask =====

    @Test
    @DisplayName("Tạo task không gửi status/priority → mặc định TODO/MEDIUM, title được trim, gắn đúng user")
    void createTask_appliesDefaults() {
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        TaskRequest request = TaskRequest.builder().title("  Học Spring  ").build();

        TaskResponse response = taskService.createTask(alice, request);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        Task saved = captor.getValue();
        assertThat(saved.getTitle()).isEqualTo("Học Spring");
        assertThat(saved.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(saved.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(saved.getUser()).isSameAs(alice);
        assertThat(response.getTitle()).isEqualTo("Học Spring");
    }

    @Test
    @DisplayName("Tạo task có gửi status/priority → dùng đúng giá trị gửi lên")
    void createTask_keepsProvidedStatusAndPriority() {
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        TaskRequest request = TaskRequest.builder()
                .title("Task").status(TaskStatus.DONE).priority(TaskPriority.LOW).build();

        TaskResponse response = taskService.createTask(alice, request);

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.LOW);
    }

    // ===== getTask =====

    @Test
    @DisplayName("Xem task của chính mình → trả về task")
    void getTask_owned_returnsTask() {
        when(taskRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(aliceTask(10L)));

        TaskResponse response = taskService.getTask(alice, 10L);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getTitle()).isEqualTo("Task cũ");
    }

    @Test
    @DisplayName("Xem task không tồn tại hoặc của user khác → ResourceNotFoundException")
    void getTask_notOwned_throwsNotFound() {
        when(taskRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask(alice, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ===== updateTask =====

    @Test
    @DisplayName("Cập nhật không gửi status/priority → giữ nguyên; description/dueDate được thay thế")
    void updateTask_keepsStatusAndPriorityWhenNull() {
        Task existing = aliceTask(10L);
        when(taskRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(taskRepository.saveAndFlush(existing)).thenReturn(existing);
        TaskRequest request = TaskRequest.builder().title(" Tiêu đề mới ").build();

        TaskResponse response = taskService.updateTask(alice, 10L, request);

        assertThat(response.getTitle()).isEqualTo("Tiêu đề mới");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(response.getDescription()).isNull();
        assertThat(response.getDueDate()).isNull();
    }

    @Test
    @DisplayName("Cập nhật có gửi status/priority → đổi sang giá trị mới")
    void updateTask_changesStatusAndPriority() {
        Task existing = aliceTask(10L);
        when(taskRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(taskRepository.saveAndFlush(existing)).thenReturn(existing);
        TaskRequest request = TaskRequest.builder()
                .title("Task").status(TaskStatus.DONE).priority(TaskPriority.LOW)
                .dueDate(LocalDate.of(2026, 12, 31)).build();

        TaskResponse response = taskService.updateTask(alice, 10L, request);

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.LOW);
        assertThat(response.getDueDate()).isEqualTo(LocalDate.of(2026, 12, 31));
    }

    @Test
    @DisplayName("Cập nhật task của user khác → ResourceNotFoundException, không lưu gì")
    void updateTask_notOwned_throwsAndDoesNotSave() {
        when(taskRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(alice, 99L, TaskRequest.builder().title("x").build()))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).saveAndFlush(any());
    }

    // ===== deleteTask =====

    @Test
    @DisplayName("Xóa task của chính mình → gọi repository.delete")
    void deleteTask_owned_deletes() {
        Task existing = aliceTask(10L);
        when(taskRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        taskService.deleteTask(alice, 10L);

        verify(taskRepository).delete(existing);
    }

    @Test
    @DisplayName("Xóa task của user khác → ResourceNotFoundException, không xóa gì")
    void deleteTask_notOwned_throwsAndDoesNotDelete() {
        when(taskRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(alice, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).delete(any(Task.class));
    }

    // ===== getTasks =====

    @Test
    @DisplayName("Danh sách task → chuyển Page thành PageResponse đúng thông tin phân trang")
    void getTasks_mapsPage() {
        Pageable pageable = PageRequest.of(1, 2);
        when(taskRepository.findAll(ArgumentMatchers.<Specification<Task>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(aliceTask(3L), aliceTask(4L)), pageable, 5));

        PageResponse<TaskResponse> result = taskService.getTasks(alice, "task", TaskStatus.TODO, null, pageable);

        assertThat(result.content()).extracting(TaskResponse::getId).containsExactly(3L, 4L);
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.size()).isEqualTo(2);
        assertThat(result.totalElements()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.first()).isFalse();
        assertThat(result.last()).isFalse();
    }
}
