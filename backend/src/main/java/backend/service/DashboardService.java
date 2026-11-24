package backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

import backend.dto.DashboardSummaryResponse;
import backend.dto.PageResponse;
import backend.dto.TaskResponse;
import backend.exception.ResourceNotFoundException;
import backend.mapper.TaskMapper;
import backend.repository.ProjectRepository;
import backend.repository.TaskRepository;
import backend.repository.TaskSpecifications;
import backend.security.AuthPrincipal;
import backend.security.RlsContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {
    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final RlsContext context;
    private final TaskMapper mapper;
    private final Clock dashboardClock;

    public DashboardSummaryResponse summary(AuthPrincipal principal, UUID projectId) {
        establishScope(principal, projectId);
        var counts = tasks.summarizeOwnedTasks(principal.userId(), projectId);
        BigDecimal percentage = counts.getTotalTasks() == 0 ? BigDecimal.ZERO.setScale(2)
                : BigDecimal.valueOf(counts.getDoneTasks()).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(counts.getTotalTasks()), 2, RoundingMode.HALF_UP);
        return new DashboardSummaryResponse(counts.getTotalTasks(), counts.getTodoTasks(),
                counts.getInProgressTasks(), counts.getDoneTasks(), percentage);
    }

    public PageResponse<TaskResponse> upcoming(AuthPrincipal principal, UUID projectId, int page, int size) {
        return dueTasks(principal, projectId, page, size, true);
    }

    public PageResponse<TaskResponse> overdue(AuthPrincipal principal, UUID projectId, int page, int size) {
        return dueTasks(principal, projectId, page, size, false);
    }

    private PageResponse<TaskResponse> dueTasks(AuthPrincipal principal, UUID projectId, int page, int size, boolean upcoming) {
        establishScope(principal, projectId);
        LocalDate today = LocalDate.now(dashboardClock);
        var result = tasks.findAll(TaskSpecifications.dueTasks(principal.userId(), projectId, today, upcoming),
                PageRequest.of(page, size, Sort.by("dueDate", "id")));
        return new PageResponse<>(result.getContent().stream().map(mapper::toResponse).toList(), result.getNumber(),
                result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    private void establishScope(AuthPrincipal principal, UUID projectId) {
        context.asUser(principal.userId());
        if (projectId != null && !projects.existsByIdAndOwner_Id(projectId, principal.userId())) {
            throw new ResourceNotFoundException("Project not found");
        }
    }
}
