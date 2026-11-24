package backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users", schema = "public")
public class User extends TimestampedEntity {
    @Column(nullable = false, length = 254, unique = true)
    private String email;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    public User(String email, String name, String passwordHash) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
    }
}
