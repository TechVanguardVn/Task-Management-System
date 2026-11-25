# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: build - dùng JDK + Maven Wrapper để build file .jar
# =============================================================================
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
# Phòng trường hợp mvnw bị đổi sang xuống dòng kiểu Windows (CRLF) khi checkout trên Windows
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

COPY src src
# Cache thư mục ~/.m2 giữa các lần build để không phải tải lại thư viện.
# Bỏ qua test ở đây: test đã chạy riêng bằng "./mvnw test" (và trên CI).
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q package -DskipTests \
    && cp target/*.jar app.jar

# =============================================================================
# Stage 2: runtime - chỉ cần JRE, image nhỏ hơn và không chứa source code
# =============================================================================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Chạy bằng user thường, không dùng root
RUN groupadd --system spring && useradd --system --gid spring --no-create-home spring
COPY --from=build /workspace/app.jar app.jar
USER spring

EXPOSE 8080

# Tối ưu cho container RAM nhỏ (vd gói free 512MB của Render), đo thực tế app dùng ~300MB:
#   MaxRAMPercentage=60 : heap tối đa 60% RAM, chừa chỗ cho phần ngoài heap (class, thread, code cache)
#   UseSerialGC         : bộ dọn rác tốn ít bộ nhớ nhất, hợp với 1 CPU
#   Xss512k             : giảm bộ nhớ cho mỗi thread
# Muốn đổi thì set biến môi trường JAVA_OPTS khi chạy container.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -Xss512k"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
