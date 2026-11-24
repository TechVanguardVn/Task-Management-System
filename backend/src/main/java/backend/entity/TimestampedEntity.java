package backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Getter
@MappedSuperclass
public abstract class TimestampedEntity extends BaseEntity {
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "timestamptz(3)")
    private Instant updatedAt;
}
