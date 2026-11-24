package backend.repository;

import java.util.UUID;
import java.util.Optional;

import backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByIdAndUser_Id(UUID id, UUID userId);
}
