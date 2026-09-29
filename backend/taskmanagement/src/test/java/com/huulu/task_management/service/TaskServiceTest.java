package com.huulu.task_management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.huulu.task_management.entity.Task;
import com.huulu.task_management.entity.TaskPriority;
import com.huulu.task_management.entity.TaskStatus;
import com.huulu.task_management.entity.User;
import com.huulu.task_management.repository.TaskRepository;
import com.huulu.task_management.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    private TaskService taskService;
    private User alice;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, userRepository);
        alice = User.builder().id(1L).email("alice@example.com").fullName("Alice").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("alice@example.com", null, List.of()));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void userCannotReadAnotherUsersTask() {
        when(taskRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> taskService.getById(99L));

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void userCanReadOwnedTask() {
        Task task = Task.builder()
                .id(7L)
                .user(alice)
                .title("Owned task")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .build();
        when(taskRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(task));

        assertEquals(7L, taskService.getById(7L).id());
    }
}
