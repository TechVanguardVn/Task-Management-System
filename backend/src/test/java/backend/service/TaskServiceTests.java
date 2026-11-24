package backend.service;

import java.util.Optional;
import java.util.UUID;

import backend.dto.TaskRequest;
import backend.entity.Project;
import backend.entity.Task;
import backend.enums.ProjectStatus;
import backend.exception.BusinessException;
import backend.exception.ResourceNotFoundException;
import backend.mapper.TaskMapper;
import backend.repository.ProjectRepository;
import backend.repository.TaskRepository;
import backend.security.AuthPrincipal;
import backend.security.RlsContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTests {
    @Mock private TaskRepository tasks;
    @Mock private ProjectRepository projects;
    @Mock private RlsContext context;
    private TaskService service;
    private final AuthPrincipal principal = new AuthPrincipal(UUID.randomUUID(), UUID.randomUUID());

    @BeforeEach
    void setUp() { service = new TaskService(tasks, projects, context, new TaskMapper()); }

    @Test
    void foreignTaskDoesNotTriggerAnyProjectLookupOrMutation() {
        UUID id = UUID.randomUUID();
        when(tasks.findOwnedProjectId(id, principal.userId())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(principal, id)).isInstanceOf(ResourceNotFoundException.class);
        verify(context).asUser(principal.userId());
        verifyNoInteractions(projects);
        verify(tasks, never()).delete(any(Task.class));
    }

    @Test
    void archivedProjectRejectsCreationBeforeTaskPersistence() {
        UUID projectId = UUID.randomUUID();
        Project project = mock(Project.class);
        when(project.getStatus()).thenReturn(ProjectStatus.ARCHIVED);
        when(projects.findOwnedForUpdate(projectId, principal.userId())).thenReturn(Optional.of(project));
        assertThatThrownBy(() -> service.create(principal, projectId, new TaskRequest("Title", null, null, null, null, null)))
                .isInstanceOf(BusinessException.class);
        verifyNoInteractions(tasks);
    }

    @Test
    void moveUsesPostgresqlUuidLockOrderEvenAcrossJavaSignedUuidBoundary() {
        UUID taskId = UUID.randomUUID();
        UUID sourceId = UUID.fromString("80000000-0000-0000-0000-000000000001");
        UUID targetId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Project source = mock(Project.class);
        Project target = mock(Project.class);
        when(source.getId()).thenReturn(sourceId);
        when(target.getId()).thenReturn(targetId);
        when(source.getStatus()).thenReturn(ProjectStatus.ACTIVE);
        when(target.getStatus()).thenReturn(ProjectStatus.ACTIVE);
        when(tasks.findOwnedProjectId(taskId, principal.userId())).thenReturn(Optional.of(sourceId));
        when(projects.findOwnedForUpdate(sourceId, principal.userId())).thenReturn(Optional.of(source));
        when(projects.findOwnedForUpdate(targetId, principal.userId())).thenReturn(Optional.of(target));
        when(tasks.findOwnedForUpdate(taskId, principal.userId())).thenReturn(Optional.of(new Task(source, "Original")));
        var response = service.update(principal, taskId, new TaskRequest("Moved", null, null, null, null, targetId));
        assertThat(response.projectId()).isEqualTo(targetId);
        var order = inOrder(projects, tasks);
        order.verify(tasks).findOwnedProjectId(taskId, principal.userId());
        order.verify(projects).findOwnedForUpdate(targetId, principal.userId());
        order.verify(projects).findOwnedForUpdate(sourceId, principal.userId());
        order.verify(tasks).findOwnedForUpdate(taskId, principal.userId());
    }
}
