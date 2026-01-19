using System.Security.Cryptography;

namespace Services.Mdp
{
    public sealed class MdpService : IMdpService
    {
        private readonly int longeurSel = 16;
        private readonly int longeurCleHash = 32;
        private readonly int nbIteration = 20_000;
        private readonly char delimiteur = '$';
        private char[] CARACTERE_ALPHANUMERIQUE = [
            'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
            'O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b',
            'c','d','e','f','g','h','i','j','k','l','m','n','o','p',
            'q','r','s','t','u','v','w','x','y','z','0','1','2','3',
            '4','5','6','7','8','9'
        ];
        private char[] CARACTERE_SPECIAUX = [
            '@','"','!','@','#','$','£','%','^','&','*',
            '\\','(',')','_','-','+','=','[','{',']','}',
            ';',':','<','>','|','.','/','?','§'
        ];

        public string Generer(ushort _longueurMdp, bool _contientCaractereSpeciaux = true, int _nbCaractereSpeciaux = 0)
        {
            Random.Shared.Shuffle(CARACTERE_ALPHANUMERIQUE);
            Random.Shared.Shuffle(CARACTERE_SPECIAUX);

            char[] motDePasse = new char[_longueurMdp];

            byte[] octetsAleatoires = new byte[_longueurMdp];
            octetsAleatoires = RandomNumberGenerator.GetBytes(_longueurMdp);

            int nbCaracteresSpeciaux = 0;

            if (_contientCaractereSpeciaux)
                nbCaracteresSpeciaux = _nbCaractereSpeciaux > 0 ? _nbCaractereSpeciaux : RandomNumberGenerator.GetInt32(1, _longueurMdp + 1);

            for (int i = 0; i < _longueurMdp; i++)
            {
                int indexAleatoire;

                if (i < nbCaracteresSpeciaux)
                {
                    indexAleatoire = octetsAleatoires[i] % CARACTERE_SPECIAUX.Length;
                    motDePasse[i] = CARACTERE_SPECIAUX[indexAleatoire];
                }
                else
                {
                    indexAleatoire = octetsAleatoires[i] % CARACTERE_ALPHANUMERIQUE.Length;
                    motDePasse[i] = CARACTERE_ALPHANUMERIQUE[indexAleatoire];
                }
            }

            // Mélangez le mot de passe pour plus de sécurité
            RandomNumberGenerator.Shuffle<char>(motDePasse);

            return new string(motDePasse);
        }

        public string Hasher(string _mdp)
        {
            if (string.IsNullOrWhiteSpace(_mdp))
                return "";

            byte[] sel = RandomNumberGenerator.GetBytes(longeurSel);
            byte[] hash = GenererPbkdf2(sel, _mdp);

            return Convert.ToBase64String(sel) + delimiteur + Convert.ToBase64String(hash);
        }

        public bool VerifierHash(string _mdp, string _mdpHash)
        {
            if (string.IsNullOrWhiteSpace(_mdpHash) || string.IsNullOrWhiteSpace(_mdp))
                return false;

            var listeElement = _mdpHash.Split(delimiteur);

            byte[] sel = Convert.FromBase64String(listeElement[0]);
            byte[] mdpHash = Convert.FromBase64String(listeElement[1]);

            var tPbkdf2Mdp = GenererPbkdf2(sel, _mdp);

            return CryptographicOperations.FixedTimeEquals(mdpHash, tPbkdf2Mdp);
        }

        private byte[] GenererPbkdf2(ReadOnlySpan<byte> _sel, string _mdp)
        {
            // 10 000  => mini 
            // 100 000 => max
            // depend de la puissance de la machine
            return Rfc2898DeriveBytes.Pbkdf2(_mdp, _sel, nbIteration, HashAlgorithmName.SHA256, longeurCleHash);
        }
    }
}