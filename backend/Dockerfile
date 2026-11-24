FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn --batch-mode --no-transfer-progress dependency:go-offline
COPY src/main ./src/main
# Tests run separately against disposable PostgreSQL, never during image builds.
RUN mvn --batch-mode --no-transfer-progress -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-jammy AS runtime
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=build --chown=10001:10001 /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
ENV PORT=8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0"
USER 10001:10001
EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]
