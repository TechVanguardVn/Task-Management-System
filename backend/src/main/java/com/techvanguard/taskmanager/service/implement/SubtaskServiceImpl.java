package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.request.CreateSubtaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateSubtaskRequest;
import com.techvanguard.taskmanager.dto.response.SubtaskResponse;
import com.techvanguard.taskmanager.entity.Subtask;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.exception.ResourceNotFoundException;
import com.techvanguard.taskmanager.mapper.SubtaskMapper;
import com.techvanguard.taskmanager.repository.SubtaskRepository;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.service.SubtaskService;
import com.techvanguard.taskmanager.service.TaskActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lớp triển khai dịch vụ quản lý các đầu việc con (Subtasks).
 * Tự động kiểm tra quyền sở hữu để triệt tiêu lỗ hổng IDOR.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubtaskServiceImpl implements SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final SubtaskMapper subtaskMapper;
    private final TaskActivityLogService activityLogService;

    @Override
    @Transactional
    public SubtaskResponse addSubtask(Long taskId, CreateSubtaskRequest request, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu task cha của user (chống IDOR)
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        // Bước 2: Tạo mới subtask và liên kết với task cha
        Subtask subtask = Subtask.builder()
                .title(request.getTitle().trim())
                .isCompleted(false)
                .task(task)
                .build();

        Subtask savedSubtask = subtaskRepository.save(subtask);

        // Bước 3: Ghi nhận nhật ký hoạt động
        activityLogService.logActivity(
                task.getUser(),
                task,
                "SUBTASK_ADDED",
                "Đã thêm công việc con: \"" + savedSubtask.getTitle() + "\""
        );

        return subtaskMapper.toResponse(savedSubtask);
    }

    @Override
    @Transactional
    public SubtaskResponse updateSubtask(Long subtaskId, UpdateSubtaskRequest request, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu subtask thông qua task cha của user (chống IDOR)
        Subtask subtask = subtaskRepository.findByIdAndUserId(subtaskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask", "id", subtaskId));

        // Bước 2: Cập nhật thông tin tiêu đề và trạng thái
        subtask.setTitle(request.getTitle().trim());
        if (request.getIsCompleted() != null) {
            subtask.setCompleted(request.getIsCompleted());
        }

        Subtask updatedSubtask = subtaskRepository.save(subtask);
        return subtaskMapper.toResponse(updatedSubtask);
    }

    @Override
    @Transactional
    public SubtaskResponse toggleSubtask(Long subtaskId, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu (chống IDOR)
        Subtask subtask = subtaskRepository.findByIdAndUserId(subtaskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask", "id", subtaskId));

        // Bước 2: Đảo ngược trạng thái hoàn thành hiện tại
        boolean newStatus = !subtask.isCompleted();
        subtask.setCompleted(newStatus);
        Subtask updatedSubtask = subtaskRepository.save(subtask);

        // Bước 3: Ghi nhận nhật ký thao tác
        String statusText = newStatus ? "hoàn thành" : "chưa hoàn thành";
        activityLogService.logActivity(
                subtask.getTask().getUser(),
                subtask.getTask(),
                "SUBTASK_TOGGLED",
                "Đã đánh dấu " + statusText + " công việc con: \"" + subtask.getTitle() + "\""
        );

        return subtaskMapper.toResponse(updatedSubtask);
    }

    @Override
    @Transactional
    public void deleteSubtask(Long subtaskId, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu trước khi xóa (chống IDOR)
        Subtask subtask = subtaskRepository.findByIdAndUserId(subtaskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask", "id", subtaskId));

        Task task = subtask.getTask();
        String subtaskTitle = subtask.getTitle();

        // Bước 2: Xóa subtask khỏi database
        subtaskRepository.delete(subtask);

        // Bước 3: Ghi nhận nhật ký hoạt động
        activityLogService.logActivity(
                task.getUser(),
                task,
                "SUBTASK_DELETED",
                "Đã xóa công việc con: \"" + subtaskTitle + "\""
        );
    }
}
