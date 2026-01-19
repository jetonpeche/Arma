namespace back.Extensions
{
    public static class ProducesExtension
    {
        /// <summary>
        /// Renvoie un code erreur 404
        /// </summary>
        public static RouteHandlerBuilder ProducesNotFound(this RouteHandlerBuilder builder)
            => builder.Produces(StatusCodes.Status404NotFound);

        /// <summary>
        /// Renvoie un code erreur 204
        /// </summary>
        public static RouteHandlerBuilder ProducesNoContent(this RouteHandlerBuilder builder)
            => builder.Produces(StatusCodes.Status204NoContent);

        /// <summary>
        /// Renvoie un code erreur 201 avec valeur de retour
        /// </summary>
        public static RouteHandlerBuilder ProducesCreated<TRetour>(this RouteHandlerBuilder builder)
            => builder.Produces<TRetour>(StatusCodes.Status201Created);

        /// <summary>
        /// Renvoie un code erreur 201
        /// </summary>
        public static RouteHandlerBuilder ProducesCreated(this RouteHandlerBuilder builder)
            => builder.Produces(StatusCodes.Status201Created);

        /// <summary>
        /// Renvoie un code erreur 400 avec possible message
        /// </summary>
        public static RouteHandlerBuilder ProducesBadRequest(this RouteHandlerBuilder builder)
            => builder.Produces(StatusCodes.Status400BadRequest);

        /// <summary>
        /// Renvoie un code erreur 429 trop de requete
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static RouteHandlerBuilder ProducesToManyRequests(this RouteHandlerBuilder builder)
            => builder.Produces(StatusCodes.Status429TooManyRequests);
        /// <summary>
        /// Renvoie un code erreur 404 avec les erreurs de validations
        /// </summary>
        public static RouteHandlerBuilder ProducesBadRequestErreurValidation(this RouteHandlerBuilder builder)
            => builder.Produces<ErreurValidation>(StatusCodes.Status400BadRequest);
        /// <summary>
        /// Renvoie un code erreur 503. Peut être mis sur tout les endpoints d'une route
        /// </summary>
        public static IEndpointConventionBuilder ProducesServiceUnavailable(this RouteGroupBuilder builder)
        {
            return builder.WithMetadata(new ProducesResponseTypeMetadata(
                    StatusCodes.Status503ServiceUnavailable,
                    typeof(string))
                );
        }

        /// <summary>
        /// Renvoie un code erreur 429. Peut être mis sur tout les endpoints d'une route
        /// </summary>
        public static IEndpointConventionBuilder ProducesToManyRequests(this RouteGroupBuilder builder)
        {
            return builder.WithMetadata(new ProducesResponseTypeMetadata(
                    StatusCodes.Status429TooManyRequests,
                    typeof(string))
                );
        }
    }
}
