# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY . .
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /build/target/*.jar /app/app.jar
CMD ["java","-jar","/app/app.jar"]
