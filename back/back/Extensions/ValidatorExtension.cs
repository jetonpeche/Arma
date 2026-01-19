using System.Text.RegularExpressions;
using FluentValidation;

namespace back.Extensions
{
    public static class ValidatorExtension
    {

#pragma warning disable CS1570 // Le code XML du commentaire XML est incorrect
        /// <summary>
        /// Check si le mot de passe contient 1 maj, 1 min, 1 chiffre, 1 caractere spé (#?!@$%^&*-_=+;.,§£§)
        /// Longeur de 8 minimum et est pas vide
        /// </summary>
        public static IRuleBuilderOptions<T, string> MotDePasse<T>(this IRuleBuilder<T, string> ruleBuilder)
#pragma warning restore CS1570 // Le code XML du commentaire XML est incorrect
        {
            return ruleBuilder
                .NotEmpty()
                .MinimumLength(8)
                .Must((mdp) => Regex.IsMatch(mdp, @"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*\-_=+;.,§£§]).{8,}$"))
                .WithMessage("Le mot de passe doit être composé de 1 majuscule, 1 minuscule, 1 chiffre et un caractère spécial (#?!@$%^&*-_=+;.,§£§)");
        }
    }
}
