package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.mapper.TaskMapper;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Lớp triển khai dịch vụ xuất báo cáo công việc ra CSV và JSON.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportServiceImpl implements ExportService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public byte[] exportTasksToCsv(Long userId) {
        log.info("Bắt đầu xuất danh sách công việc ra CSV cho User ID: {}", userId);

        List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<TaskResponse> responses = taskMapper.toResponseList(tasks);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
            // NOTE: Ghi ký tự Byte Order Mark (BOM: \uFEFF) ở đầu file để Microsoft Excel trên Windows tự nhận diện đúng font Tiếng Việt
            out.write(0xEF);
            out.write(0xBB);
            out.write(0xBF);

            // Ghi dòng tiêu đề các cột (Header)
            writer.println("ID,Tiêu đề,Trạng thái,Độ ưu tiên,Hạn hoàn thành,Số việc con,Đã hoàn thành,Tiến độ (%),Ngày tạo,Mô tả");

            // Duyệt từng task và ghi dữ liệu ra dòng CSV tương ứng
            for (TaskResponse task : responses) {
                String dueDateStr = task.getDueDate() != null ? task.getDueDate().format(DATE_FORMATTER) : "Không có";
                String createdAtStr = task.getCreatedAt() != null ? task.getCreatedAt().format(DATE_FORMATTER) : "";
                String escapedTitle = escapeSpecialCharacters(task.getTitle());
                String escapedDesc = escapeSpecialCharacters(task.getDescription() != null ? task.getDescription() : "");

                writer.printf("%d,\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d%%,\"%s\",\"%s\"%n",
                        task.getId(),
                        escapedTitle,
                        task.getStatus().getDescription(),
                        task.getPriority().getDescription(),
                        dueDateStr,
                        task.getSubtaskCount(),
                        task.getCompletedSubtaskCount(),
                        task.getProgressPercentage(),
                        createdAtStr,
                        escapedDesc
                );
            }
            writer.flush();
        } catch (Exception ex) {
            log.error("Lỗi khi tạo file CSV", ex);
        }

        return out.toByteArray();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> exportTasksToJson(Long userId) {
        List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return taskMapper.toResponseList(tasks);
    }

    /**
     * Tiện ích bọc và escape các ký tự đặc biệt trong trường CSV (dấu nháy kép, xuống dòng).
     */
    private String escapeSpecialCharacters(String data) {
        if (data == null) {
            return "";
        }
        return data.replace("\"", "\"\"");
    }
}
