package backend.config;

import java.util.List;
import java.util.Map;

import backend.dto.ApiErrorResponse;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    private static final String ID = "00000000-0000-0000-0000-000000000001";
    private static final Map<String, Object> USER = Map.of("id", ID, "email", "developer@example.invalid", "name", "Developer");
    private static final Map<String, Object> PROJECT = Map.of("id", ID, "ownerId", ID, "name", "Release plan", "status", "ACTIVE",
            "createdAt", "2026-11-23T00:00:00Z", "updatedAt", "2026-11-23T00:00:00Z");
    private static final Map<String, Object> TASK = Map.of("id", ID, "projectId", ID, "title", "Review checklist", "status", "TODO",
            "priority", "HIGH", "dueDate", "2026-11-30", "createdAt", "2026-11-23T00:00:00Z", "updatedAt", "2026-11-23T00:00:00Z");

    @Bean
    OpenAPI taskManagementOpenApi() {
        Components components = new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                .description("Paste the accessToken returned by register/login. Each JWT requires an active database session; logout revokes it."));
        ModelConverters.getInstance().resolveAsResolvedSchema(new AnnotatedType(ApiErrorResponse.class).resolveAsRef(true))
                .referencedSchemas.forEach(components::addSchemas);
        return new OpenAPI().info(new Info().title("Task Management System API").version("v1")
                .description("Session-backed bearer JWT API. All examples are fictional. Foreign-owned resources return 404. "
                        + "PUT replaces fields; see endpoint descriptions for defaults. No refresh tokens are issued."))
                .components(components).addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    @Bean
    OperationCustomizer documentApiOperations() {
        return (operation, handler) -> {
            String controller = handler.getBeanType().getSimpleName();
            String method = handler.getMethod().getName();
            Documentation doc = documentation(controller + "#" + method);
            if (doc == null) { return operation; }
            operation.setTags(List.of(doc.tag()));
            operation.setSummary(doc.summary());
            operation.setDescription(doc.description());
            if (doc.publicAccess()) { operation.setSecurity(List.of()); }
            ApiResponse inferred = operation.getResponses().get(doc.success());
            if (inferred == null) { inferred = operation.getResponses().get("200"); }
            if (inferred == null) { inferred = new ApiResponse(); }
            inferred.setDescription(doc.success().equals("204") ? "Successful operation; no response body" : doc.summary());
            if (doc.success().equals("204")) { inferred.setContent(null); }
            else { example(inferred.getContent(), responseExample(controller, method)); }
            if (doc.success().equals("201") && !controller.equals("AuthController")) {
                inferred.addHeaderObject("Location", new io.swagger.v3.oas.models.headers.Header()
                        .description("Relative URL of the created resource").schema(new Schema<String>().type("string")));
            }
            ApiResponses responses = new ApiResponses().addApiResponse(doc.success(), inferred);
            for (String code : doc.errors().split(",")) {
                if (!code.isEmpty()) { responses.addApiResponse(code, error(code)); }
            }
            if (!doc.publicAccess()) { responses.addApiResponse("403", error("403")); }
            operation.setResponses(responses);
            if (operation.getRequestBody() != null) {
                example(operation.getRequestBody().getContent(), requestExample(controller, method));
            }
            if (operation.getParameters() != null) {
                operation.getParameters().forEach(parameter -> {
                    String description = switch (parameter.getName()) {
                        case "projectId" -> "Owned project UUID. Foreign/missing projects return 404. Optional on dashboard endpoints.";
                        case "id", "taskId" -> "Owned resource UUID; foreign-owned and missing resources both return 404.";
                        case "page" -> "Zero-based page number; must be nonnegative.";
                        case "size" -> "Page size, 1–100. Default 20 for projects, 10 for tasks/dashboard.";
                        case "search" -> "Case-insensitive title substring, max 255 characters. %, _ and backslash are literal.";
                        case "sort" -> "One field,direction pair; default createdAt,desc. Fields: id,title,status,priority,dueDate,completedAt,createdAt,updatedAt. Direction: asc or desc.";
                        case "status" -> "Optional TODO, IN_PROGRESS or DONE filter (case-sensitive).";
                        case "priority" -> "Optional LOW, MEDIUM or HIGH filter (case-sensitive).";
                        default -> parameter.getDescription();
                    };
                    parameter.setDescription(description);
                });
            }
            return operation;
        };
    }

    private static Documentation documentation(String key) {
        return switch (key) {
            case "HealthController#health" -> doc("Health", "Application health", "Liveness only, not a continuous database readiness check.", "200", "500", true);
            case "AuthController#register" -> doc("Authentication", "Register and create a session", "Email is stripped/lowercased. Name is required (max 120). Password: 12+ characters, at most 72 UTF-8 bytes, no NUL. Returns a JWT backed by a new session.", "201", "400,409,500", true);
            case "AuthController#login" -> doc("Authentication", "Sign in and create a session", "Unknown email and wrong password return the same generic 401. Expiration requires another login; there is no refresh endpoint.", "200", "400,401,500", true);
            case "AuthController#logout" -> doc("Authentication", "Revoke the current session", "Invalidates the presented JWT after commit. Other sessions remain active. Reusing an expired/revoked token returns 401.", "204", "401,503,500", false);
            case "AuthController#me" -> doc("Authentication", "Get the authenticated user", "Returns the verified principal's user DTO without password or token hashes.", "200", "401,503,500", false);
            case "ProjectController#create" -> doc("Projects", "Create an owned project", "Owner comes solely from the JWT. Name required (max 120); description max 10000, color max 32. Status defaults ACTIVE; dueDate must not precede startDate.", "201", "400,401,409,503,500", false);
            case "ProjectController#list" -> doc("Projects", "List owned projects", "Includes archived projects. Default size 20; createdAt descending then id descending. Returns page metadata.", "200", "400,401,503,500", false);
            case "ProjectController#get" -> doc("Projects", "Get an owned project", "Foreign and missing IDs both return 404.", "200", "400,401,404,503,500", false);
            case "ProjectController#update" -> doc("Projects", "Replace an owned project", "PUT clears omitted optional fields; omitted/null status defaults ACTIVE. Owner cannot change. ACTIVE can restore an archived project.", "200", "400,401,404,409,503,500", false);
            case "ProjectController#delete" -> doc("Projects", "Delete a project and its tasks", "Permanent ON DELETE CASCADE deletion, including archived-project tasks. Other projects and user/session records remain.", "204", "400,401,404,409,503,500", false);
            case "ProjectController#archive" -> doc("Projects", "Archive a project", "Idempotently sets ARCHIVED. Its tasks remain readable but task API writes are rejected.", "200", "400,401,404,409,503,500", false);
            case "TaskController#create" -> doc("Tasks", "Create a task in an owned project", "Title required (max 255), description max 10000. Status defaults TODO; priority MEDIUM. Optional body projectId must match URL. Archived projects reject writes; completedAt is database-managed.", "201", "400,401,404,409,503,500", false);
            case "TaskController#list" -> doc("Tasks", "Search and filter project tasks", "Owned-project lookup with AND-combined title/status/priority filters, default size 10, bounded SQL pagination and deterministic UUID tie-breaker.", "200", "400,401,404,503,500", false);
            case "TaskController#get" -> doc("Tasks", "Get an owned task", "Ownership is checked through its project. Archived tasks remain readable.", "200", "400,401,404,503,500", false);
            case "TaskController#update" -> doc("Tasks", "Replace or move an owned task", "PUT clears omitted description/dueDate, defaults status TODO and priority MEDIUM. Omitted projectId keeps the project. Moves require owned active source and target. completedAt is read-only.", "200", "400,401,404,409,503,500", false);
            case "TaskController#status" -> doc("Tasks", "Change task status", "Status is required. The database assigns completedAt on entering DONE, preserves it while DONE, and clears it on reopening. Archived projects reject even no-op writes.", "200", "400,401,404,409,503,500", false);
            case "TaskController#delete" -> doc("Tasks", "Delete an owned task", "Permanent deletion. Direct task deletion in archived projects returns 409.", "204", "400,401,404,409,503,500", false);
            case "DashboardController#summary" -> doc("Dashboard", "Get task totals and completion percentage", "One SQL aggregate for owned tasks, including archived projects/undated tasks. Percentage is DONE/total*100 rounded to two decimals; zero tasks gives 0.00.", "200", "400,401,404,503,500", false);
            case "DashboardController#upcoming" -> doc("Dashboard", "List upcoming unfinished tasks", "Today through today+7 days inclusive, excluding DONE/null due dates. Uses DASHBOARD_TIME_ZONE (default UTC); order dueDate then id ascending. Default size 10.", "200", "400,401,404,503,500", false);
            case "DashboardController#overdue" -> doc("Dashboard", "List overdue unfinished tasks", "Due strictly before today in DASHBOARD_TIME_ZONE (default UTC). Excludes DONE/null due dates. Order dueDate then id ascending; default size 10.", "200", "400,401,404,503,500", false);
            default -> null;
        };
    }

    private static Object requestExample(String controller, String method) {
        if (controller.equals("AuthController")) {
            return method.equals("register") ? Map.of("email", "developer@example.invalid", "name", "Developer", "password", "Example password 123!")
                    : Map.of("email", "developer@example.invalid", "password", "Example password 123!");
        }
        if (controller.equals("ProjectController")) {
            return Map.of("name", "Release plan", "description", "Plan the release", "color", "#2563eb", "status", "ACTIVE", "startDate", "2026-11-23", "dueDate", "2026-11-30");
        }
        return method.equals("status") ? Map.of("status", "DONE")
                : Map.of("title", "Review checklist", "description", "Review the release checklist", "status", "TODO", "priority", "HIGH", "dueDate", "2026-11-30");
    }

    private static Object responseExample(String controller, String method) {
        return switch (controller) {
            case "HealthController" -> Map.of("status", "UP");
            case "AuthController" -> method.equals("me") ? USER : Map.of("accessToken", "EXAMPLE_ONLY_NOT_A_REAL_JWT", "tokenType", "Bearer", "expiresAt", "2026-11-23T00:15:00Z", "user", USER);
            case "ProjectController" -> method.equals("list") ? page(PROJECT, 20)
                    : method.equals("archive") ? withFields(PROJECT, Map.of("status", "ARCHIVED")) : PROJECT;
            case "TaskController" -> method.equals("list") ? page(TASK, 10)
                    : method.equals("status") ? withFields(TASK, Map.of("status", "DONE", "completedAt", "2026-11-23T00:05:00Z")) : TASK;
            default -> method.equals("summary") ? Map.of("totalTasks", 3, "todoTasks", 1, "inProgressTasks", 1, "doneTasks", 1, "completionPercentage", 33.33)
                    : page(method.equals("overdue") ? withFields(TASK, Map.of("dueDate", "2026-11-01")) : TASK, 10);
        };
    }

    private static Object withFields(Map<String, Object> original, Map<String, Object> fields) {
        var example = new java.util.LinkedHashMap<>(original);
        example.putAll(fields);
        return example;
    }

    private static Object page(Object item, int size) {
        return Map.of("content", List.of(item), "page", 0, "size", size, "totalElements", 1, "totalPages", 1);
    }

    private static void example(Content content, Object value) {
        if (content != null) { content.values().forEach(media -> media.setExample(value)); }
    }

    private static ApiResponse error(String code) {
        String message = switch (code) {
            case "400" -> "Invalid request or validation failure";
            case "401" -> "Missing, invalid, expired or revoked credentials";
            case "403" -> "Authenticated caller is forbidden from this operation";
            case "404" -> "Resource missing or owned by another user";
            case "409" -> "Duplicate email, archived project or concurrent/integrity conflict";
            case "503" -> "Authentication store temporarily unavailable";
            default -> "Unexpected server error";
        };
        return new ApiResponse().description(message).content(new Content().addMediaType("application/json",
                new MediaType().schema(new Schema<>().$ref("#/components/schemas/ApiErrorResponse"))
                        .example(Map.of("timestamp", "2026-11-23T00:00:00Z", "status", Integer.parseInt(code),
                                "error", org.springframework.http.HttpStatus.valueOf(Integer.parseInt(code)).getReasonPhrase(),
                                "message", message, "path", "/api/example", "validationErrors", List.of()))));
    }

    private static Documentation doc(String tag, String summary, String description, String success, String errors, boolean publicAccess) {
        return new Documentation(tag, summary, description, success, errors, publicAccess);
    }

    private record Documentation(String tag, String summary, String description, String success, String errors, boolean publicAccess) { }
}
