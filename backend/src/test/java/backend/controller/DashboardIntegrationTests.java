package backend.controller;

import java.sql.Connection;
import java.sql.Date;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=")
@AutoConfigureMockMvc
@Import(DashboardIntegrationTests.FixedDate.class)
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class DashboardIntegrationTests extends PostgresTestSupport {
    private static final LocalDate TODAY = LocalDate.of(2026, 3, 10);
    private static final UUID FIRST = UUID.fromString("00000000-0000-0000-0000-000000000011");
    private static final UUID SECOND = UUID.fromString("00000000-0000-0000-0000-000000000012");
    private static final UUID FOREIGN = UUID.fromString("00000000-0000-0000-0000-000000000013");
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private EntityManagerFactory entityManagerFactory;
    private Account owner;
    private Account other;

    @TestConfiguration
    static class FixedDate {
        @Bean @Primary
        Clock fixedDashboardClock() {
            return Clock.fixed(Instant.parse("2026-03-10T23:59:59Z"), ZoneOffset.UTC);
        }
    }

    @BeforeEach
    void fixtures() throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
        }
        owner = register("owner@example.com");
        other = register("other@example.com");
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("INSERT INTO public.projects(id,owner_id,name) VALUES ('" + FIRST + "','" + owner.id() + "','First'),"
                    + "('" + SECOND + "','" + owner.id() + "','Second'),('" + FOREIGN + "','" + other.id() + "','Other')");
        }
    }

    @Test
    void allDashboardEndpointsRequireAuthentication() throws Exception {
        for (String path : new String[]{"summary", "upcoming", "overdue"}) {
            mvc.perform(get("/api/dashboard/" + path)).andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }
    }

    @Test
    void zeroTasksReturnZeroPercentageAndEmptyPages() throws Exception {
        for (String query : new String[]{"", "?projectId=" + FIRST}) {
            mvc.perform(get("/api/dashboard/summary" + query).header("Authorization", owner.header()))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(0))
                    .andExpect(jsonPath("$.todoTasks").value(0)).andExpect(jsonPath("$.inProgressTasks").value(0))
                    .andExpect(jsonPath("$.doneTasks").value(0)).andExpect(jsonPath("$.completionPercentage").value(0));
            for (String endpoint : new String[]{"upcoming", "overdue"}) {
                mvc.perform(get("/api/dashboard/" + endpoint + query).header("Authorization", owner.header()))
                        .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0))
                        .andExpect(jsonPath("$.size").value(10)).andExpect(jsonPath("$.totalElements").value(0));
            }
        }
    }

    @Test
    void summaryAggregatesAllStatusesInOneQueryWithoutLoadingEntitiesAndFiltersProjects() throws Exception {
        task(FIRST, "Todo", "TODO", null);
        task(FIRST, "Doing", "IN_PROGRESS", TODAY);
        task(FIRST, "Done", "DONE", TODAY.minusDays(1));
        task(SECOND, "Second todo", "TODO", TODAY.plusDays(1));
        task(SECOND, "Second done", "DONE", null);
        task(FOREIGN, "Not mine", "DONE", TODAY);
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            mvc.perform(get("/api/dashboard/summary").header("Authorization", owner.header()))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(5))
                    .andExpect(jsonPath("$.todoTasks").value(2)).andExpect(jsonPath("$.inProgressTasks").value(1))
                    .andExpect(jsonPath("$.doneTasks").value(2)).andExpect(jsonPath("$.completionPercentage").value(40));
            assertThat(statistics.getEntityLoadCount()).isZero();
            assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
        } finally { statistics.setStatisticsEnabled(false); }
        mvc.perform(get("/api/dashboard/summary").param("projectId", FIRST.toString()).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(3))
                .andExpect(jsonPath("$.completionPercentage").value(33.33));
        mvc.perform(get("/api/dashboard/summary").header("Authorization", other.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(1))
                .andExpect(jsonPath("$.completionPercentage").value(100));
    }

    @Test
    void upcomingIncludesTodayAndDaySevenButExcludesDayEightNullDatesDoneAndForeignTasks() throws Exception {
        task(FIRST, "Yesterday", "TODO", TODAY.minusDays(1));
        task(FIRST, "Today", "TODO", TODAY);
        task(FIRST, "Seventh day", "IN_PROGRESS", TODAY.plusDays(7));
        task(FIRST, "Eighth day", "TODO", TODAY.plusDays(8));
        task(FIRST, "No due date", "TODO", null);
        task(FIRST, "Done today", "DONE", TODAY);
        task(FIRST, "Done seventh day", "DONE", TODAY.plusDays(7));
        task(FOREIGN, "Foreign", "TODO", TODAY);
        task(SECOND, "Second project", "TODO", TODAY.plusDays(1));
        mvc.perform(get("/api/dashboard/upcoming").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].title").value("Today"))
                .andExpect(jsonPath("$.content[1].title").value("Second project"))
                .andExpect(jsonPath("$.content[2].title").value("Seventh day"));
        mvc.perform(get("/api/dashboard/upcoming").param("projectId", FIRST.toString()).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void overdueIsStrictlyBeforeTodayAndExcludesDoneNullDatesAndForeignTasks() throws Exception {
        task(FIRST, "Older", "IN_PROGRESS", TODAY.minusDays(2));
        task(FIRST, "Yesterday", "TODO", TODAY.minusDays(1));
        task(FIRST, "Today", "TODO", TODAY);
        task(FIRST, "Done yesterday", "DONE", TODAY.minusDays(1));
        task(FIRST, "Undated", "TODO", null);
        task(SECOND, "Other owned project", "TODO", TODAY.minusDays(1));
        task(FOREIGN, "Foreign overdue", "TODO", TODAY.minusDays(3));
        mvc.perform(get("/api/dashboard/overdue").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].title").value("Older"));
        mvc.perform(get("/api/dashboard/overdue").param("projectId", FIRST.toString()).header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void foreignAndMissingProjectFiltersReturn404AndInvalidParametersReturn400() throws Exception {
        for (String endpoint : new String[]{"summary", "upcoming", "overdue"}) {
            for (UUID id : new UUID[]{FOREIGN, UUID.randomUUID()}) {
                mvc.perform(get("/api/dashboard/" + endpoint).param("projectId", id.toString())
                                .header("Authorization", owner.header()))
                        .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Project not found"));
            }
            mvc.perform(get("/api/dashboard/" + endpoint).param("projectId", "invalid").header("Authorization", owner.header()))
                    .andExpect(status().isBadRequest());
        }
        for (String endpoint : new String[]{"upcoming", "overdue"}) {
            for (String query : new String[]{"page=-1", "size=0", "size=101", "page=invalid"}) {
                mvc.perform(get("/api/dashboard/" + endpoint + "?" + query).header("Authorization", owner.header()))
                        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
            }
        }
    }

    @Test
    void sameDateOrderingIsDeterministicAndPaginationRetainsTotalsAndArchivedTasks() throws Exception {
        UUID first = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID second = UUID.fromString("80000000-0000-0000-0000-000000000002");
        task(second, FIRST, "Second", "TODO", TODAY);
        task(first, FIRST, "First", "TODO", TODAY);
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("UPDATE public.projects SET status='ARCHIVED' WHERE id='" + FIRST + "'");
        }
        mvc.perform(get("/api/dashboard/upcoming?size=1&page=0").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(first.toString()))
                .andExpect(jsonPath("$.totalElements").value(2)).andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get("/api/dashboard/upcoming?size=1&page=1").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(second.toString()));
        mvc.perform(get("/api/dashboard/upcoming?page=99").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/dashboard/summary").header("Authorization", owner.header()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(2));
    }

    private void task(UUID project, String title, String status, LocalDate due) throws Exception {
        task(UUID.randomUUID(), project, title, status, due);
    }

    private void task(UUID id, UUID project, String title, String status, LocalDate due) throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.prepareStatement(
                "INSERT INTO public.tasks(id,project_id,title,status,due_date) VALUES (?,?,?,CAST(? AS public.\"TaskStatus\"),?)")) {
            statement.setObject(1, id);
            statement.setObject(2, project);
            statement.setString(3, title);
            statement.setString(4, status);
            statement.setDate(5, due == null ? null : Date.valueOf(due));
            statement.executeUpdate();
        }
    }

    private Account register(String email) throws Exception {
        JsonNode result = json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "name", "User", "password", "correct horse battery staple"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return new Account(UUID.fromString(result.path("user").path("id").asText()), result.path("accessToken").asText());
    }

    private record Account(UUID id, String token) {
        String header() { return "Bearer " + token; }
        @Override public String toString() { return "Account[REDACTED]"; }
    }
}
