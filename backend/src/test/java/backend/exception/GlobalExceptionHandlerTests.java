package backend.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTests {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void validationErrorsIncludeFieldsWithoutRejectedValues() throws Exception {
        mockMvc.perform(post("/test").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/test"))
                .andExpect(jsonPath("$.validationErrors[0].field").value("name"))
                .andExpect(jsonPath("$.validationErrors[0].rejectedValue").doesNotExist());
    }

    @Test
    void malformedJsonUsesStandardErrorResponse() throws Exception {
        mockMvc.perform(post("/test").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.path").value("/test"));
    }

    @Test
    void unexpectedErrorsDoNotExposeInternalMessages() throws Exception {
        mockMvc.perform(get("/test"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @RestController
    static class TestController {
        @PostMapping("/test")
        public void validate(@Valid @RequestBody TestRequest request) {
        }

        @GetMapping("/test")
        public void fail() {
            throw new IllegalStateException("Internal database details");
        }
    }

    record TestRequest(@NotBlank String name) {
    }
}
