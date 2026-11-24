package backend.service;

import java.util.UUID;

import backend.dto.AuthResponse;
import backend.dto.LoginRequest;
import backend.dto.RegisterRequest;
import backend.dto.UserResponse;
import backend.exception.AuthException;
import backend.repository.AuthRepository;
import backend.security.AuthPrincipal;
import backend.security.JwtService;
import backend.security.RlsContext;
import backend.security.TokenHash;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthRepository repository;
    private final RlsContext context;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final String dummyHash;

    public AuthService(AuthRepository repository, RlsContext context, PasswordEncoder passwords, JwtService jwt) {
        this.repository = repository;
        this.context = context;
        this.passwords = passwords;
        this.jwt = jwt;
        this.dummyHash = passwords.encode(UUID.randomUUID().toString());
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        var user = new UserResponse(UUID.randomUUID(), request.email(), request.name());
        context.asUser(user.id());
        try {
            repository.createUser(user, passwords.encode(request.password()));
        } catch (DuplicateKeyException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        return createSession(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        context.forLogin(request.email());
        var credentials = repository.findCredentials(request.email());
        boolean matches = passwords.matches(request.password(), credentials.map(AuthRepository.Credentials::passwordHash).orElse(dummyHash));
        if (credentials.isEmpty() || !matches) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        UserResponse user = credentials.get().user();
        context.asUser(user.id());
        return createSession(user);
    }

    @Transactional
    public void validateSession(AuthPrincipal principal, String token) {
        context.asUser(principal.userId());
        if (!repository.isActive(principal.sessionId(), principal.userId(), TokenHash.sha256(token))) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid or expired credentials");
        }
    }

    @Transactional
    public UserResponse me(AuthPrincipal principal) {
        context.asUser(principal.userId());
        return repository.findUser(principal.userId()).orElseThrow(() ->
                new AuthException(HttpStatus.UNAUTHORIZED, "Invalid or expired credentials"));
    }

    @Transactional
    public void logout(AuthPrincipal principal) {
        context.asUser(principal.userId());
        repository.revoke(principal.sessionId(), principal.userId());
    }

    private AuthResponse createSession(UserResponse user) {
        UUID sessionId = UUID.randomUUID();
        var token = jwt.issue(user.id(), sessionId);
        repository.createSession(sessionId, user.id(), TokenHash.sha256(token.value()), token.expiresAt());
        return new AuthResponse(token.value(), "Bearer", token.expiresAt(), user);
    }
}
