using System.Security.Claims;

namespace Services.Jwts
{
    public interface IJwtService
    {
        /// <summary>
        /// Generer un JWT
        /// </summary>
        /// <param name="_tabClaim">Infos contenu dans le JWT</param>
        /// <returns>Renvoie le JWT</returns>
        string Generer(Claim[] _tabClaim);

        /// <summary>
        /// Generer un JWT pour 2fa
        /// </summary>
        /// <param name="_mail">Mail de la personne qui doit valider le 2fa</param>
        /// <returns>Renvoie le JWT</returns>
        string GenererPour2fa(string _mail);

        /// <summary>
        /// Generer un refresh token valable 2 jours
        /// </summary>
        /// <returns>Renvoie le refresh token</returns>
        string GenererRefreshToken();
    }
}