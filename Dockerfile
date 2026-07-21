# ================================================================
# ROSS MILLE Web - Dockerfile multi-stage
# Etapa 1: compila el jar con Maven (usa el wrapper del repo)
# Etapa 2: imagen de solo runtime (JRE), mas liviana para produccion
# ================================================================

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# El mvnw de este repo descarga Maven por su cuenta con curl/wget la primera vez
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copiar primero el wrapper y el pom para cachear las dependencias
# en una capa separada (solo se reconstruye si pom.xml cambia)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# mvnw suele traer finales de linea CRLF si el repo se clono en Windows;
# eso rompe el shebang dentro del contenedor Linux, asi que se normaliza aqui.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B dependency:go-offline

# Copiar el codigo fuente y empaquetar (sin correr tests en el build de imagen)
COPY src ./src
RUN ./mvnw -B clean package -DskipTests

# ----------------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Usuario sin privilegios para correr la app (no root)
RUN addgroup --system rossmille && adduser --system --ingroup rossmille rossmille
COPY --from=build /app/target/rossmille-web-*.jar app.jar
RUN chown rossmille:rossmille app.jar
USER rossmille

# Railway inyecta PORT en tiempo de ejecucion; application.yml ya lo respeta
# via server.port: ${PORT:8080}
EXPOSE 8080

# JAVA_OPTS permite ajustar memoria desde las variables de entorno de Railway
# sin tener que reconstruir la imagen (ej: JAVA_OPTS=-Xmx256m)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
