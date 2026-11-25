-- V4: Danh sách JWT đã bị thu hồi (người dùng đã đăng xuất)
-- Khớp với entity/RevokedToken.java
-- Cú pháp chạy được trên cả MySQL 8 (Docker) và H2 (chạy local / test)
--
-- JWT là stateless nên server không "xóa" được token. Khi đăng xuất, token được ghi vào bảng này
-- và JwtAuthenticationFilter sẽ từ chối mọi request dùng token đó.
-- Chỉ lưu SHA-256 của token (không lưu token gốc) để nếu DB bị lộ cũng không dùng lại được token.

CREATE TABLE revoked_tokens (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    token_hash  VARCHAR(64) NOT NULL,   -- SHA-256 dạng hex = 64 ký tự
    expires_at  DATETIME(6) NOT NULL,   -- hết hạn của token; quá thời điểm này có thể xóa bản ghi
    revoked_at  DATETIME(6) NOT NULL,

    CONSTRAINT pk_revoked_tokens PRIMARY KEY (id),
    CONSTRAINT uk_revoked_tokens_token_hash UNIQUE (token_hash)
);

-- Dùng cho job dọn dẹp các token đã hết hạn
CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);
