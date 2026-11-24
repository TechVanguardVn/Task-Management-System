package backend.controller;

import java.sql.Connection;
import java.util.Map;
import java.util.UUID;

import backend.support.PostgresTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=")
@AutoConfigureMockMvc
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class TaskIntegrationTests extends PostgresTestSupport {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
        }
    }

    @Test
    void allSixTaskEndpointsRequireAuthentication() throws Exception {
        String project = "/api/projects/" + UUID.randomUUID() + "/tasks";
        String task = "/api/tasks/" + UUID.randomUUID();
        for (var request : java.util.List.of(post(project), get(project), get(task), put(task), patch(task + "/status"), delete(task))) {
            mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Task\",\"status\":\"DONE\"}"))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
        }
    }

    @Test
    void crudUsesDtosAndIgnoresForgedOwnershipAndCompletionFields() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        JsonNode task = create(account, project, Map.of("title", "  Initial  ", "ownerId", UUID.randomUUID().toString(),
                "userId", UUID.randomUUID().toString(), "completedAt", "2000-01-01T00:00:00Z"));
        String path = "/api/tasks/" + task.path("id").asText();
        assertThat(task.path("title").asText()).isEqualTo("Initial");
        assertThat(task.path("status").asText()).isEqualTo("TODO");
        assertThat(task.path("priority").asText()).isEqualTo("MEDIUM");
        assertThat(task.path("completedAt").isNull()).isTrue();
        assertThat(task.toString()).doesNotContain("password", "tokenHash", "ownerId", "userId");
        mvc.perform(get(path).header("Authorization", account.header())).andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(project)).andExpect(jsonPath("$.project").doesNotExist());
        mvc.perform(put(path).header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated\",\"description\":\"Details\",\"status\":\"IN_PROGRESS\",\"priority\":\"HIGH\",\"dueDate\":\"2026-12-01\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated"))
                .andExpect(jsonPath("$.description").value("Details")).andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.dueDate").value("2026-12-01"));
        mvc.perform(delete(path).header("Authorization", account.header())).andExpect(status().isNoContent());
        mvc.perform(get(path).header("Authorization", account.header())).andExpect(status().isNotFound());
        mvc.perform(delete(path).header("Authorization", account.header())).andExpect(status().isNotFound());
    }

    @Test
    void completionTimeIsDatabaseManagedAcrossPatchPutAndCreation() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        JsonNode task = create(account, project, Map.of("title", "Done at creation", "status", "DONE",
                "completedAt", "2000-01-01T00:00:00Z"));
        String id = task.path("id").asText();
        String completed = task.path("completedAt").asText();
        assertThat(java.time.Instant.parse(completed)).isAfter(java.time.Instant.parse("2000-01-01T00:00:00Z"));
        mvc.perform(patch("/api/tasks/" + id + "/status").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").value(completed));
        mvc.perform(put("/api/tasks/" + id).header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Edited done task\",\"status\":\"DONE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").value(completed));
        mvc.perform(patch("/api/tasks/" + id + "/status").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").isEmpty());
        mvc.perform(patch("/api/tasks/" + id + "/status").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").isNotEmpty());
        mvc.perform(put("/api/tasks/" + id).header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Reopened\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.completedAt").isEmpty());
    }

    @Test
    void searchAndFiltersCombineAndTreatWildcardCharactersLiterally() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        create(account, project, Map.of("title", "Alpha build", "status", "TODO", "priority", "HIGH"));
        create(account, project, Map.of("title", "alpha deploy", "status", "DONE", "priority", "LOW"));
        create(account, project, Map.of("title", "Beta 100%_\\literal", "status", "TODO", "priority", "HIGH"));
        String path = "/api/projects/" + project + "/tasks";
        mvc.perform(get(path).header("Authorization", account.header()).param("search", "ALPHA"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get(path).header("Authorization", account.header()).param("search", "AlPhA")
                        .param("status", "TODO").param("priority", "HIGH"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Alpha build"));
        mvc.perform(get(path).header("Authorization", account.header()).param("priority", "LOW"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        for (String term : new String[]{"%", "_", "\\", " 100%_\\literal "}) {
            mvc.perform(get(path).header("Authorization", account.header()).param("search", term))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        }
        mvc.perform(get(path).header("Authorization", account.header()).param("search", "nothing"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void defaultPaginationSortingAndQueryCountStayBounded() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("INSERT INTO public.tasks(project_id,title) SELECT '" + project + "'::uuid, 'Task ' || lpad(i::text,2,'0') FROM generate_series(1,12) i");
        }
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            mvc.perform(get("/api/projects/" + project + "/tasks").header("Authorization", account.header()).param("sort", "title,asc"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.size").value(10))
                    .andExpect(jsonPath("$.content.length()").value(10)).andExpect(jsonPath("$.totalElements").value(12))
                    .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].title").value("Task 01"));
            assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(3);
        } finally { statistics.setStatisticsEnabled(false); }
        mvc.perform(get("/api/projects/" + project + "/tasks").header("Authorization", account.header())
                        .param("sort", "title,asc").param("page", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Task 11"));
        mvc.perform(get("/api/projects/" + project + "/tasks").header("Authorization", account.header())
                        .param("sort", "title,desc").param("size", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].title").value("Task 12"));
        mvc.perform(get("/api/projects/" + project + "/tasks").header("Authorization", account.header()).param("page", "99"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void foreignProjectsAndTasksAreNotAccessibleThroughAnyOperation() throws Exception {
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        String project = project(owner);
        String otherProject = project(other);
        String id = create(owner, project, Map.of("title", "Private")).path("id").asText();
        for (var request : java.util.List.of(get("/api/projects/" + project + "/tasks"), post("/api/projects/" + project + "/tasks"),
                get("/api/tasks/" + id), put("/api/tasks/" + id), patch("/api/tasks/" + id + "/status"), delete("/api/tasks/" + id))) {
            mvc.perform(request.header("Authorization", other.header()).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"title\":\"Stolen\",\"status\":\"DONE\"}"))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
        }
        mvc.perform(put("/api/tasks/" + id).header("Authorization", owner.header()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("title", "Move", "projectId", otherProject))))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/tasks/" + id).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Private"))
                .andExpect(jsonPath("$.projectId").value(project));
    }

    @Test
    void taskMovesOnlyBetweenOwnedActiveProjectsAndListingsFollowIt() throws Exception {
        var account = register("owner@example.com");
        String from = project(account);
        String to = project(account);
        String id = create(account, from, Map.of("title", "Move me")).path("id").asText();
        mvc.perform(put("/api/tasks/" + id).header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("title", "Moved", "projectId", to))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.projectId").value(to));
        mvc.perform(get("/api/projects/" + from + "/tasks").header("Authorization", account.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/projects/" + to + "/tasks").header("Authorization", account.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        archive(account, from);
        mvc.perform(put("/api/tasks/" + id).header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("title", "Forbidden move", "projectId", from))))
                .andExpect(status().isConflict());
        archive(account, to);
        String active = project(account);
        mvc.perform(put("/api/tasks/" + id).header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("title", "Forbidden move", "projectId", active))))
                .andExpect(status().isConflict());
    }

    @Test
    void archivedProjectAllowsReadsButRejectsEveryTaskWriteIncludingDeletion() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        String id = create(account, project, Map.of("title", "Archived task")).path("id").asText();
        archive(account, project);
        for (var request : java.util.List.of(post("/api/projects/" + project + "/tasks"), put("/api/tasks/" + id),
                patch("/api/tasks/" + id + "/status"), delete("/api/tasks/" + id))) {
            mvc.perform(request.header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"title\":\"Forbidden\",\"status\":\"DONE\"}"))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.status").value(409));
        }
        mvc.perform(get("/api/tasks/" + id).header("Authorization", account.header())).andExpect(status().isOk());
        mvc.perform(get("/api/projects/" + project + "/tasks").header("Authorization", account.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void invalidInputsFiltersSortAndPaginationReturn400AndMissingIdsReturn404() throws Exception {
        var account = register("owner@example.com");
        String project = project(account);
        String path = "/api/projects/" + project + "/tasks";
        for (String body : new String[]{"{}", "{\"title\":\"  \"}", json.writeValueAsString(Map.of("title", "x".repeat(256))),
                json.writeValueAsString(Map.of("title", "Valid", "description", "x".repeat(10001))),
                "{\"title\":\"Valid\",\"status\":\"INVALID\"}", "{\"title\":\"Valid\",\"priority\":\"INVALID\"}",
                "{\"title\":\"Valid\",\"dueDate\":\"invalid\"}",
                json.writeValueAsString(Map.of("title", "Valid", "projectId", UUID.randomUUID().toString()))}) {
            mvc.perform(post(path).header("Authorization", account.header()).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
        for (String query : new String[]{"page=-1", "size=0", "size=101", "sort=ownerId,asc", "sort=title,bad",
                "sort=title", "status=INVALID", "priority=INVALID"}) {
            mvc.perform(get(path + "?" + query).header("Authorization", account.header()))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
        String id = create(account, project, Map.of("title", "Valid")).path("id").asText();
        mvc.perform(patch("/api/tasks/" + id + "/status").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/tasks/not-a-uuid").header("Authorization", account.header())).andExpect(status().isBadRequest());
        mvc.perform(get("/api/tasks/" + UUID.randomUUID()).header("Authorization", account.header())).andExpect(status().isNotFound());
        mvc.perform(get("/api/projects/" + UUID.randomUUID() + "/tasks").header("Authorization", account.header()))
                .andExpect(status().isNotFound());
    }

    private JsonNode create(Account account, String project, Map<String, String> fields) throws Exception {
        return json.readTree(mvc.perform(post("/api/projects/" + project + "/tasks").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(fields)))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andReturn().getResponse().getContentAsString());
    }

    private String project(Account account) throws Exception {
        return json.readTree(mvc.perform(post("/api/projects").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test project\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
    }

    private void archive(Account account, String id) throws Exception {
        mvc.perform(patch("/api/projects/" + id + "/archive").header("Authorization", account.header())).andExpect(status().isOk());
    }

    private Account register(String email) throws Exception {
        JsonNode result = json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "name", "User", "password", "correct horse battery staple"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return new Account(result.path("accessToken").asText());
    }

    private record Account(String token) {
        String header() { return "Bearer " + token; }
        @Override public String toString() { return "Account[REDACTED]"; }
    }
}
