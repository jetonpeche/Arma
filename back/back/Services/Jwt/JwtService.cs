using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Services.Jwts
{
    public sealed class JwtService : IJwtService
    {
        private RSA Rsa { get; init; }
        private string Issuer { get; init; }

        public JwtService(RSA _rsa, string _issuer)
        {
            Rsa = _rsa;
            Issuer = _issuer;
        }

        public string Generer(Claim[] _tabClaim)
        {
            var gestionnaireJwt = new JsonWebTokenHandler();

            // permet de signer le JWT
            var cle = new RsaSecurityKey(Rsa);

            // creation du JWT
            // par defaut dure 1 heure
            var jwt = gestionnaireJwt.CreateToken(new SecurityTokenDescriptor
            {
                // informations ajouter dans le JWT
                Subject = new ClaimsIdentity(_tabClaim),

                // OBLIGATOIRE => qui est l'émeteur
                // en général mettre URL
                Issuer = Issuer,

                SigningCredentials = new SigningCredentials(cle, SecurityAlgorithms.RsaSha256)
            });

            return jwt;
        }

        public string GenererRefreshToken()
        {
            var gestionnaireJwt = new JsonWebTokenHandler();

            // permet de signer le JWT
            var cle = new RsaSecurityKey(Rsa);

            // creation du Refresh token
            var jwt = gestionnaireJwt.CreateToken(new SecurityTokenDescriptor
            {
                Issuer = Issuer,
                Expires = DateTime.Now.AddDays(2),
                SigningCredentials = new SigningCredentials(cle, SecurityAlgorithms.RsaSha256)
            });

            return jwt!;
        }

        public string GenererPour2fa(string _mail)
        {
            var gestionnaireJwt = new JsonWebTokenHandler();

            // permet de signer le JWT
            var cle = new RsaSecurityKey(Rsa);

            // creation du JWT
            // par defaut dure 1 heure
            var jwt = gestionnaireJwt.CreateToken(new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity([
                    new Claim(ClaimTypes.Role, "jwt2fa"),
                    new Claim("mail", _mail)
                ]),

                Issuer = Issuer,
                Expires = DateTime.Now.AddMinutes(2),
                SigningCredentials = new SigningCredentials(cle, SecurityAlgorithms.RsaSha256)
            });

            return jwt!;
        }
    }
}