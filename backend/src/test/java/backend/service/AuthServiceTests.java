package backend.service;

import java.util.Optional;
import java.util.UUID;

import backend.dto.LoginRequest;
import backend.dto.RegisterRequest;
import backend.dto.UserResponse;
import backend.exception.AuthException;
import backend.repository.AuthRepository;
import backend.security.AuthPrincipal;
import backend.security.JwtService;
import backend.security.RlsContext;
import backend.security.TokenHash;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {
    @Mock private AuthRepository repository;
    @Mock private RlsContext context;
    @Mock private PasswordEncoder passwords;
    @Mock private JwtService jwt;
    private AuthService service;

    @BeforeEach
    void createService() {
        when(passwords.encode(anyString())).thenReturn("dummy-bcrypt");
        service = new AuthService(repository, context, passwords, jwt);
    }

    @Test
    void registrationNormalizesInputAndStoresOnlyEncodedPasswordAndHashedToken() {
        var issued = new JwtService.IssuedToken("fictional-test-token", java.time.Instant.now().plusSeconds(900));
        when(jwt.issue(any(), any())).thenReturn(issued);
        when(passwords.encode("Example password 123!")).thenReturn("encoded-password");
        var response = service.register(new RegisterRequest(" ALICE@EXAMPLE.COM ", " Alice ", "Example password 123!"));
        var user = ArgumentCaptor.forClass(UserResponse.class);
        verify(repository).createUser(user.capture(), eq("encoded-password"));
        assertThat(user.getValue().email()).isEqualTo("alice@example.com");
        assertThat(user.getValue().name()).isEqualTo("Alice");
        verify(context).asUser(user.getValue().id());
        verify(repository).createSession(any(UUID.class), eq(user.getValue().id()),
                eq(TokenHash.sha256(issued.value())), eq(issued.expiresAt()));
        assertThat(response.user()).isEqualTo(user.getValue());
    }

    @Test
    void unknownEmailStillChecksBcryptAndNeverCreatesASession() {
        when(repository.findCredentials("unknown@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.login(new LoginRequest("unknown@example.com", "wrong")))
                .isInstanceOfSatisfying(AuthException.class, error -> {
                    assertThat(error.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(error.getMessage()).isEqualTo("Invalid email or password");
                });
        verify(passwords).matches("wrong", "dummy-bcrypt");
        verify(repository, never()).createSession(any(), any(), any(), any());
        verify(context, never()).asUser(any());
    }

    @Test
    void wrongPasswordDoesNotEstablishOwnerContextOrIssueTokens() {
        var user = new UserResponse(UUID.randomUUID(), "alice@example.com", "Alice");
        when(repository.findCredentials(user.email())).thenReturn(Optional.of(new AuthRepository.Credentials(user, "stored-hash")));
        assertThatThrownBy(() -> service.login(new LoginRequest(user.email(), "wrong")))
                .isInstanceOf(AuthException.class).hasMessage("Invalid email or password");
        verify(context, never()).asUser(any());
        verifyNoInteractions(jwt);
    }

    @Test
    void successfulLoginSetsOwnerOnlyAfterPasswordVerification() {
        var user = new UserResponse(UUID.randomUUID(), "alice@example.com", "Alice");
        when(repository.findCredentials(user.email())).thenReturn(Optional.of(new AuthRepository.Credentials(user, "stored-hash")));
        when(passwords.matches("valid password", "stored-hash")).thenReturn(true);
        when(jwt.issue(any(), any())).thenReturn(new JwtService.IssuedToken("fictional-test-token", java.time.Instant.now().plusSeconds(900)));
        service.login(new LoginRequest(" ALICE@example.com ", "valid password"));
        var order = inOrder(context, passwords, repository);
        order.verify(context).forLogin(user.email());
        order.verify(repository).findCredentials(user.email());
        order.verify(passwords).matches("valid password", "stored-hash");
        order.verify(context).asUser(user.id());
        order.verify(repository).createSession(any(), eq(user.id()), any(), any());
    }

    @Test
    void revokedSessionFailsClosedAndLogoutTargetsOnlyThePrincipalSession() {
        var principal = new AuthPrincipal(UUID.randomUUID(), UUID.randomUUID());
        assertThatThrownBy(() -> service.validateSession(principal, "fictional-test-token"))
                .isInstanceOf(AuthException.class);
        service.logout(principal);
        verify(repository).revoke(principal.sessionId(), principal.userId());
        verify(repository).isActive(principal.sessionId(), principal.userId(), TokenHash.sha256("fictional-test-token"));
    }
}
