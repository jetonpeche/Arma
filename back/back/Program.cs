using back;
using back.Extensions;
using back.Models;
using FluentValidation;
using LiteDB;
using Microsoft.Extensions.FileProviders;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

string cheminCleRsa = builder.Configuration.GetValue<string>("cheminCleRsa")!;

RSA rsa = RSA.Create();

if (!Directory.Exists("Rsa"))
    Directory.CreateDirectory("Rsa");

if (!Directory.Exists("Photos"))
     Directory.CreateDirectory("Photos");

// creer la cle une seule fois
if (!File.Exists(cheminCleRsa))
{
    // cree un fichier bin pour signer le JWT
    var clePriver = rsa.ExportRSAPrivateKey();
    File.WriteAllBytes(cheminCleRsa, clePriver);
}

// recupere la cl�
rsa.ImportRSAPrivateKey(File.ReadAllBytes(cheminCleRsa), out _);
builder.Services.AjouterSecuriteJwt(rsa);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AjouterSwagger();

builder.Services.AddMemoryCache();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddCors(x => x.AddDefaultPolicy(y => y.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AjouterService(rsa);

var app = builder.Build();

// permet d'avoir acces au fichier du dossier Photos par url
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "Photos")
    ),
    RequestPath = "/Photos"
});

app.UseCors();
// l'ordre est important
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();

// cacher la liste des models import / export dans swagger
app.UseSwaggerUI(x => x.DefaultModelsExpandDepth(-1));

app.AjouterRouteAPI();

// init la banque
using (var db = new LiteDatabase(Constant.BDD_NOM))
{
     var banque = db.GetCollection<Banque>().FindOne(x => x.Id == 1);

     if (banque is null)
          db.GetCollection<Banque>().Insert(new Banque { Id = 1, Argent = 0 });
}

app.Run();
