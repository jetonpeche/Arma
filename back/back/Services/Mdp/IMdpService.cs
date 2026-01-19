namespace Services.Mdp
{
    public interface IMdpService
    {
        /// <summary>
        /// Generer un mot de passe aléatoire
        /// </summary>
        /// <param name="_longueurMdp">La longueur du mot de passe (mini 8)</param>
        /// <param name="_contientCaractereSpeciaux">Le mot de passe contient des caractères spéciaux ?</param>
        /// <param name="_nbCaractereSpeciaux">Nombre de caractères spéciaux (SI 0 => le nombre est defini aléatoirement)</param>
        /// <returns>Le mot de passe géneré</returns>
        string Generer(ushort _longueurMdp, bool _contientCaractereSpeciaux = true, int _nbCaractereSpeciaux = 0);

        /// <summary>
        /// Hash le mdp (SHA 256)
        /// </summary>
        /// <param name="_mdp">mdp à hasher</param>
        /// <returns>Le mdp hashé</returns>
        string Hasher(string _mdp);

        /// <summary>
        /// Verifie si le mdp et le mdpHasher correspondent
        /// </summary>
        /// <param name="_mdp">Mdp à vérifier</param>
        /// <param name="_mdpHash">Mdp hashé</param>
        /// <returns>True => OK / False => pas OK</returns>
        bool VerifierHash(string _mdp, string _mdpHash);
    }
}