using System.Security.Cryptography;

namespace Services.Mdp;

public sealed class MdpService : IMdpService
{
     private readonly int longeurSel = 16;
     private readonly int longeurCleHash = 32;
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
          RandomNumberGenerator.Shuffle(CARACTERE_ALPHANUMERIQUE);
          RandomNumberGenerator.Shuffle(CARACTERE_SPECIAUX);

          char[] motDePasse = new char[_longueurMdp];

          int nbCaracteresSpeciaux = 0;

          if (_contientCaractereSpeciaux)
               nbCaracteresSpeciaux = _nbCaractereSpeciaux > 0 ? _nbCaractereSpeciaux : RandomNumberGenerator.GetInt32(1, _longueurMdp + 1);

          for (int i = 0; i < _longueurMdp; i++)
          {
               if (i < nbCaracteresSpeciaux)
                    motDePasse[i] = CARACTERE_SPECIAUX[RandomNumberGenerator.GetInt32(CARACTERE_SPECIAUX.Length)];
               else
                    motDePasse[i] = CARACTERE_ALPHANUMERIQUE[RandomNumberGenerator.GetInt32(CARACTERE_ALPHANUMERIQUE.Length)];
          }

          // Mélangez le mot de passe pour plus de sécurité
          RandomNumberGenerator.Shuffle(motDePasse);

          return new string(motDePasse);
     }

     public string Hasher(string _mdp, int _nbIteration = 600_000)
     {
          if (string.IsNullOrWhiteSpace(_mdp))
               return "";

          byte[] sel = RandomNumberGenerator.GetBytes(longeurSel);
          byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
               _mdp,
               sel,
               _nbIteration,
               HashAlgorithmName.SHA256,
               longeurCleHash
          );

          return Convert.ToBase64String(sel) + delimiteur + _nbIteration + delimiteur + Convert.ToBase64String(hash);
     }

     public bool VerifierHash(string _mdp, string _mdpHash)
     {
          if (string.IsNullOrWhiteSpace(_mdpHash) || string.IsNullOrWhiteSpace(_mdp))
               return false;

          var listeElement = _mdpHash.Split(delimiteur);

          if (listeElement.Length != 3)
               return false;

          try
          {
               byte[] sel = Convert.FromBase64String(listeElement[0]);
               int nbIteration = int.Parse(listeElement[1]);
               byte[] mdpHash = Convert.FromBase64String(listeElement[2]);

               var tPbkdf2Mdp = Rfc2898DeriveBytes.Pbkdf2(
                    _mdp,
                    sel,
                    nbIteration,
                    HashAlgorithmName.SHA256,
                    longeurCleHash
               );

               return CryptographicOperations.FixedTimeEquals(mdpHash, tPbkdf2Mdp);
          }
          catch
          {
               return false;
          }
     }
}