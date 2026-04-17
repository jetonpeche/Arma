FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# 1. Crée le répertoire /app/Rsa et Photos
# 2. Change le propriétaire du répertoire à 'app:app' (utilisateur et groupe)
# 3. Définit les permissions à 700 : lecture/écriture/exécution pour le propriétaire 'app', rien pour les autres
RUN mkdir -p /app/Rsa && chown app:app /app/Rsa && chmod 700 /app/Rsa
RUN mkdir -p /app/Photos && chown app:app /app/Photos && chmod 755 /app/Photos

USER app

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

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "back.dll"]