package backend.dto;

import java.util.Locale;

import backend.security.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
                           @io.swagger.v3.oas.annotations.media.Schema(format = "password", accessMode = io.swagger.v3.oas.annotations.media.Schema.AccessMode.WRITE_ONLY,
                                   minLength = 1, maxLength = 72, description = "Nonblank; at most 72 UTF-8 bytes; no NUL")
                           @ValidPassword(minCharacters = 1) String password) {
    public LoginRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }

    @Override public String toString() { return "LoginRequest[REDACTED]"; }
}
