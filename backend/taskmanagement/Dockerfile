FROM maven:3.9-eclipse-temurin-26 AS build

WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:26-jre

WORKDIR /app
RUN useradd --system --create-home --uid 1001 appuser
COPY --from=build /build/target/taskmanagement.jar app.jar
RUN chown appuser:appuser app.jar
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
