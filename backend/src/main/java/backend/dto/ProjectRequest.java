package backend.dto;

import java.time.LocalDate;

import backend.enums.ProjectStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 10000) String description,
        @Size(max = 32) String color,
        ProjectStatus status,
        @JsonAlias("start_date") LocalDate startDate,
        @JsonAlias("due_date") LocalDate dueDate) {

    public ProjectRequest {
        name = name == null ? null : name.strip();
        status = status == null ? ProjectStatus.ACTIVE : status;
    }

    @AssertTrue(message = "dueDate must be on or after startDate")
    @JsonIgnore
    public boolean isDateRangeValid() {
        return startDate == null || dueDate == null || !dueDate.isBefore(startDate);
    }
}
