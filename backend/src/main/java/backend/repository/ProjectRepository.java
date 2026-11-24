package backend.repository;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByIdAndOwner_Id(UUID id, UUID ownerId);

    Optional<Project> findByIdAndOwner_Id(UUID id, UUID ownerId);

    Page<Project> findAllByOwner_Id(UUID ownerId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :id and p.owner.id = :ownerId")
    Optional<Project> findOwnedForUpdate(@Param("id") UUID id, @Param("ownerId") UUID ownerId);
}
