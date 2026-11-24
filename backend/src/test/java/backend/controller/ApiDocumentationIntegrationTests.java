package backend.controller;

import java.sql.Connection;
import java.util.Map;

import backend.support.PostgresTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItMzItYnl0ZXMtbG9uZyE=")
@AutoConfigureMockMvc
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class ApiDocumentationIntegrationTests extends PostgresTestSupport {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    @Test
    void generatedDocumentCoversEveryOperationSecurityCodesSchemasAndExamples() throws Exception {
        JsonNode spec = json.readTree(mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(spec.at("/components/securitySchemes/bearerAuth/type").asText()).isEqualTo("http");
        assertThat(spec.at("/components/securitySchemes/bearerAuth/scheme").asText()).isEqualTo("bearer");
        assertThat(spec.path("security").get(0).has("bearerAuth")).isTrue();
        int operations = 0;
        for (JsonNode path : spec.path("paths")) {
            for (JsonNode operation : path) {
                operations++;
                assertThat(operation.path("summary").asText()).isNotBlank();
                assertThat(operation.path("description").asText()).isNotBlank();
                assertThat(operation.path("tags").isEmpty()).isFalse();
                for (JsonNode response : operation.path("responses")) {
                    assertThat(response.path("description").asText()).isNotBlank();
                }
                for (JsonNode parameter : operation.path("parameters")) {
                    assertThat(parameter.path("name").asText()).isNotIn("principal", "userId", "sessionId");
                }
                if (operation.has("requestBody")) {
                    assertThat(operation.at("/requestBody/content/application~1json/example").isMissingNode()).isFalse();
                }
            }
        }
        assertThat(operations).isEqualTo(20);
        JsonNode registration = spec.path("paths").path("/api/auth/register").path("post");
        assertThat(registration.path("security").isArray()).isTrue();
        assertThat(registration.path("security").isEmpty()).isTrue();
        assertThat(registration.path("responses").has("201")).isTrue();
        assertThat(registration.path("responses").has("409")).isTrue();
        assertThat(registration.path("responses").path("201").path("headers").has("Location")).isFalse();
        assertThat(spec.path("paths").path("/api/auth/logout").path("post").path("responses").has("204")).isTrue();
        assertThat(spec.path("components").path("schemas").has("ApiErrorResponse")).isTrue();
        assertThat(spec.at("/components/schemas/RegisterRequest/properties/password/writeOnly").asBoolean()).isTrue();
    }

    @Test
    void swaggerUiAndConfigurationArePublicButBusinessApisStillRequireJwt() throws Exception {
        mvc.perform(get("/swagger-ui.html")).andExpect(status().is3xxRedirection());
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isOk());
        mvc.perform(get("/api/projects")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/dashboard/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    void completeRegisterProjectTaskDashboardLogoutFlow() throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
        }
        JsonNode auth = json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "flow@example.invalid", "name", "Flow", "password", "Example password 123!"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String bearer = "Bearer " + auth.path("accessToken").asText();
        JsonNode project = json.readTree(mvc.perform(post("/api/projects").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Flow\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        mvc.perform(post("/api/projects/" + project.path("id").asText() + "/tasks").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Finish\",\"status\":\"DONE\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.completedAt").isNotEmpty());
        mvc.perform(get("/api/dashboard/summary").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(1))
                .andExpect(jsonPath("$.completionPercentage").value(100));
        mvc.perform(post("/api/auth/logout").header("Authorization", bearer)).andExpect(status().isNoContent());
        mvc.perform(get("/api/projects").header("Authorization", bearer)).andExpect(status().isUnauthorized());
    }
}
