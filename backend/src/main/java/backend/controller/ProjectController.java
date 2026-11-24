package backend.controller;

import java.net.URI;
import java.util.UUID;

import backend.dto.PageResponse;
import backend.dto.ProjectRequest;
import backend.dto.ProjectResponse;
import backend.security.AuthPrincipal;
import backend.service.ProjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projects;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                                   @Valid @RequestBody ProjectRequest request) {
        ProjectResponse result = projects.create(principal, request);
        return ResponseEntity.created(URI.create("/api/projects/" + result.id())).body(result);
    }

    @GetMapping
    public PageResponse<ProjectResponse> list(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                              @RequestParam(defaultValue = "0") @Min(0) int page,
                                              @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return projects.list(principal, page, size);
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return projects.get(principal, id);
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id,
                                  @Valid @RequestBody ProjectRequest request) {
        return projects.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        projects.delete(principal, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/archive")
    public ProjectResponse archive(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return projects.archive(principal, id);
    }
}
