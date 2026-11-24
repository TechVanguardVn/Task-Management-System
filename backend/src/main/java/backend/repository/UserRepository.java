package backend.repository;

import java.util.UUID;
import java.util.Optional;

import backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByIdAndEmail(UUID id, String email);
}
