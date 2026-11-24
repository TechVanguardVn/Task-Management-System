package backend.repository;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    @Query(value = """
            SELECT count(*) AS "totalTasks",
                   count(*) FILTER (WHERE t.status = 'TODO') AS "todoTasks",
                   count(*) FILTER (WHERE t.status = 'IN_PROGRESS') AS "inProgressTasks",
                   count(*) FILTER (WHERE t.status = 'DONE') AS "doneTasks"
            FROM public.tasks t JOIN public.projects p ON p.id = t.project_id
            WHERE p.owner_id = :ownerId
              AND (CAST(:projectId AS uuid) IS NULL OR p.id = CAST(:projectId AS uuid))
            """, nativeQuery = true)
    DashboardCounts summarizeOwnedTasks(@Param("ownerId") UUID ownerId, @Param("projectId") UUID projectId);

    @EntityGraph(attributePaths = "project")
    Optional<Task> findByIdAndProject_Owner_Id(UUID id, UUID ownerId);

    Page<Task> findAllByProject_IdAndProject_Owner_Id(UUID projectId, UUID ownerId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "project")
    Page<Task> findAll(Specification<Task> specification, Pageable pageable);

    @Query("select t.project.id from Task t where t.id = :id and t.project.owner.id = :ownerId")
    Optional<UUID> findOwnedProjectId(@Param("id") UUID id, @Param("ownerId") UUID ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Task t join fetch t.project p where t.id = :id and p.owner.id = :ownerId")
    Optional<Task> findOwnedForUpdate(@Param("id") UUID id, @Param("ownerId") UUID ownerId);
}
