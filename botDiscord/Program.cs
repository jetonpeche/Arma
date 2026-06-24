using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NetCord.Hosting.Gateway;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddDiscordGateway()
     .AddGatewayHandlers(typeof(Program).Assembly)
     .AddHttpClient("", x =>
     {
          x.BaseAddress = new Uri("http://localhost:5256/api");
     });

var host = builder.Build();

await host.RunAsync();
