FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["back.csproj", "./"]
RUN dotnet restore "back.csproj"
COPY . .
RUN dotnet build "back.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "back.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
# 1. On copie d'abord les fichiers de l'application
COPY --from=publish /app/publish .

# 2. On repasse en root pour créer les dossiers et gérer les droits
USER root
RUN mkdir -p /app/Rsa /app/Photos/Personnage && \
    chown -R app:app /app/Rsa /app/Photos && \
    chmod -R 755 /app/Photos /app/Rsa

# 3. On repasse sur l'utilisateur non-privilégié pour l'exécution
USER app
ENTRYPOINT ["dotnet", "back.dll"]