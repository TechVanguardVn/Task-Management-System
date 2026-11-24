package backend.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

import backend.support.PostgresTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class ProjectIntegrationTests extends PostgresTestSupport {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
        }
    }

    @Test
    void everyProjectEndpointRequiresAuthentication() throws Exception {
        String path = "/api/projects/" + UUID.randomUUID();
        for (var request : java.util.List.of(post("/api/projects"), get("/api/projects"), get(path),
                put(path), delete(path), patch(path + "/archive"))) {
            mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
        }
    }

    @Test
    void createDerivesOwnerAndReturnsAllFieldsWithoutEntitiesOrHashes() throws Exception {
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        String payload = json.writeValueAsString(Map.of("name", "  Launch  ", "description", "Description",
                "color", "#123abc", "status", "ACTIVE", "start_date", "2026-01-01", "due_date", "2026-01-31",
                "owner_id", other.id().toString(), "ownerId", other.id().toString()));
        String body = mvc.perform(post("/api/projects").header("Authorization", owner.header())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.ownerId").value(owner.id().toString()))
                .andExpect(jsonPath("$.name").value("Launch"))
                .andExpect(jsonPath("$.description").value("Description"))
                .andExpect(jsonPath("$.color").value("#123abc"))
                .andExpect(jsonPath("$.startDate").value("2026-01-01"))
                .andExpect(jsonPath("$.dueDate").value("2026-01-31"))
                .andExpect(jsonPath("$.createdAt").exists()).andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.owner").doesNotExist()).andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("password", "tokenHash");
        String id = json.readTree(body).path("id").asText();
        mvc.perform(get("/api/projects/" + id).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void foreignOwnerCannotReadUpdateDeleteOrArchiveAndMissingIdsAlsoReturn404() throws Exception {
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        String id = create(owner, "Private").path("id").asText();
        for (String target : new String[]{id, UUID.randomUUID().toString()}) {
            String path = "/api/projects/" + target;
            for (var request : java.util.List.of(get(path), put(path), delete(path), patch(path + "/archive"))) {
                mvc.perform(request.header("Authorization", other.header()).contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"Hijacked\"}"))
                        .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Project not found"));
            }
        }
        mvc.perform(get("/api/projects/" + id).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Private"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/projects").header("Authorization", other.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void putReplacesFieldsAndSupportsStatusChangesAndOptionalFieldClearing() throws Exception {
        var owner = register("owner@example.com");
        String id = create(owner, "Original").path("id").asText();
        String payload = """
                {"name":"Updated","description":"New description","color":"blue","status":"ARCHIVED",
                 "startDate":"2026-02-01","dueDate":"2026-02-01","ownerId":"00000000-0000-0000-0000-000000000000"}
                """;
        mvc.perform(put("/api/projects/" + id).header("Authorization", owner.header())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.status").value("ARCHIVED"))
                .andExpect(jsonPath("$.ownerId").value(owner.id().toString()));
        mvc.perform(put("/api/projects/" + id).header("Authorization", owner.header())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Restored\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.description").isEmpty())
                .andExpect(jsonPath("$.color").isEmpty()).andExpect(jsonPath("$.startDate").isEmpty())
                .andExpect(jsonPath("$.dueDate").isEmpty()).andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void listingPaginatesOnlyOwnedProjectsWithStableOrdering() throws Exception {
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        for (int i = 0; i < 3; i++) { create(owner, "Project " + i); }
        create(other, "Hidden");
        String firstBody = mvc.perform(get("/api/projects?page=0&size=2").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3)).andExpect(jsonPath("$.totalPages").value(2))
                .andReturn().getResponse().getContentAsString();
        JsonNode first = json.readTree(firstBody);
        String secondBody = mvc.perform(get("/api/projects?page=1&size=2").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        String secondId = json.readTree(secondBody).path("content").get(0).path("id").asText();
        assertThat(secondId).isNotEqualTo(first.path("content").get(0).path("id").asText())
                .isNotEqualTo(first.path("content").get(1).path("id").asText());
        mvc.perform(get("/api/projects?page=99&size=2").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void invalidFieldsDatesEnumsIdentifiersAndPaginationReturn400() throws Exception {
        var owner = register("owner@example.com");
        for (String body : new String[]{"{}", "{\"name\":\"  \"}",
                json.writeValueAsString(Map.of("name", "x".repeat(121))),
                json.writeValueAsString(Map.of("name", "Valid", "description", "x".repeat(10001))),
                json.writeValueAsString(Map.of("name", "Valid", "color", "x".repeat(33))),
                "{\"name\":\"Valid\",\"status\":\"DELETED\"}",
                "{\"name\":\"Valid\",\"startDate\":\"2026-02-01\",\"dueDate\":\"2026-01-01\"}",
                "{\"name\":\"Valid\",\"dueDate\":\"invalid\"}"}) {
            mvc.perform(post("/api/projects").header("Authorization", owner.header())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
        for (String query : new String[]{"page=-1", "size=0", "size=101", "page=invalid"}) {
            mvc.perform(get("/api/projects?" + query).header("Authorization", owner.header()))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
        mvc.perform(get("/api/projects/not-a-uuid").header("Authorization", owner.header()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/projects").header("Authorization", owner.header()))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void archiveIsIdempotentAndDatabaseRejectsTaskWrites() throws Exception {
        var owner = register("owner@example.com");
        String id = create(owner, "Archive me").path("id").asText();
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("INSERT INTO public.tasks(project_id,title) VALUES ('" + id + "','Existing')");
        }
        for (int i = 0; i < 2; i++) {
            mvc.perform(patch("/api/projects/" + id + "/archive").header("Authorization", owner.header()))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ARCHIVED"));
        }
        for (String sql : new String[]{"UPDATE public.tasks SET title='Forbidden' WHERE project_id='" + id + "'",
                "INSERT INTO public.tasks(project_id,title) VALUES ('" + id + "','Forbidden')"}) {
            try (Connection runtime = DriverManager.getConnection(URL, "task2_runtime", "");
                 var statement = runtime.createStatement()) {
                runtime.setAutoCommit(false);
                statement.execute("SET LOCAL app.current_user_id='" + owner.id() + "'");
                assertThatThrownBy(() -> statement.execute(sql)).isInstanceOfSatisfying(SQLException.class,
                        error -> assertThat(error.getSQLState()).isEqualTo("23514"));
            }
        }
    }

    @Test
    void deletingArchivedProjectCascadesOnlyItsTasks() throws Exception {
        var owner = register("owner@example.com");
        String id = create(owner, "Delete").path("id").asText();
        String keep = create(owner, "Keep").path("id").asText();
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("INSERT INTO public.tasks(project_id,title) VALUES ('" + id + "','Delete'),('" + keep + "','Keep')");
        }
        mvc.perform(patch("/api/projects/" + id + "/archive").header("Authorization", owner.header()))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/projects/" + id).header("Authorization", owner.header()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/projects/" + id).header("Authorization", owner.header()))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/projects/" + id).header("Authorization", owner.header()))
                .andExpect(status().isNotFound());
        try (Connection admin = adminConnection(); var statement = admin.createStatement();
             var result = statement.executeQuery("SELECT count(*), min(project_id::text) FROM public.tasks")) {
            result.next();
            assertThat(result.getLong(1)).isEqualTo(1);
            assertThat(result.getString(2)).isEqualTo(keep);
        }
    }

    private JsonNode create(Account account, String name) throws Exception {
        String body = mvc.perform(post("/api/projects").header("Authorization", account.header())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("name", name))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    private Account register(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "name", "Test user", "password", "correct horse battery staple"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JsonNode response = json.readTree(body);
        return new Account(UUID.fromString(response.path("user").path("id").asText()), response.path("accessToken").asText());
    }

    private record Account(UUID id, String token) {
        String header() { return "Bearer " + token; }
        @Override public String toString() { return "Account[REDACTED]"; }
    }
}
